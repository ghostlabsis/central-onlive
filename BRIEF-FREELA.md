# Brief Freela — onlive-cursos

> Sistema interno de geração automática de cursos de Selliver. MVP funcional em 5-8 dias úteis.

---

## Contexto rápido

OnLive é uma agência de live commerce no TikTok Shop. Antes de cada live, a Selliver (host) precisa de um **curso de treinamento personalizado** que cubra: o produto, a audiência, o método de venda e a prova final. Hoje esse curso é gerado manualmente em 4-6h via Claude. Queremos automatizar pra **5-10 min** com um form web.

**Já tá feito (você não precisa criar):**
- 9 templates HTML manuais validados (em `ONLIVE/Agentes IA/10 — Treinador da Selliver/exemplo-curso-Kamille-2026-05-12/`)
- Build engine em Node puro funcionando (`scripts/build-course.js`)
- 1 template Handlebars-compatible já migrado (`templates/01-O-Produto.html.hbs`)
- System prompt do Master Prompt (Claude API)
- JSON schema de exemplo (`data/kamille-2026-05-12.json`)
- Form admin esqueleto (`app/admin/nova-live/page.tsx`)
- API endpoint esqueleto (`api/generate-course.ts`)

**Você vai entregar:**
1. Repo no GitHub `onlive-br/onlive-cursos` configurado
2. Migrar os 8 templates HTML manuais restantes pra Handlebars (`templates/02 a 09`)
3. Implementar `lib/render.ts`, `lib/github.ts` (Octokit) — ou continuar com o build script puro Node
4. Conectar `api/generate-course.ts` end-to-end (form → Claude → render → commit → deploy)
5. Setup Vercel: domain, env vars, deploy automático
6. Auth no /admin (V1: senha simples, V2: Clerk)
7. Smoke test: gerar curso completo pra 1 live de teste

**Você NÃO vai fazer:**
- Banco de dados (V2)
- Auth Clerk (V2)
- WhatsApp delivery (V2)
- Tracking/analytics (V2)
- Mobile app (V3+)

---

## Stack

| Item | Tecnologia |
|---|---|
| Framework | Next.js 14 (App Router) |
| LLM | Anthropic Claude API (Sonnet 4.6) |
| Templates | Handlebars (substituir o engine puro Node atual) |
| Hosting | Vercel |
| GitHub | Octokit pra commits programáticos |
| Validação | Zod |
| Estilo | Tailwind (já no Vercel) |

---

## Escopo detalhado

### Sprint 1 — MVP (5-8 dias úteis)

**Dia 1-2 — Setup**
- [ ] Cria repo `onlive-br/onlive-cursos` no GitHub
- [ ] Copia o esqueleto que já tá no vault em `ONLIVE/Agentes IA/_HORA-DA-LIVE/onlive-cursos-skeleton/`
- [ ] `npm install` (Next.js 14, Anthropic SDK, Handlebars, Octokit, Zod, Tailwind)
- [ ] Conecta no Vercel, configura env vars (ANTHROPIC_API_KEY, GITHUB_TOKEN, ADMIN_PASSWORD)
- [ ] Cria domínio `cursos.onlive.com.br` apontando pro projeto Vercel

**Dia 3-4 — Templates**
- [ ] Substitui o engine Node puro por Handlebars (`npm i handlebars`)
- [ ] Migra os 8 templates restantes (02-09) seguindo o padrão do `01-O-Produto.html.hbs`:
  - Cada template tem `{{> head}}`, `{{> header}}` no topo
  - `{{> scripts-engine}}` no fim com `initQuiz(N)` e `setupApproval('NN-Proximo.html')`
  - Conteúdo: copiar literal do exemplo manual, substituir dados hardcoded por `{{path}}`
- [ ] Roda `node scripts/build-course.js data/kamille-2026-05-12.json` e confirma os 10 HTMLs idênticos ao exemplo manual

**Dia 5 — API**
- [ ] Implementa `lib/claude.ts` (já tem esqueleto)
- [ ] Implementa `lib/github.ts` com Octokit (commit JSON em `data/`)
- [ ] Implementa `lib/render.ts` (chama o build script ou inline)
- [ ] Implementa `api/generate-course.ts` end-to-end
- [ ] Testa com Postman/Insomnia

**Dia 6 — Form admin**
- [ ] Polish do form (`app/admin/nova-live/page.tsx`)
- [ ] Valida o submit, exibe URL final
- [ ] Adiciona auth Vercel Password Protection no `/admin/*`
- [ ] Cria página `/admin/lives` listando cursos já gerados

**Dia 7 — Deploy + smoke test**
- [ ] Deploy production
- [ ] Roda 1 curso real de ponta a ponta
- [ ] Confirma com Ana que tudo funciona
- [ ] Documenta variáveis de ambiente no README

**Dia 8 — Buffer + handoff**
- [ ] Bug fixes do que apareceu
- [ ] Mostra repo + Vercel pra Ana via screen share
- [ ] Entrega README atualizado e changelog

---

## Critérios de aceite

✅ Ana abre `cursos.onlive.com.br/admin/nova-live`, preenche form em ≤5 min  
✅ Click em "Gerar curso" dispara API que retorna URL pública em ≤5 min  
✅ URL pública tem 10 HTMLs renderizados com persona/hooks/objeções específicos  
✅ Cada HTML tem Web Speech, timer, quiz e aprovação funcionando como o exemplo manual  
✅ JSON da live fica versionado em `data/[slug]-[date].json` no repo  
✅ Vercel deploya automático a cada push em main  
✅ Custo estimado por curso < US$ 1 (verificar na Anthropic console)

---

## Stack alternativa (se preferir)

- **n8n cloud** se preferir low-code (workflow JSON já tá em `02 · n8n WORKFLOW.md` na pasta vizinha do vault). Mais rápido pra MVP, menos flexível.
- **Astro** ao invés de Next.js se quer SSG puro. Não precisa de API routes — pode usar GitHub Actions pra rodar build em cada commit em `data/`.

---

## Pagamento sugerido

| Modalidade | Valor |
|---|---|
| Fixo MVP completo (5-8 dias) | R$ 4.000 - R$ 7.000 |
| Hourly | R$ 150-250/h × ~40h = R$ 6.000 - R$ 10.000 |
| Equity | nope, projeto interno |

---

## Quem contata

**Ana** · agcghostlab@gmail.com  
Calls de 30 min toda terça pra alinhamento (10h-10h30 BRT).  
Slack/Discord/WhatsApp à escolha do dev.

---

## Próximas sprints (depois do MVP — não escopo desse contrato)

- **Sprint 2:** Banco de dados Supabase + auth Clerk + tracking de progresso da Selliver
- **Sprint 3:** WhatsApp delivery via Twilio + integração com agente 04 (Análise Pós-Live)
- **Sprint 4:** Multi-tenant (várias agências) + analytics dashboard
- **Sprint 5:** API pública (movimento 15 do Plano OnLive) + venda B2B

---

## Referências do vault (Ana vai compartilhar acesso)

- `ONLIVE/Agentes IA/_HORA-DA-LIVE/05 · SISTEMA RECORRENTE.md` — arquitetura completa
- `ONLIVE/Agentes IA/_HORA-DA-LIVE/01 · MASTER PROMPT — Orquestrador Manual.md` — system prompt do Claude
- `ONLIVE/Agentes IA/10 — Treinador da Selliver/exemplo-curso-Kamille-2026-05-12/` — referência visual (10 HTMLs manuais)
- `ONLIVE/Agentes IA/_HORA-DA-LIVE/onlive-cursos-skeleton/` — esqueleto do repo (este aqui)
