# onlive-cursos

> Sistema recorrente de geração de cursos de Selliver. Cada live no TikTok Shop = 1 curso de treinamento de 9 módulos publicado em URL própria, gerado em ~5 min via form web.

🟣 Parte do ecossistema **OnLive · Agentes IA** (agente 10 — Treinador da Selliver).

---

## ⚡ Quick start (dev)

```bash
git clone git@github.com:onlive-br/onlive-cursos.git
cd onlive-cursos
npm install
cp .env.example .env.local
# preencher ANTHROPIC_API_KEY e GITHUB_TOKEN

# build local com dados de exemplo
npm run build:course -- data/kamille-2026-05-12.json

# dev server (form admin)
npm run dev
# abre http://localhost:3000/admin/nova-live
```

---

## 📁 Estrutura

```
.
├── api/                      ← Vercel serverless functions
│   └── generate-course.ts    ← POST: form → Claude → render → commit → deploy
├── app/                       ← Next.js App Router
│   ├── admin/nova-live/      ← Form que Ana usa
│   └── [selliver]/[data]/    ← serve os HTMLs gerados
├── lib/
│   ├── claude.ts             ← chamadas ao Master Prompt
│   ├── render.ts             ← Handlebars + helpers
│   └── github.ts             ← commit data files via Octokit
├── templates/
│   ├── _partials/            ← head, header, tts, timer, quiz
│   └── 00-09 *.html.hbs      ← templates dos 10 módulos
├── data/                      ← JSON por live (1 arquivo = 1 curso)
└── public/[selliver]/[data]/ ← output deployado
```

---

## 🔄 Fluxo completo

```
1. Ana abre /admin/nova-live
2. Preenche form (5 min)
3. POST /api/generate-course
   ├─ Valida payload
   ├─ Chama Claude API (Master Prompt)
   ├─ Combina form + IA = JSON estruturado
   ├─ Commit em data/[selliver]-[data].json (Octokit)
   ├─ Renderiza 10 HTMLs via Handlebars
   ├─ Salva em public/[selliver]/[data]/
   └─ Trigger Vercel rebuild
4. ~3-5 min depois, URL pronta:
   https://cursos.onlive.com.br/kamille/2026-05-12/
```

---

## 🏗️ Como adicionar uma nova live (operação Ana)

1. Abre `cursos.onlive.com.br/admin/nova-live`
2. Preenche form
3. Clica "Gerar curso"
4. Aguarda 3-5 min
5. Copia URL e manda no WhatsApp da Selliver

✅ Sem código. Sem git. Sem dev.

---

## 🛠️ Como atualizar templates (operação dev)

1. Edita `templates/[NN]-[Nome].html.hbs`
2. Push pra `main`
3. GitHub Action roda → re-renderiza TODOS os cursos automaticamente
4. Vercel deploya tudo em ~2 min

⚠️ Cuidado: re-renderizar lives passadas pode quebrar progresso de Sellivers. Para evitar, use `template_version` no JSON e renderize só lives futuras.

---

## 🔑 Variáveis de ambiente (.env.local)

```
ANTHROPIC_API_KEY=sk-ant-...           # Claude API
GITHUB_TOKEN=ghp_...                    # PAT com permissão de commit
GITHUB_REPO=onlive-br/onlive-cursos     # repo destino dos commits
NEXT_PUBLIC_APP_URL=https://cursos.onlive.com.br
ADMIN_PASSWORD=...                      # senha do /admin (V1, V2 troca por Clerk)
```

---

## 📦 Dependências principais

```json
{
  "next": "14.x",
  "react": "18.x",
  "@anthropic-ai/sdk": "^0.27",
  "handlebars": "^4.7",
  "octokit": "^3.x",
  "zod": "^3.x",
  "tailwindcss": "^3.x"
}
```

---

## 🧪 Testes

```bash
# Build com dados de teste
npm run build:course -- data/kamille-2026-05-12.json

# Verifica que os 10 HTMLs apareceram
ls public/kamille/2026-05-12/

# Abre o índice
open public/kamille/2026-05-12/00-INDICE.html
```

---

## 📋 Arquivos críticos para entender

1. `lib/render.ts` — engine que faz JSON + template = HTML
2. `templates/_partials/tts-engine.hbs` — Web Speech API embutido
3. `lib/claude.ts` — chamada ao Master Prompt
4. `data/kamille-2026-05-12.json` — exemplo de schema

---

## 🚀 Deploy

Vercel detecta push automático. Configurar:
- Domain: `cursos.onlive.com.br`
- Env vars no painel Vercel
- Build Command: `npm run build`
- Output Directory: `out` (se usando export estático) ou padrão Next.js

---

## 🤝 Contribuição (Sprint 1 do roadmap)

Tasks abertas para o dev/freela:
- [ ] Migrar os 9 templates manuais → Handlebars (`templates/`)
- [ ] Implementar `lib/claude.ts` chamando Master Prompt
- [ ] Implementar `/api/generate-course`
- [ ] Implementar form `/admin/nova-live`
- [ ] Configurar GitHub Action de deploy
- [ ] Setup domain `cursos.onlive.com.br` no Vercel

Veja [`BRIEF-FREELA.md`](./BRIEF-FREELA.md) para escopo completo.
