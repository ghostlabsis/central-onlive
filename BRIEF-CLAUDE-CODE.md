---
title: Brief Master · Claude Code · Sistema de Geração de Curso por Produto
tags: [brief, claude-code, dev, onlive-cursos, handlebars, escala]
status: ATIVO
versao: 1.0
data: 2026-05-05
audiencia: Claude Code · sessão única · faz tudo de cabo a rabo
escopo: implementar sistema completo de geração de Curso por Produto da Selliver · Etapa 3 do Funil Micro
volume_alvo: 10-15 cursos/dia · 300-450/mês · 3.600-5.400/ano
---

# Brief Master · Sistema de Geração de Curso por Produto OnLive

## 0 · Mensagem inicial pra colar no Claude Code

```
Você é o desenvolvedor responsável por implementar o sistema de geração automática de Curso por Produto da OnLive Agência. A OnLive é uma agência boutique brasileira de live commerce no TikTok Shop. O sistema que você vai construir é a infraestrutura de uma operação que vai gerar 10 a 15 cursos personalizados por dia, todos os dias.

Antes de escrever qualquer código:
1. Leia este brief inteiro · ele tem tudo que você precisa saber.
2. Leia o exemplo canônico em `TIKTOK SHOP/ONLIVE/Agentes IA/_HORA-DA-LIVE/onlive-cursos-skeleton/public/kamille/2026-05-12/`. São 9 HTMLs + 1 INDICE + 2 JSONs. Esse é o gold standard de qualidade visual e pedagógica.
3. Leia o template Handlebars já feito em `templates/01-O-Produto.html.hbs`.
4. Leia o `_data.json` para entender o schema dos dados do produto.
5. Leia o Master Prompt em `TIKTOK SHOP/ONLIVE/Agentes IA/_HORA-DA-LIVE/01 · MASTER PROMPT — Orquestrador Manual.md` que orquestra os agentes IA.
6. Leia os 9 SKILL.md dos agentes em `TIKTOK SHOP/ONLIVE/Agentes IA/01-09/SKILL.md` para entender a lógica de cada bloco do método LIVE™.
7. Leia o Manual de Marca em `TIKTOK SHOP/_MASTER/01 · Manual de Marca v3.md` para vocabulário e paleta.
8. Leia o doc do funil em `TIKTOK SHOP/ONLIVE/SELLIVER/00 · Funil Micro Selliver — Etapas.md` Etapa 3.

Stack obrigatória: Next.js 14 App Router · Vercel Functions · Anthropic Claude API · Handlebars · GitHub (Octokit) · TypeScript estrito.

Escopo desta sessão: implementar o pipeline completo end-to-end. Form admin → API serverless → Claude API → Handlebars → 10 HTMLs gerados → commit GitHub → deploy Vercel automático. Áudio com Web Speech API por default, com slot pra MP3 ElevenLabs opcional.

Lê este brief inteiro antes de escrever qualquer linha. Pergunta o que não entender antes de assumir.
```

---

## 1 · Contexto · O que é a OnLive

OnLive é uma agência boutique brasileira de live commerce no TikTok Shop. Sediada em Toledo (PR), com tese dual-corp (OnLive Agência LTDA + VERA LTDA · 50/50 Ana–Kamille). Treina e contrata Sellivers — vendedoras profissionais ao vivo.

**Selliver** é o nome da profissão: pessoa treinada para hospedar lives de venda com método. Não é influencer, não é apresentador. Vende pelo método · não pela audiência.

**Método OnLive** = ciclo de 10–12 minutos × 5 blocos (Hook → Demonstração → Oferta → CTA → Reset+Gift) repetido durante toda a live. A audiência se renova metade a cada 3 minutos · cada ciclo recomeça do zero.

**Funil Micro da Selliver** tem 6 etapas (sem dias rígidos):

```
1. Método (Aulas evergreen) → 2. Quiz Cultural → 3. Estudo do Produto ★ → 4. Ensaios → 5. Estreia → 6. Debrief
```

A Etapa 3 é onde o sistema que você vai construir entra. Para CADA live nova, a Selliver recebe um curso específico daquele produto. Esse curso usa o **método LIVE™** (Learn · Imitate · Verify · Evaluate) aplicado ao produto/marca daquela live.

**Volume:** 10-15 cursos por dia · cada Selliver faz 1-3 lives por dia · cada live precisa de curso próprio. Sem automação, Ana é o gargalo · operação não escala.

---

## 2 · O que precisa entregar nesta sessão

### 2.1 · Repositório `onlive-cursos`

Crie o repo GitHub `onlive-br/onlive-cursos` com a estrutura:

```
onlive-cursos/
├── .github/workflows/deploy.yml
├── api/
│   ├── generate-course.ts      ← endpoint principal
│   └── auth.ts                  ← auth admin
├── app/                         ← Next.js App Router
│   ├── admin/
│   │   ├── layout.tsx
│   │   ├── nova-live/page.tsx  ← form principal
│   │   └── lives/page.tsx       ← lista lives geradas
│   └── [selliver]/[data]/[...module]/page.tsx
├── lib/
│   ├── claude.ts                ← SDK Anthropic + Master Prompt
│   ├── render.ts                ← Handlebars engine
│   ├── github.ts                ← Octokit pra commits
│   └── validation.ts            ← Zod schemas
├── templates/
│   ├── _partials/
│   │   ├── head.hbs
│   │   ├── header.hbs
│   │   ├── footer.hbs
│   │   ├── tts-engine.hbs       ← Web Speech API
│   │   ├── timer-engine.hbs     ← cronômetros
│   │   ├── quiz-engine.hbs
│   │   └── approval-engine.hbs
│   ├── 00-INDICE.html.hbs
│   ├── 01-O-Produto.html.hbs    ← já existe · use como base
│   ├── 02-A-Audiencia.html.hbs
│   ├── 03-O-Ciclo-OnLive.html.hbs    ← 100% fixo
│   ├── 04-Hooks.html.hbs
│   ├── 05-Demonstracao.html.hbs
│   ├── 06-Oferta-e-Preco.html.hbs
│   ├── 07-CTA-e-Objecoes.html.hbs
│   ├── 08-Plano-B.html.hbs       ← 100% fixo
│   └── 09-Prova-Final.html.hbs
├── data/
│   ├── kamille-2026-05-12.json   ← exemplo já existe (importar do skeleton)
│   └── README.md                  ← schema documentado
├── public/
│   └── [selliver]/[data]/        ← output gerado
├── package.json
├── vercel.json
├── tsconfig.json
├── tailwind.config.js
└── README.md
```

### 2.2 · 8 templates Handlebars novos

Você tem `01-O-Produto.html.hbs` pronto. Crie os outros 8 (`02` a `09`) e o `00-INDICE.html.hbs` seguindo:
- Mesmo design system do exemplo (Tailwind CDN · paleta OnLive purple #7C3AED · pink #FF2F8A · black #0A0A0A · cream #FAFAFA)
- Mesma estrutura L · I · V · E em cada módulo
- Cada partial reutilizável fica em `_partials/`
- Variáveis injetadas via `{{produto.nome}}`, `{{persona.nome}}`, etc.

**Use como gold standard** os 9 HTMLs em `onlive-cursos-skeleton/public/kamille/2026-05-12/` · eles foram gerados manualmente seguindo o método e a Ana aprovou.

### 2.3 · Script de build CLI (modo offline)

```bash
npm run build:course -- data/kamille-2026-05-12.json
```

Lê 1 arquivo JSON · renderiza 10 HTMLs em `public/[selliver]/[data]/`. Rápido · sem rede · útil pra desenvolvimento local e Estágio 1.

### 2.4 · Form admin `/admin/nova-live`

Form web protegido por senha (Vercel Password Protection ou senha simples em env var). Campos:

| Campo | Tipo | Validação |
|---|---|---|
| Selliver | dropdown ou criar nova | obrigatório |
| Data e horário da live | datetime | futuro |
| Duração | select 60/90/120/180 min | obrigatório |
| Hero product · nome | text | obrigatório |
| Hero product · categoria | select (skincare, fashion, casa, eletrônicos, beleza, alimentação, outro) | obrigatório |
| Hero product · preço cheio | number | obrigatório · BRL |
| Hero product · preço live | number | obrigatório · ≤ preço cheio |
| Hero product · cupom | text | opcional · default LIVE15 |
| Hero product · estoque inicial | number | obrigatório |
| Hero product · diferencial técnico | textarea | obrigatório |
| Hero product · claims proibidos · auto preenchido por categoria | checklist | informativo |
| Hero product · registro (ANVISA · INMETRO · n/a) | select | obrigatório |
| Secundários · até 4 produtos | mesmo form repetido | opcional |
| Cupom-mestre da live | text | opcional |
| Cupom relâmpago | text | opcional |
| Contexto | select (regular · brand-day · cast-day · lançamento) | obrigatório |
| Compliance · categoria regulada? | boolean | obrigatório se categoria for skincare/saúde/alimentação |

Botão "Gerar curso" → POST `/api/generate-course`.

### 2.5 · API serverless `/api/generate-course`

```typescript
// Pseudocódigo
export async function POST(req: Request) {
  const payload = await req.json();
  const data = validatePayload(payload); // Zod
  
  // 1. Chama Claude com Master Prompt → recebe persona + hooks + objeções + script + plano-b
  const enriched = await callClaudeMasterPrompt(data);
  
  // 2. Combina form + IA = JSON estruturado
  const courseData = mergeData(data, enriched);
  
  // 3. Commit do JSON em data/[selliver]-[data].json (Octokit)
  await commitToGitHub(`data/${slug}.json`, courseData);
  
  // 4. Renderiza 10 HTMLs via Handlebars
  const htmls = renderAll(courseData);
  
  // 5. Salva em public/[selliver]/[data]/
  await commitMultiple(`public/${selliver}/${data}/`, htmls);
  
  // 6. Vercel detecta push → deploya automaticamente em ~2min
  
  return { url: `https://cursos.onlive.com.br/${selliver}/${data}/`, status: 'ok' };
}
```

### 2.6 · Variáveis de ambiente

```
ANTHROPIC_API_KEY=sk-ant-...         # Claude Sonnet 4.6
GITHUB_TOKEN=ghp_...                  # PAT com permissão de commit
GITHUB_REPO=onlive-br/onlive-cursos
NEXT_PUBLIC_APP_URL=https://cursos.onlive.com.br
ADMIN_PASSWORD=...                    # senha do /admin
```

---

## 3 · Stack técnica · LOCK · não discutir

| Decisão | Lock | Por quê |
|---|---|---|
| Frontend | Next.js 14 App Router · TypeScript estrito | Stack OnLive existente |
| Templates HTML | Handlebars | Sintaxe limpa · partials reutilizáveis · funciona em build time |
| API serverless | Vercel Functions (Node) | Zero infra · free tier generoso |
| LLM | Anthropic Claude Sonnet 4.6 | Master Prompt já calibrado |
| Versionamento de dados | GitHub commits via Octokit | Audit trail · rollback · histórico |
| Hosting | Vercel | Stack OnLive existente · 9 projetos já lá |
| Auth admin | Vercel Password Protection ou env var simples (V1) | Migrar pra Clerk em V2 |
| Estilo CSS | Tailwind via CDN | Mesmo padrão do exemplo Kamille |
| Áudio | Web Speech API (default · zero custo) + slot MP3 opcional | Opção upgrade Azure FranciscaNeural ou ElevenLabs Camila depois |

**Não substitua** Next.js por Astro · não use CSS-in-JS · não use TypeORM · não use NextAuth (Clerk fica pra V2). Não use template engines diferentes de Handlebars.

---

## 4 · Schema do JSON do produto · `data/[selliver]-[data].json`

Este é o schema canônico que vai alimentar todos os 10 HTMLs. Use como referência o `_data.json` em `onlive-cursos-skeleton/public/kamille/2026-05-12/_data.json` (já existe e está validado).

```typescript
interface CourseData {
  // Cabeçalho
  selliver: { id: string; nome: string; nivel: 'iniciante' | 'pleno' | 'senior' };
  liveData: string;        // ISO 8601
  liveHorario: string;     // "19:00-20:30"
  duracaoMin: number;      // 60 | 90 | 120 | 180
  contexto: 'regular' | 'brand-day' | 'cast-day' | 'lancamento';
  
  // Hero product (obrigatório)
  hero: {
    nome: string;
    categoria: string;
    precoCheio: number;
    precoLive: number;
    cupom: string;
    estoqueInicial: number;
    diferencialTecnico: string;
    registro: 'ANVISA' | 'INMETRO' | 'n/a';
    claimsProibidos: string[];
    fraseChave: string;    // gerado pela IA · "Sérum facial com 15% de Vit C..."
  };
  
  // Secundários (até 4)
  secundarios: Array<{
    nome: string;
    precoLive: number;
    funcao: 'cross-sell' | 'upsell' | 'kit-component';
  }>;
  
  // Cupons
  cupomMestre: string;
  cupomRelampago: { codigo: string; janelaMin: number };
  
  // Compliance
  compliance: {
    categoriaRegulada: boolean;
    proibidasCategoria: string[];   // gerado pela IA por categoria
    permitidasCategoria: string[];
  };
  
  // ENRIQUECIDOS POR IA (Claude Master Prompt)
  persona: {
    nome: string;            // "Bia, 33"
    demografia: { idade: string; genero: string; classe: string; ocupacao: string; renda: string };
    psicografia: { valores: string[]; aspiracoes: string[]; frustracoes: string[] };
    dorPrincipal: string;    // frase literal dela
    gatilhos: Array<{ ordem: number; gatilho: string; porQue: string }>;
    objecoes: Array<{ objecao: string; respostas: { _10s: string; _30s: string; viaDemo: string } }>;
    linguagem: {
      ressoam: string[];     // 10 frases
      evitar: string[];      // 5 frases
    };
    ancoragem: string[];     // 5 referências de comparação
  };
  
  hooks: Array<{ tipo: string; texto: string }>;  // 10-20 hooks
  
  script: {
    abertura: string;
    cicloModelo: { hook: string; demo: string; oferta: string; cta: string; reset: string };
    encerramento: string;
  };
  
  gift: { metas: Array<{ valor: number; recompensa: string; frase: string }> };
  
  planoB: {
    drop: string;
    troll: string;
    tecnico: string;
    chatParado: string;
    energiaCaindo: string;
  };
  
  // Templating meta
  schema_version: 1;
  generated_at: string;     // ISO 8601
  template_version: string; // "v1.0"
}
```

---

## 5 · Master Prompt da Claude API

Localização canônica: [[../01 · MASTER PROMPT — Orquestrador Manual]]

O Master Prompt orquestra 6 agentes em sequência:

1. **Agente 01 · Análise de Produto** — score SCORE-5 + diagnóstico Hero/Trending/Profit
2. **Agente 02 · Análise de Persona** — quem assiste · dor · linguagem
3. **Agente 06 · Banco de Hooks** — 10-20 hooks específicos do produto
4. **Agente 07 · Coach de Objeções** — 8-12 objeções com 3 versões cada
5. **Agente 05 · Método Gift OnLive** — 3-5 metas de gift
6. **Agente 03 · Gerador de Script de Live** — roteiro completo com base em 01+02+05+06+07

Cada agente tem `SKILL.md` em `TIKTOK SHOP/ONLIVE/Agentes IA/0X — [Nome]/SKILL.md` e `REFERENCE.md` com system prompt.

**Como invocar:** 1 chamada Claude Sonnet 4.6 com o Master Prompt completo + dados do form. Saída esperada: JSON estruturado seguindo o schema da §4 (campos enriquecidos `persona`, `hooks`, `script`, `gift`, `planoB`).

**Tokens estimados:** 5k in + 10k out = ~R$ 0,85 por chamada principal + ~R$ 0,40 pra agente 07 refinado = ~R$ 1,25 por curso.

---

## 6 · Restrições não-negociáveis

### 6.1 · Vocabulário OnLive (canônico em [[../../../_MASTER/01 · Manual de Marca v3]])

**Termos institucionais (use sempre):**
- Selliver (não "vendedora", não "streamer", não "influencer")
- Casa (não "empresa", não "escritório")
- Estreia (não "primeira live", não "debut")
- Cohort (não "turma", não "classe")
- Curadoria (não "recrutamento", não "seleção")
- Hero Product
- SCORE-5
- Ciclo (não "rotina", não "estrutura")

**Frases proibidas em copy:**
- "Cura" · "trata" · "milagre" · "garantia absoluta" · "a melhor do mercado"
- "Minha comunidade pediu" · "skincare é amor próprio" · "jornada de autocuidado" · "empoderamento"
- "Vamos arrasar juntas amiga"

**Frases preferidas:**
- "Testei" · "comparei" · "olha o resultado"
- "Não precisa confiar em mim · confia no teste"
- "Se fizer sentido pra sua rotina · está na sacolinha"

### 6.2 · Compliance regulatório

Por categoria, claims proibidos hardcoded:

```typescript
const PROIBIDAS_POR_CATEGORIA = {
  skincare: ['cura acne', 'elimina rugas', 'previne envelhecimento', 'trata melasma', 'milagre'],
  saude: ['cura', 'trata', 'previne doença', 'elimina sintoma', 'efeito imediato'],
  alimentacao: ['cura', 'trata', 'previne', 'emagrece sem esforço', 'milagre'],
  // ...
};
```

Toda live com produto regulado = template de aula deve incluir slide com a lista. Sistema injeta automaticamente.

### 6.3 · Paleta visual · NÃO inventar

```css
:root {
  --onlive-purple: #7C3AED;       /* primária */
  --onlive-purple-dark: #5B21B6;  /* hover */
  --onlive-pink: #FF2F8A;         /* acento ativo */
  --onlive-black: #0A0A0A;        /* texto + fundo dark */
  --onlive-cream: #FAFAFA;        /* fundo claro */
}
```

Tipografia:
- Inter (system-ui fallback)
- Lora (serif · headlines · display)
- JetBrains Mono (labels técnicos)

### 6.4 · Estrutura LIVE™ · obrigatória em cada módulo (1-9)

Cada módulo precisa ter as 4 seções, na ordem:

```
L · LEARN (5-8 min)        ← slides + áudio narrado + frase-chave
I · IMITATE (3-5 min)      ← exemplo modelo + análise comentada
V · VERIFY (5-10 min)      ← drill cronometrado + auto-checklist
E · EVALUATE (2-3 min)     ← quiz multiple choice com feedback imediato
```

Módulos 3 (O Ciclo OnLive) e 8 (Plano B) são **100% fixos** — conteúdo idêntico em todos os cursos. Outros 7 módulos têm template + dados injetados.

---

## 7 · Sequência de implementação recomendada

### Sprint 1 · Setup + script de build CLI (1-2 dias)

1. `git init` · estrutura de pastas
2. `package.json` · `tsconfig.json` · Tailwind config
3. Importar exemplo `kamille-2026-05-12` da pasta skeleton (`onlive-cursos-skeleton/public/kamille/2026-05-12/`) → `data/kamille-2026-05-12.json` (extrair de `_data.json` que já existe)
4. Criar 8 templates Handlebars faltantes (`02-A-Audiencia.html.hbs` … `09-Prova-Final.html.hbs`) usando os HTMLs gerados como referência visual exata
5. Criar `00-INDICE.html.hbs`
6. Implementar `lib/render.ts` (Handlebars + helpers BR · formatação preço · datas)
7. Implementar `npm run build:course -- data/kamille-2026-05-12.json` que gera os 10 HTMLs em `public/kamille/2026-05-12/`
8. Comparar output com gold standard (HTMLs do skeleton) · ajustar até ficar idêntico

**Critério de aceitação Sprint 1:** rodando o comando · gera 10 HTMLs idênticos ao gold standard pixel a pixel (exceto onde a IA enriqueceria — esses campos preenchidos manualmente neste sprint).

### Sprint 2 · Form admin + API + Claude (2-3 dias)

9. `app/admin/nova-live/page.tsx` · form completo da §2.4 com Zod validation
10. `lib/claude.ts` · SDK Anthropic + Master Prompt (lê do vault em runtime ou hardcoded)
11. `lib/github.ts` · Octokit pra commits
12. `api/generate-course.ts` · pipeline completo (validate → Claude → merge → commit → render → commit → resposta com URL)
13. Ana preenche form de teste (Sérum Vit C diferente · ex: "Hidratante Diurno") → API gera curso completo em ≤5min

**Critério de aceitação Sprint 2:** Ana preenche form em ≤10min · sistema gera curso novo (10 HTMLs) e responde com URL pronta · curso renderiza igual ao gold standard.

### Sprint 3 · Deploy + domínio + polish (1-2 dias)

14. Vercel project linkado ao GitHub repo
15. Auto-deploy ao push em `main`
16. Domain `cursos.onlive.com.br` (DNS Hostinger CNAME → Vercel)
17. Auth admin via env var `ADMIN_PASSWORD` (V1) ou Vercel Password Protection
18. README com fluxo operacional pra Ana (passo a passo de uso)

**Critério de aceitação final:** URL `cursos.onlive.com.br/admin/nova-live` no ar · Ana preenche form · em ≤5 min recebe URL `cursos.onlive.com.br/[selliver]/[data]/` com curso completo no ar e funcional.

---

## 8 · Comandos pra Ana usar depois (manual operacional)

Vai virar um doc separado · mas pra referência do dev:

```bash
# Modo CLI (Estágio 1 · sem form)
npm run build:course -- data/kamille-2026-05-13.json

# Modo Web (Estágio 2 · padrão)
# Ana acessa cursos.onlive.com.br/admin/nova-live
# Preenche form · clica "Gerar curso" · espera 3-5 min · copia URL

# Atualizar template (afeta TODOS os cursos antigos)
git push origin main  # GitHub Action re-renderiza todos os JSON existentes

# Versionar template (afeta SÓ os novos)
# Bump no package.json template_version · novos cursos usam · antigos preservam
```

---

## 9 · Riscos e mitigações pra Claude Code considerar

| Risco | Mitigação |
|---|---|
| Master Prompt gera texto que viola compliance | Validação Zod por categoria · claims proibidos como input obrigatório · review humano antes de publicar |
| TTS Web Speech engasga em palavras técnicas | Pre-processamento do texto (substituir abreviações · números por extenso quando crítico) · slot MP3 ElevenLabs opcional |
| Custo Claude API dispara | Cache de outputs (mesmo produto + persona = cache 24h) · monitoramento via Helicone · alertas |
| Vercel rate limit | Free tier 100 deploys/dia suficiente · Pro pra ilimitado |
| Schema JSON quebra entre versões | `template_version` no JSON · mantém retrocompatibilidade · migrações documentadas |
| Falha no commit GitHub | Retry exponencial · fallback pra resposta manual com JSON download |
| Ana preenche form com erro | Zod retorna erros amigáveis · campos com exemplos preenchidos · preview antes de submeter |

---

## 10 · Documentos pra Claude Code ler ANTES de codar

Em ordem de prioridade:

1. **Este brief** (você está aqui)
2. [[README]] · skeleton já entregue · estrutura geral
3. [[BRIEF-FREELA]] · brief original com mais detalhe
4. [[../05 · SISTEMA RECORRENTE]] · arquitetura completa do sistema recorrente
5. [[../00 · FUNIL DOS AGENTES]] · como os 9 agentes IA se conectam
6. [[../01 · MASTER PROMPT — Orquestrador Manual]] · prompt que API vai chamar
7. [[../../10 — Treinador da Selliver/SKILL]] · spec do agente 10 (que esse sistema implementa)
8. [[../../10 — Treinador da Selliver/REFERENCE]] · system prompt completo do agente
9. [[../../10 — Treinador da Selliver/PROCESSO-EM-ESCALA]] · análise do processo em escala
10. [[../../../SELLIVER/00 · Funil Micro Selliver — Etapas]] · onde Etapa 3 vive
11. [[../../../../_MASTER/01 · Manual de Marca v3]] · paleta · vocabulário · tom

**Gold standard a replicar pixel a pixel:**
- `public/kamille/2026-05-12/00-INDICE.html` (8.5 KB)
- `public/kamille/2026-05-12/01-O-Produto.html` (22 KB) ← já tem template Handlebars
- `public/kamille/2026-05-12/02-A-Audiencia.html` (25 KB)
- `public/kamille/2026-05-12/03-O-Ciclo-OnLive.html` (30 KB) ← 100% fixo
- `public/kamille/2026-05-12/04-Hooks.html` (23 KB)
- `public/kamille/2026-05-12/05-Demonstracao.html` (26 KB)
- `public/kamille/2026-05-12/06-Oferta-e-Preco.html` (21 KB)
- `public/kamille/2026-05-12/07-CTA-e-Objecoes.html` (24 KB)
- `public/kamille/2026-05-12/08-Plano-B.html` (23 KB) ← 100% fixo
- `public/kamille/2026-05-12/09-Prova-Final.html` (26 KB)

**Dados do exemplo:**
- `public/kamille/2026-05-12/_data.json` (10 KB · schema validado)
- `public/kamille/2026-05-12/videos.json` (slot YouTube)

---

## 11 · Definição de "feito" desta sessão

Você terminou quando:

- [ ] Repositório `onlive-br/onlive-cursos` no GitHub com toda a estrutura da §2.1
- [ ] 8 templates Handlebars novos criados · gold standard replicado pixel a pixel
- [ ] `npm run build:course -- data/kamille-2026-05-12.json` gera 10 HTMLs idênticos ao gold standard
- [ ] Form `/admin/nova-live` no ar com todos os campos da §2.4 · validado com Zod
- [ ] API `/api/generate-course` chama Claude Sonnet com Master Prompt · valida · commita · renderiza · responde com URL · em ≤5 min
- [ ] Vercel auto-deploy funcional
- [ ] Domain `cursos.onlive.com.br` apontando (ou alternativa Vercel default)
- [ ] Auth admin protegida (env var ou Vercel Password)
- [ ] README com instruções de uso pra Ana
- [ ] Teste end-to-end: Ana preenche form com produto novo (NÃO Sérum Vit C) → curso completo no ar em ≤5min · funcional · todos os 10 HTMLs renderizam · áudio Web Speech toca · timer funciona · quiz multiple choice funciona · botão "Liberar Módulo 2" libera

---

## 12 · Após este sprint · roadmap V2 (não fazer agora)

- [ ] Auth real (Clerk · magic link)
- [ ] Banco Postgres (Supabase) pra tracking de progresso da Selliver
- [ ] Notificação WhatsApp Twilio
- [ ] Áudio premium ElevenLabs Camila ou Azure FranciscaNeural
- [ ] Dashboard analytics
- [ ] Multi-tenant (white-label pra outras agências)
- [ ] AI scoring real dos drills (vídeo upload + análise)

---

## 13 · Custos esperados em produção

| Item | Cálculo | Custo/curso |
|---|---|---|
| Claude Sonnet 4.6 (Master Prompt) | 5k in + 10k out | R$ 0,85 |
| Claude Sonnet (refinamento Agente 07) | 3k in + 5k out | R$ 0,40 |
| Vercel hosting | free tier ilimitado | R$ 0 |
| GitHub | free tier | R$ 0 |
| Domain | já existe onlive.com.br | R$ 0 |
| **Total por curso** | | **~R$ 1,30** |

Mensal · 10 cursos/dia · 30 dias = 300 cursos × R$ 1,30 = **R$ 390/mês**.
Mensal · 15 cursos/dia · 30 dias = 450 cursos × R$ 1,30 = **R$ 585/mês**.

Investimento inicial dev (esta sessão): tempo do Claude Code (você).

---

## 14 · Caminhos de fallback se algo travar

- **Claude API fora do ar:** retorna erro 503 · Ana tenta de novo em alguns min · ou usa modo CLI offline com JSON manual
- **GitHub commit falha:** retry · se persistir · log o JSON pra Ana baixar e commitar manual
- **Vercel deploy falha:** logar URL do log · Ana redeploya manual via CLI
- **Schema break em produção:** `template_version` permite rollback · cursos antigos preservam template antigo

---

## 15 · Pergunte antes de assumir

Se em algum ponto durante a implementação você não tiver certeza:
- Sobre vocabulário OnLive · consulte [[../../../../Glossário]] e [[../../../../_MASTER/01 · Manual de Marca v3]]
- Sobre método LIVE™ · consulte [[../../10 — Treinador da Selliver/REFERENCE]]
- Sobre design visual · consulte os 9 HTMLs gold standard
- Sobre stack · consulte §3 deste brief · não desvie

Se tudo isso não cobrir · pergunte à Ana antes de implementar.

---

*Brief Master Claude Code · v1.0 · 05 mai 2026 · OnLive Agência · sistema de geração Curso por Produto · Etapa 3 do Funil Micro Selliver*
