# Sprint 2 — API + Libs + Form · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire up the three missing infrastructure pieces so Ana can fill a web form and get a fully-generated, publicly-accessible course in ~5 minutes, with no terminal required.

**Architecture:** `lib/render.ts` wraps `scripts/build-course.js` in a TypeScript function callable from the API route. `lib/github.ts` uses Octokit to commit the course JSON to the repo (audit trail + triggers Vercel CI). `api/generate-course.ts` already exists as a skeleton — it just needs the two missing imports resolved. The admin form at `app/admin/nova-live/page.tsx` already exists; it only needs a secondary-products section and real progress feedback.

**Tech Stack:** Next.js 14 (Pages API route), TypeScript, Handlebars (via `scripts/build-course.js` logic), Octokit 3, Anthropic SDK 0.27, Zod 3, TailwindCSS

---

## File Map

| File | Status | What it does |
|------|--------|-------------|
| `lib/render.ts` | **Create** | TypeScript wrapper: receives `courseData` object → writes 10 HTMLs to `public/[slug]/[date]/` → returns `string[]` of relative paths |
| `lib/github.ts` | **Create** | Octokit wrapper: `commitCourseData(filename, data)` + `triggerVercelBuild()` |
| `lib/validation.ts` | **Create** | Extracts `FormInputSchema` + `CourseDataSchema` from `lib/claude.ts` into shared module |
| `lib/claude.ts` | **Modify** | Import `FormInputSchema` from `lib/validation.ts` instead of defining inline |
| `api/generate-course.ts` | **Modify** | All imports now resolve → add runtime type annotation for req.body |
| `app/admin/nova-live/page.tsx` | **Modify** | Add secondary-products section + real-time progress toasts |
| `scripts/build-course.js` | Already correct (color fixed in Sprint 1 review) | No changes needed |

---

## Task 1: `lib/validation.ts` — Shared Zod Schemas

**Files:**
- Create: `lib/validation.ts`
- Modify: `lib/claude.ts` (lines 13-60 — remove inline schema, import from validation)

- [ ] **Step 1: Create `lib/validation.ts`**

```typescript
import { z } from 'zod';

export const FormInputSchema = z.object({
  selliver: z.object({
    slug: z.string().min(1),
    name: z.string().min(1),
    level: z.enum(['iniciante', 'intermediaria', 'pro']),
    previous_lives: z.number().int().min(0),
    whatsapp: z.string().optional(),
  }),
  live: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
    time: z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM'),
    duration_min: z.number().int().min(30).max(240),
    context: z.enum(['regular', 'brand-day', 'cast-day', 'lancamento']),
    master_coupon: z.string().min(1),
  }),
  hero: z.object({
    name: z.string().min(1),
    category: z.string().min(1),
    price_full: z.number().positive(),
    price_live: z.number().positive(),
    extra_coupon: z.string().optional(),
    stock: z.number().int().min(0),
    differentials: z.array(z.object({
      label: z.string().min(1),
      description: z.string().min(1),
    })).min(1).max(6),
    main_objection: z.string().min(1),
  }),
  secondary_products: z.array(z.object({
    name: z.string().min(1),
    price_live: z.number().positive(),
    bundle_with_hero: z.boolean(),
  })).optional().default([]),
  compliance: z.object({
    regulated_category: z.string().min(1),
    forbidden_claims: z.array(z.string()).min(1),
    allowed_claims: z.array(z.string()).min(1),
    anvisa_registration: z.string().optional(),
  }),
});

export type FormInput = z.infer<typeof FormInputSchema>;
```

- [ ] **Step 2: Update `lib/claude.ts` to import from validation**

Replace the inline `FormInputSchema` definition and `FormInput` type in `lib/claude.ts` (lines 13–58) with:

```typescript
import { FormInputSchema, type FormInput } from './validation';
```

Remove the `z` import from `lib/claude.ts` (no longer needed there).

- [ ] **Step 3: Run type-check to confirm no regressions**

```bash
cd /Users/macbookcasa/dev/onlive-cursos && npx tsc --noEmit
```

Expected: 0 errors (or only pre-existing errors unrelated to these files).

- [ ] **Step 4: Commit**

```bash
cd /Users/macbookcasa/dev/onlive-cursos
git add lib/validation.ts lib/claude.ts
git commit -m "refactor: extract FormInputSchema to lib/validation.ts"
```

---

## Task 2: `lib/render.ts` — TypeScript Render Wrapper

**Files:**
- Create: `lib/render.ts`

The build logic lives in `scripts/build-course.js` (CommonJS). `lib/render.ts` calls it as a child process with the courseData written to a temp file, then returns the list of built HTML paths. This avoids duplicating the render engine in TypeScript while keeping the API callable.

- [ ] **Step 1: Create `lib/render.ts`**

```typescript
import { execSync } from 'child_process';
import { writeFileSync, existsSync, readdirSync, unlinkSync } from 'fs';
import { join, resolve } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';

const ROOT = resolve(process.cwd());
const BUILD_SCRIPT = join(ROOT, 'scripts', 'build-course.js');

export interface RenderResult {
  outputDir: string;
  files: string[];
}

export async function buildCourseFromData(courseData: Record<string, unknown>): Promise<RenderResult> {
  // Write courseData to a temp JSON file
  const tmpFile = join(tmpdir(), `onlive-course-${randomUUID()}.json`);
  writeFileSync(tmpFile, JSON.stringify(courseData, null, 2), 'utf-8');

  try {
    // Run the build script synchronously (it completes in <5s)
    execSync(`node ${BUILD_SCRIPT} ${tmpFile}`, {
      cwd: ROOT,
      stdio: 'pipe',
      timeout: 60_000,
    });
  } finally {
    // Always clean up temp file
    if (existsSync(tmpFile)) unlinkSync(tmpFile);
  }

  // Collect output paths
  const slug = (courseData as any).selliver?.slug;
  const date = (courseData as any).live?.date;
  if (!slug || !date) throw new Error('courseData missing selliver.slug or live.date');

  const outDir = join(ROOT, 'public', slug, date);
  const files = readdirSync(outDir).map((f) => `/${slug}/${date}/${f}`);

  return { outputDir: outDir, files };
}
```

- [ ] **Step 2: Run type-check**

```bash
cd /Users/macbookcasa/dev/onlive-cursos && npx tsc --noEmit
```

Expected: 0 new errors.

- [ ] **Step 3: Smoke-test `buildCourseFromData` manually**

```bash
cd /Users/macbookcasa/dev/onlive-cursos
node -e "
const { buildCourseFromData } = require('./lib/render');
const data = require('./public/kamille/2026-05-12/_data.json');
buildCourseFromData(data).then(r => console.log('OK', r.files.length, 'files')).catch(console.error);
"
```

Expected: `OK 12 files` (10 HTMLs + _data.json + videos.json).

Note: This will clobber the existing kamille build — that's fine, it's test data.

- [ ] **Step 4: Commit**

```bash
git add lib/render.ts
git commit -m "feat: add lib/render.ts — TypeScript wrapper for build-course.js"
```

---

## Task 3: `lib/github.ts` — Octokit Commit + Vercel Trigger

**Files:**
- Create: `lib/github.ts`

Required env vars (must exist in `.env.local` and Vercel project settings):
- `GITHUB_TOKEN` — Personal access token with `repo` scope
- `GITHUB_OWNER` — e.g. `onlive-br`
- `GITHUB_REPO` — e.g. `onlive-cursos`
- `VERCEL_DEPLOY_HOOK` — URL from Vercel project → Settings → Git → Deploy Hooks

- [ ] **Step 1: Create `lib/github.ts`**

```typescript
import { Octokit } from 'octokit';

function getOctokit() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN env var not set');
  return new Octokit({ auth: token });
}

function getRepo() {
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  if (!owner || !repo) throw new Error('GITHUB_OWNER or GITHUB_REPO env var not set');
  return { owner, repo };
}

export async function commitCourseData(
  filename: string,
  data: Record<string, unknown>
): Promise<void> {
  const octokit = getOctokit();
  const { owner, repo } = getRepo();
  const path = `data/${filename}`;
  const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
  const message = `data: add course ${filename}`;

  // Check if file already exists (to get its SHA for update)
  let sha: string | undefined;
  try {
    const { data: existing } = await octokit.rest.repos.getContent({ owner, repo, path });
    if (!Array.isArray(existing) && 'sha' in existing) sha = existing.sha;
  } catch {
    // 404 = new file, sha stays undefined
  }

  await octokit.rest.repos.createOrUpdateFileContents({
    owner, repo, path, message, content, sha,
  });
}

export async function triggerVercelBuild(): Promise<void> {
  const hook = process.env.VERCEL_DEPLOY_HOOK;
  if (!hook) {
    console.warn('[github] VERCEL_DEPLOY_HOOK not set — skipping redeploy trigger');
    return;
  }
  const res = await fetch(hook, { method: 'POST' });
  if (!res.ok) throw new Error(`Vercel hook failed: ${res.status}`);
}
```

- [ ] **Step 2: Run type-check**

```bash
cd /Users/macbookcasa/dev/onlive-cursos && npx tsc --noEmit
```

Expected: 0 new errors.

- [ ] **Step 3: Commit**

```bash
git add lib/github.ts
git commit -m "feat: add lib/github.ts — Octokit commit + Vercel deploy trigger"
```

---

## Task 4: Wire `api/generate-course.ts`

**Files:**
- Modify: `api/generate-course.ts` (all imports now resolve)

The file already exists and is complete in logic. The only work is confirming imports are correct and adding the missing `lib/` files verified above.

- [ ] **Step 1: Verify imports resolve**

```bash
cd /Users/macbookcasa/dev/onlive-cursos && npx tsc --noEmit
```

Expected: 0 errors for `api/generate-course.ts`. If there are errors, they'll be from missing env vars in types — fix by adding `as string` cast or optional chaining.

- [ ] **Step 2: Fix `req.body` typing**

In `api/generate-course.ts` line 29, change:

```typescript
// Before
const form = req.body as FormInput;
```

```typescript
// After
const form = FormInputSchema.parse(req.body);
```

And add the import at the top of `api/generate-course.ts`:

```typescript
import { FormInputSchema } from '../lib/validation';
```

This makes the Zod parse the true validation entrypoint (the `generateCourseData` call also parses, but having it at the API boundary gives better error messages to the caller).

- [ ] **Step 3: Run type-check one more time**

```bash
npx tsc --noEmit
```

Expected: 0 errors in `api/generate-course.ts`.

- [ ] **Step 4: Commit**

```bash
git add api/generate-course.ts
git commit -m "fix: wire api/generate-course.ts — all imports resolve, Zod parse at boundary"
```

---

## Task 5: `app/admin/nova-live/page.tsx` — Secondary Products + Progress UX

**Files:**
- Modify: `app/admin/nova-live/page.tsx`

The form is complete for the main fields. Two gaps:
1. No way to add secondary products (the schema supports up to N items)
2. The submit button just says "Gerando..." for 3-5 minutes with no feedback

- [ ] **Step 1: Add secondary products state and section**

In the `useState` block, add after the `form` state:

```typescript
const [secondaryProducts, setSecondaryProducts] = useState<
  { name: string; price_live: number; bundle_with_hero: boolean }[]
>([]);
```

Add this section to the JSX, just before the Compliance section:

```tsx
{/* ===== Secondary Products ===== */}
<section className="bg-white rounded-xl border p-6">
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-xl font-bold">Produtos Secundários</h2>
    <button
      type="button"
      onClick={() => setSecondaryProducts([...secondaryProducts, { name: '', price_live: 0, bundle_with_hero: false }])}
      className="text-purple-600 font-bold text-sm hover:text-purple-800"
    >
      + Adicionar
    </button>
  </div>
  {secondaryProducts.length === 0 && (
    <p className="text-sm text-gray-400">Nenhum. Opcional — add só se vai fazer cross-sell na live.</p>
  )}
  {secondaryProducts.map((p, i) => (
    <div key={i} className="grid grid-cols-4 gap-3 mb-3 items-end">
      <div className="col-span-2">
        <Field
          label={`Nome ${i + 1}`}
          value={p.name}
          onChange={(v) => {
            const ns = [...secondaryProducts];
            ns[i] = { ...ns[i], name: v };
            setSecondaryProducts(ns);
          }}
        />
      </div>
      <Field
        label="Preço live"
        type="number"
        value={String(p.price_live)}
        onChange={(v) => {
          const ns = [...secondaryProducts];
          ns[i] = { ...ns[i], price_live: Number(v) };
          setSecondaryProducts(ns);
        }}
      />
      <div className="flex items-center gap-2 pb-1">
        <input
          type="checkbox"
          id={`bundle-${i}`}
          checked={p.bundle_with_hero}
          onChange={(e) => {
            const ns = [...secondaryProducts];
            ns[i] = { ...ns[i], bundle_with_hero: e.target.checked };
            setSecondaryProducts(ns);
          }}
          className="accent-purple-600"
        />
        <label htmlFor={`bundle-${i}`} className="text-sm text-gray-700">Bundle?</label>
        <button
          type="button"
          onClick={() => setSecondaryProducts(secondaryProducts.filter((_, j) => j !== i))}
          className="ml-auto text-red-400 hover:text-red-600 text-sm"
        >
          ✕
        </button>
      </div>
    </div>
  ))}
</section>
```

- [ ] **Step 2: Include secondary products in the submit payload**

In `handleSubmit`, update the `payload` construction to include secondary products:

```typescript
const payload = {
  ...form,
  hero: {
    ...form.hero,
    differentials: form.differentials.filter((d) => d.label && d.description),
  },
  secondary_products: secondaryProducts.filter((p) => p.name && p.price_live > 0),
  compliance: {
    ...form.compliance,
    forbidden_claims: form.compliance.forbidden_claims.split('\n').map((s) => s.trim()).filter(Boolean),
    allowed_claims: form.compliance.allowed_claims.split('\n').map((s) => s.trim()).filter(Boolean),
  },
};
```

- [ ] **Step 3: Add progress state and progress feedback bar**

Add state:

```typescript
const [progress, setProgress] = useState<string | null>(null);
```

Replace the spinner-only submit button with a progress bar below it:

```tsx
<button type="submit" disabled={submitting} className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white font-bold py-4 rounded-xl text-lg">
  {submitting ? '⏳ Gerando curso…' : '🟣 Gerar curso'}
</button>
{submitting && (
  <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-sm text-purple-900">
    <div className="flex items-center gap-2 mb-2">
      <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      <span className="font-bold">Em andamento…</span>
    </div>
    <ol className="space-y-1 text-purple-700 list-decimal list-inside">
      <li>Validando dados do formulário</li>
      <li>Claude gerando persona + hooks + objeções (~30s)</li>
      <li>Renderizando 10 módulos HTML</li>
      <li>Commitando JSON no GitHub</li>
      <li>Aguardando deploy Vercel (~2 min)</li>
    </ol>
    <p className="mt-2 text-xs text-gray-500">Não feche essa aba. O link aparece quando tudo estiver pronto.</p>
  </div>
)}
```

- [ ] **Step 4: Show progress state during submit**

Update `handleSubmit` to set progress steps:

```typescript
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setSubmitting(true);
  setError(null);
  setResult(null);
  setProgress('Chamando Claude…');

  try {
    // ... existing payload construction ...

    setProgress('Aguardando Claude (~30s)…');
    const r = await fetch('/api/generate-course', { ... });
    setProgress('Processando resposta…');

    const json = await r.json();
    if (!r.ok) throw new Error(json.message ?? 'Erro');
    setResult(json);
    setProgress(null);
  } catch (err: any) {
    setError(err.message);
    setProgress(null);
  } finally {
    setSubmitting(false);
  }
}
```

- [ ] **Step 5: Run type-check**

```bash
npx tsc --noEmit
```

Expected: 0 errors in `app/admin/nova-live/page.tsx`.

- [ ] **Step 6: Commit**

```bash
git add app/admin/nova-live/page.tsx
git commit -m "feat: add secondary products section + progress UX to admin form"
```

---

## Task 6: End-to-End Test with a New Product

**Goal:** Confirm the full pipeline runs without errors for a product that isn't Sérum Vit C (the reference data). This test runs locally without calling Claude (to save cost) by using a manually crafted JSON that matches the courseData schema.

- [ ] **Step 1: Create test data file**

Create `data/test-batom-2026-06-01.json` with this content (it uses the full schema so build-course.js accepts it):

```json
{
  "$schema": "../schemas/course-data.json",
  "version": "1.0",
  "template_version": "v1.0",
  "generated_at": "2026-05-05T00:00:00.000Z",
  "selliver": {
    "slug": "test-batom",
    "name": "Priya Teste",
    "level": "intermediaria",
    "previous_lives": 3,
    "whatsapp": ""
  },
  "live": {
    "date": "2026-06-01",
    "time": "19:00",
    "duration_min": 90,
    "context": "regular",
    "master_coupon": "BATOMLIVE",
    "schedule": [
      { "d": -5, "label": "T-5d", "modules": [1, 2], "duration_min": 25 },
      { "d": -4, "label": "T-4d", "modules": [3], "duration_min": 20 },
      { "d": -3, "label": "T-3d", "modules": [4, 5], "duration_min": 35 },
      { "d": -2, "label": "T-2d", "modules": [6, 7], "duration_min": 25 },
      { "d": -1, "label": "T-1d", "modules": [8, 9], "duration_min": 40 }
    ]
  },
  "hero": {
    "name": "Batom Matte Duradouro",
    "category": "cosmeticos",
    "price_full": 89.90,
    "price_live": 59.90,
    "extra_coupon": "BATOMVIP",
    "stock": 80,
    "key_phrase": "Batom Matte Duradouro que não resseca pra quem quer cor o dia inteiro.",
    "differentials": [
      { "label": "Duração", "description": "8h sem retoque testado ao vivo" },
      { "label": "Fórmula", "description": "Com vitamina E, não resseca o lábio" },
      { "label": "Pigmento", "description": "Cobre em 1 passada, acabamento profissional" }
    ],
    "main_objection": "Batom matte resseca demais"
  },
  "secondary_products": [
    { "name": "Hidratante Labial Base", "price_live": 29.90, "bundle_with_hero": true }
  ],
  "persona": {
    "fictional_name": "Renata",
    "age": 32,
    "city": "São Paulo",
    "class": "C+",
    "occupation": "Recepcionista",
    "income_monthly": 2800,
    "kids": 1,
    "routine": "Acorda 6h, ônibus, trabalha 8h-17h, busca filho na escola",
    "main_pain_quote": "Passo batom de manhã e some em 2 horas",
    "phrases_that_resonate": ["dura o dia todo", "não resseca", "cor que aparece no video"],
    "phrases_to_avoid": ["investimento em beleza", "rotina de autocuidado", "empoderamento"],
    "buying_triggers": ["ver duração testada ao vivo", "preço abaixo de R$ 70", "combo com hidratante"],
    "best_live_time": "19h-20h"
  },
  "hooks": {
    "by_type": [
      { "type": "pergunta-problema", "text": "Seu batom some antes do meio-dia? Olha o que acontece quando eu aplico esse aqui e almoço." },
      { "type": "afirmacao-resultado", "text": "Esse batom ficou 8 horas no meu lábio — sem retoque, sem hidratante em cima. Testei aqui ao vivo." },
      { "type": "curiosidade", "text": "Qual batom dura mais: o de R$ 15 de farmácia ou esse aqui de R$ 59? Testei os dois agora." },
      { "type": "polemica-leve", "text": "Batom matte resseca? Só o mal formulado. Vou te mostrar a diferença." },
      { "type": "prova-social", "text": "Tivemos 40 unidades na semana passada, 38 voltaram pra comprar mais. Esse é o motivo." },
      { "type": "comparacao-visual", "text": "Lábio sem batom → lábio com esse matte. Veja a diferença em 10 segundos." }
    ],
    "rotation_plan": [
      { "cycle": 1, "type": "pergunta-problema" },
      { "cycle": 2, "type": "afirmacao-resultado" },
      { "cycle": 3, "type": "comparacao-visual" },
      { "cycle": 4, "type": "prova-social" },
      { "cycle": 5, "type": "curiosidade" }
    ]
  },
  "objections_pool": [
    { "q": "Tá caro pra um batom", "a": "R$ 59 com 8h de duração — você não precisa retocar. Calcula o custo por uso." },
    { "q": "Matte resseca meu lábio", "a": "Esse tem vitamina E. Passo o hidratante labial em baixo e testo aqui na câmera." },
    { "q": "Não sei se a cor fica bem em mim", "a": "Esse tom fica em pele clara, morena e negra. Tenho clientes dos três e todas voltaram." },
    { "q": "Prefiro comprar na farmácia", "a": "Na farmácia você não vê duração. Aqui eu mostro ao vivo, agora." },
    { "q": "Tem na loja perto de mim?", "a": "Exclusivo TikTok Shop. Cupom BATOMLIVE tira mais 10% no carrinho." },
    { "q": "E se não gostar?", "a": "7 dias de devolução garantido pela plataforma. Sem discussão." },
    { "q": "Já tenho batom demais", "a": "Esse substitui todos os outros. Um batom que dura 8h você usa todo dia." },
    { "q": "Demora pra chegar?", "a": "Estoque local. Comprou hoje, chega em 2-3 dias úteis." },
    { "q": "Não confio em compra online de maquiagem", "a": "Veja o produto na minha mão agora, aberto, sendo aplicado. É exatamente o que vai chegar." },
    { "q": "Qual número de tom você está usando?", "a": "Vermelho Intenso. Tenho 4 tons disponíveis, o link mostra todos." },
    { "q": "Tem versão mais barata?", "a": "Com cupom BATOMLIVE já está em R$ 53. Abaixo disso não consigo manter a fórmula boa." },
    { "q": "Minha filha que usa batom, não eu", "a": "Esse é ótimo pra presentear — embalagem bonita, dura bastante, ela vai usar todo dia." }
  ],
  "scenarios_pool": [
    { "situation": "São 19h50 e o chat está completamente silencioso há 3 min", "type": "B1 · CHAT SILENCIOSO", "action": "Pergunta direta pro chat", "phrase": "Olha esse batom no meu lábio — ele ficou lá das 11h da manhã. Me fala: seis horas é suficiente ou você quer mais?" },
    { "situation": "Você acabou de falar o preço e metade do chat escreveu 'caro'", "type": "B2 · OBJEÇÃO DE PREÇO MASSIVA", "action": "Ancora no custo por uso", "phrase": "R$ 59 dividido por 30 dias é menos de R$ 2 por dia. O café que você toma é mais caro e dura 20 minutos." },
    { "situation": "O estoque caiu pra 15 unidades", "type": "B3 · URGÊNCIA REAL DE ESTOQUE", "action": "Mostra o número na tela", "phrase": "15 unidades. Cupom BATOMLIVE, clica agora. Quando acabar, não tenho previsão de reposição nessa semana." },
    { "situation": "Você aplicou o batom e parece que a cor não aparece bem na câmera", "type": "B4 · PRODUTO NÃO APARECE NA CÂMERA", "action": "Ajusta iluminação e reamostra", "phrase": "A câmera às vezes não captura bem — deixa eu aproximar. Olha esse pigmento. Uma passada, completo." },
    { "situation": "Alguém no chat pergunta se tem o produto num tom específico que você não tem", "type": "B1 · DESVIO DE PRODUTO", "action": "Redireciona para o que tem em estoque", "phrase": "Esse tom não tenho hoje. O que tenho é Vermelho Intenso, Rosê Nude e Borgonha — os três com o mesmo cupom. Qual combina mais com você?" },
    { "situation": "O link do produto sumiu do carrinho (bug TikTok Shop)", "type": "B4 · PROBLEMA TÉCNICO NA PLATAFORMA", "action": "Pede pra aguardar, testa no próprio cel", "phrase": "Peço 1 minuto — problema técnico aqui. Atualizando o link. Enquanto isso, me conta: você usa batom no trabalho todo dia ou só em ocasiões especiais?" },
    { "situation": "Você está em 45 min de live e as vendas não arrancaram", "type": "B2 · LIVE SEM CONVERSÃO", "action": "Cria escassez com gift surpresa", "phrase": "Vou fazer uma coisa: próximas 10 compras levam o hidratante labial de brinde — sem precisar pedir. É automático. Cupom BATOMLIVE, agora." },
    { "situation": "Conexão de internet caiu e voltou, perdeu visualizadores", "type": "B3 · QUEDA DE CONEXÃO", "action": "Recomeça do zero como se fosse o primeiro bloco", "phrase": "Quem acabou de entrar: sou Priya, estou testando o Batom Matte Duradouro ao vivo. Esse batom ficou no meu lábio desde as 11h — são 20h agora. R$ 59 com cupom BATOMLIVE." }
  ],
  "compliance": {
    "regulated_category": "cosmeticos",
    "forbidden_claims": ["dermatologicamente testado (sem comprovação)", "cura ressecamento labial", "tratamento labial"],
    "allowed_claims": ["longa duração testada ao vivo", "com vitamina E na fórmula", "acabamento matte profissional"],
    "anvisa_registration": ""
  },
  "audience_profile": {
    "expected_size": "200-400 viewers",
    "main_origin": "organico",
    "funnel_stage": "descoberta_da_marca"
  },
  "_meta": {
    "tokens_in": 0,
    "tokens_out": 0,
    "cost_usd_estimate": 0
  }
}
```

- [ ] **Step 2: Run build with test data**

```bash
cd /Users/macbookcasa/dev/onlive-cursos
npm run build:course -- data/test-batom-2026-06-01.json
```

Expected output:
```
✅ Done — 10 renderizados, 0 pulados
```

- [ ] **Step 3: Verify key interpolations in module 07**

```bash
grep -c "Batom Matte" public/test-batom/2026-06-01/07-CTA-e-Objecoes.html
grep "Tá caro pra um batom" public/test-batom/2026-06-01/07-CTA-e-Objecoes.html
```

Expected: first command returns a number > 0; second returns the matching line.

- [ ] **Step 4: Verify verdict section in module 09**

```bash
grep "Priya Teste" public/test-batom/2026-06-01/09-Prova-Final.html
grep "2026-06-01" public/test-batom/2026-06-01/09-Prova-Final.html | head -3
```

Expected: both return matching lines.

- [ ] **Step 5: Commit test data**

```bash
git add data/test-batom-2026-06-01.json
git commit -m "test: add batom test data for E2E build verification"
```

---

## Sprint 2 Completion Checklist

- [ ] `lib/validation.ts` created, `lib/claude.ts` imports from it
- [ ] `lib/render.ts` created, smoke-tested with `kamille` data
- [ ] `lib/github.ts` created with `commitCourseData` + `triggerVercelBuild`
- [ ] `api/generate-course.ts` all imports resolve, Zod parse at boundary
- [ ] `app/admin/nova-live/page.tsx` has secondary products + progress UX
- [ ] `data/test-batom-2026-06-01.json` builds 10/10 cleanly
- [ ] `npx tsc --noEmit` returns 0 errors across all files
- [ ] All changes committed in 5+ atomic commits (one per task)

---

## Sprint 3 Preview (not in scope here)

After Sprint 2 is complete and tested locally:
- Create GitHub repo `onlive-br/onlive-cursos` + push
- Set env vars in Vercel: `ANTHROPIC_API_KEY`, `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO`, `ADMIN_PASSWORD`, `VERCEL_DEPLOY_HOOK`, `NEXT_PUBLIC_APP_URL`
- Vercel project → deploy from GitHub → add custom domain `cursos.onlive.com.br`
- Write README.md for Ana (how to use the admin form, how to add video links after the live)
