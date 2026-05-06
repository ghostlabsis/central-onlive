# 🔄 SYNC — Vault ↔ Vercel

> Onde fica cada coisa, quem edita o quê, e como manter tudo sincronizado.

---

## 🗺️ Os 3 lugares (e quem manda em quê)

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. VAULT OBSIDIAN                                                    │
│    /TIKTOK SHOP/ONLIVE/...                                           │
│                                                                      │
│    Função: estratégia, planos, masters, conhecimento da OnLive       │
│    Editor: Você no Obsidian (estratégia) e Cowork (com IA)           │
│    Sincronização: iCloud automática entre seus devices               │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │  copy/reference
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 2. REPO LOCAL                                                        │
│    ~/dev/onlive-cursos/                                              │
│                                                                      │
│    Função: código, templates, dados das lives, HTMLs gerados         │
│    Editor: Cursor (Claude Code) ou VS Code                           │
│    Sincronização: git push/pull com GitHub                           │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │  git push
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 3. GITHUB + VERCEL                                                   │
│    github.com/onlive-br/onlive-cursos                                │
│    cursos.onlive.com.br                                              │
│                                                                      │
│    Função: source of truth + hosting público                         │
│    Editor: ninguém edita direto — sempre via PASSO 2                 │
│    Sincronização: Vercel auto-deploy a cada push em main             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Regra de ouro

| Tipo de conteúdo | Onde edita | Como vai pro Vercel |
|---|---|---|
| Estratégia geral, masters, planos OnLive | **Vault Obsidian** | NUNCA vai pro Vercel |
| Pacote pré-live (`Live-DATE-Selliver-PACOTE.md`) | **Vault Obsidian** | Você consulta pra editar `data/...json` no repo |
| Dados de uma live (`data/[slug]-[date].json`) | **Repo local (Cursor)** | `git push` |
| Templates de módulo (`templates/*.hbs`) | **Repo local (Cursor)** | `git push` |
| URL de YouTube por módulo (`videos.json`) | **Painel Master** ou repo | Painel salva → você commita |
| HTMLs do curso (`public/[slug]/[date]/*.html`) | **Auto-gerado** pelo build | nunca edita direto |
| Master Prompt do Claude | **Vault Obsidian** | copia pra `lib/claude.ts` quando muda |

---

## 🎯 Workflow real (pra cada nova live)

### Cenário 1 — Você sozinha (sem dev IA ainda)

```
1. Vault: define a próxima live no Master Doc / Plano Executivo
2. Vault: cria o pacote pré-live em /ONLIVE/EXECUÇÃO/ (markdown)
3. Repo local: cursor data/[slug]-[date].json — preenche com dados da live
4. Repo local: npm run build:course -- data/[slug]-[date].json
5. Repo local: git add . && git commit -m "..." && git push
6. Vercel: auto-deploy em ~2 min
7. Painel Master: cola URLs do YouTube por módulo (auto-save local)
8. Repo local: git add public/ && git commit -m "videos: ..." && git push
9. WhatsApp: manda link pra Selliver
```

Tempo total: ~20-30 min/live (depois do primeiro deploy).

### Cenário 2 — Você + Dev IA Cursor (semana que vem)

```
1. Vault: cria pacote pré-live
2. Cursor: "Pega esse pacote do vault e cria o JSON em data/, builda os 10 HTMLs e push"
3. Cursor faz tudo automático em ~2 min
4. Painel Master: cola URLs do YouTube
5. WhatsApp: manda link
```

Tempo total: ~5-10 min/live.

### Cenário 3 — Sistema completo (sprint 2, ainda não tem)

```
1. Painel Master /admin/nova-live: preenche form web em 5 min
2. Sistema chama Claude API → gera tudo → commita → deploya
3. Pega URL pronta na tela, manda WhatsApp
```

Tempo total: ~5 min/live.

---

## 🔌 Como sincronizar manualmente quando necessário

### Você editou algo no vault e quer levar pro repo

**Exemplo:** atualizou o Master Prompt no documento `01 · MASTER PROMPT.md` no vault.

```bash
# Copia o conteúdo manualmente
cd ~/dev/onlive-cursos
cursor lib/claude.ts
# Cola o novo Master Prompt na const MASTER_SYSTEM
git add . && git commit -m "feat: master prompt v1.1" && git push
```

### Você editou algo no repo e quer levar pro vault (raro)

```bash
# Manualmente — não tem auto-sync na direção repo → vault
# Geralmente não precisa porque vault é estratégia, repo é execução
```

### Vercel está fora do sync com o repo (deploy travou)

```bash
cd ~/dev/onlive-cursos
git status        # confere se tem mudanças não commitadas
git push          # força push
vercel --prod     # força redeploy manual
```

---

## ⚠️ O que NÃO fazer

❌ **Editar HTMLs diretamente em `public/`**
   → São auto-gerados. Vai ser sobrescrito no próximo build.
   → Edite os `.hbs` em `templates/` e re-rode o build.

❌ **Commitar `.env.local`**
   → Tem senhas. Já está no `.gitignore`. Não tira.

❌ **Editar arquivos do repo direto no vault**
   → O skeleton no vault é só REFERÊNCIA. O repo real tá em `~/dev/onlive-cursos/`.

❌ **Subir o vault inteiro pro GitHub**
   → Tem dados sensíveis (decisões, planos, briefings). Mantenha vault privado no iCloud.

---

## 🤖 Quando contratar dev IA pode ser útil

**Caso 1 — Migrar templates manuais pra Handlebars:**
> "Pega os HTMLs em `public/kamille/2026-05-12/` (módulos 02-09) e converte cada um pra `templates/NN-Nome.html.hbs` com placeholders `{{path}}` baseado no campo correspondente do `data/kamille-2026-05-12.json`."

**Caso 2 — Conectar Octokit pra Painel Master commitar auto:**
> "Adiciona `lib/github.ts` usando Octokit. Quando o Painel Master salva `videos.json`, em vez de salvar no filesystem, faz commit no GitHub via API. Pega o token do `.env.local` (`GITHUB_TOKEN`)."

**Caso 3 — Conectar Claude API:**
> "Implementa `app/api/generate-course/route.ts` baseado no esqueleto de `api/generate-course.ts`. Recebe form, chama Master Prompt, gera JSON, commita via Octokit, retorna URL."

Cada um desses leva ~30-60 min pra Cursor/Claude Code.

---

## 📌 TL;DR

- **Vault** = estratégia (Obsidian, iCloud)
- **Repo** = execução (Cursor, GitHub)
- **Vercel** = produção (auto-deploy via GitHub)

O fluxo é unidirecional: Vault inspira Repo, Repo abastece Vercel. Nunca o contrário.
