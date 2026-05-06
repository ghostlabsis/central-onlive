# 🚀 STEP-BY-STEP — Deploy no Vercel

> Do zero ao curso da Kamille no ar em **~30 minutos**. Comandos prontos pra copiar e colar.

---

## ⚙️ Pré-requisitos (instala uma vez só)

| Ferramenta | Como instalar |
|---|---|
| **Node.js 18+** | https://nodejs.org/ (LTS) |
| **Git** | já vem no Mac · `git --version` pra confirmar |
| **GitHub CLI** | `brew install gh` (mais fácil) |
| **Vercel CLI** | `npm i -g vercel` |
| **Conta GitHub** | https://github.com/signup |
| **Conta Vercel** | https://vercel.com/signup (faz login com GitHub) |

Confere que tudo tá funcionando:
```bash
node --version    # v18.x ou superior
git --version     # qualquer versão
gh --version      # 2.x
vercel --version  # 30.x ou superior
```

---

## 📋 PASSO 1 · Copiar o esqueleto pra fora do vault (1 min)

O repo precisa ficar fora do iCloud pra Cursor/git funcionarem bem.

```bash
# Cria pasta de projetos no Mac (se ainda não tem)
mkdir -p ~/dev

# Copia o skeleton pra lá
cp -R "/Users/macbookcasa/Library/Mobile Documents/iCloud~md~obsidian/Documents/tiktokshop/TIKTOK SHOP/ONLIVE/Agentes IA/_HORA-DA-LIVE/onlive-cursos-skeleton" ~/dev/onlive-cursos

# Vai pra pasta
cd ~/dev/onlive-cursos

# Confere que tá tudo lá
ls
# Deve listar: app/  api/  data/  lib/  public/  scripts/  templates/  package.json  ...
```

---

## 📦 PASSO 2 · Instalar dependências (3 min)

```bash
cd ~/dev/onlive-cursos
npm install
```

Saída esperada: `added X packages` no fim. Se der erro de network, tenta `npm install --registry=https://registry.npmjs.org/`.

---

## 🧪 PASSO 3 · Testar localmente (2 min)

Antes de subir, confere que tudo funciona no seu Mac.

```bash
# Re-renderiza o curso da Kamille com os templates atuais
npm run build:course -- data/kamille-2026-05-12.json

# Roda o Next.js em modo dev
npm run dev
```

Abre **http://localhost:3000** no navegador.

✓ Você deve ver:
- Homepage com botão "Painel Master"
- `/admin` com lista de cursos (vai aparecer "Kamille · 2026-05-12")
- `/admin/curso/kamille/2026-05-12` com 9 campos pra colar URLs do YouTube
- `/kamille/2026-05-12/00-INDICE.html` com o curso completo

✓ Cola uma URL do YouTube em qualquer módulo no editor — o iframe deve aparecer ali na hora.

✓ Abre o módulo correspondente no curso público e vê o vídeo no topo.

Se tudo acima funciona, segue. Se não, me chama.

Pra parar o servidor: `Ctrl+C`

---

## 🐙 PASSO 4 · Criar repo no GitHub (3 min)

```bash
cd ~/dev/onlive-cursos

# Inicializa git
git init
git add .
git commit -m "feat: setup inicial onlive-cursos"

# Login na GitHub CLI (abre navegador)
gh auth login
# Escolhe: GitHub.com → HTTPS → Login with a web browser → cola o código

# Cria repo PRIVADO no GitHub e faz push
gh repo create onlive-cursos --private --source=. --push
```

✓ Confere em https://github.com/[seu-usuario]/onlive-cursos — deve estar lá com todos os arquivos.

---

## 🔑 PASSO 5 · Configurar variáveis (.env.local) (2 min)

Variáveis ficam **só na sua máquina** (não vão pro git).

```bash
cd ~/dev/onlive-cursos

# Copia o template
cp .env.example .env.local

# Abre pra editar
open -a "Cursor" .env.local
# OU
nano .env.local
```

Preenche AT LEAST a senha admin. As outras (Anthropic, GitHub) só precisa quando ativar geração via Claude (sprint 2).

```env
ADMIN_PASSWORD=onlive123
NEXT_PUBLIC_APP_URL=https://cursos.onlive.com.br
NEXT_PUBLIC_BRAND_NAME=OnLive
```

Salva e fecha.

---

## ☁️ PASSO 6 · Conectar ao Vercel (5 min)

```bash
cd ~/dev/onlive-cursos

# Login na Vercel CLI
vercel login
# Escolhe: Continue with GitHub

# Linka o projeto local com Vercel
vercel link
# Perguntas:
#   Set up and deploy? → Y
#   Which scope? → escolhe seu time/conta
#   Link to existing project? → N (ainda não existe)
#   What's your project's name? → onlive-cursos
#   In which directory is your code located? → ./
#   Want to override the settings? → N
```

Vercel detecta Next.js automaticamente.

---

## 🌐 PASSO 7 · Deploy production (3 min)

```bash
cd ~/dev/onlive-cursos

# Deploy production
vercel --prod
```

✓ Saída esperada:
```
✅  Production: https://onlive-cursos-XXXX.vercel.app
```

Abre essa URL no navegador. **Você acabou de subir o sistema no ar.**

Confere:
- `https://onlive-cursos-XXXX.vercel.app` → homepage
- `https://onlive-cursos-XXXX.vercel.app/admin` → painel master
- `https://onlive-cursos-XXXX.vercel.app/kamille/2026-05-12/00-INDICE.html` → curso da Kamille

---

## 🔐 PASSO 8 · Adicionar variáveis no Vercel (2 min)

As variáveis do `.env.local` só funcionam na sua máquina. Pra Vercel funcionar, precisa adicionar lá também.

```bash
cd ~/dev/onlive-cursos

# Adiciona cada variável
vercel env add ADMIN_PASSWORD production
# Cola: onlive123 (ou outra senha forte)

vercel env add NEXT_PUBLIC_APP_URL production
# Cola: https://cursos.onlive.com.br
```

Re-deploy pra aplicar:
```bash
vercel --prod
```

---

## 🔗 PASSO 9 · Conectar domínio cursos.onlive.com.br (5 min)

Se você tem o domínio `onlive.com.br` configurado em algum DNS (Registro.br, Cloudflare, etc), faz isso:

### 9a · Adicionar no Vercel
```bash
vercel domains add cursos.onlive.com.br
```

Ou via UI: https://vercel.com/[seu-time]/onlive-cursos/settings/domains → "Add"

### 9b · Adicionar registro DNS no seu provedor

Vercel mostra o que precisa adicionar. Geralmente é um CNAME:

| Tipo | Nome | Valor |
|---|---|---|
| CNAME | cursos | cname.vercel-dns.com |

DNS propaga em 5-60 min. Depois disso, `cursos.onlive.com.br/admin` está no ar.

---

## 🔄 PASSO 10 · Workflow de uso recorrente (a partir de agora)

A partir de agora, toda mudança segue esse fluxo:

### Adicionar nova live (Selliver nova ou data nova):

```bash
cd ~/dev/onlive-cursos

# 1. Cria novo arquivo de dados (copia o exemplo e edita)
cp data/kamille-2026-05-12.json data/julia-2026-05-19.json

# 2. Edita os campos no Cursor (selliver, hero, persona, etc)
cursor data/julia-2026-05-19.json

# 3. Roda o build (gera os HTMLs em public/julia/2026-05-19/)
npm run build:course -- data/julia-2026-05-19.json

# 4. Confere localmente
npm run dev
# Abre http://localhost:3000/admin pra ver na lista

# 5. Push pra Vercel
git add .
git commit -m "feat: nova live julia 19-mai"
git push

# Vercel deploya automático em ~2 min
```

### Adicionar vídeos do YouTube (Painel Master):

1. Acessa `cursos.onlive.com.br/admin/curso/julia/2026-05-19`
2. Cola URL do YouTube em cada módulo
3. **Auto-save em 800ms** — não precisa clicar nada
4. Pra que as mudanças apareçam pra Selliver, faz `git pull && git add . && git push` (no painel V2 isso será automático via Octokit)

### Editar conteúdo de módulo (raro):

```bash
cursor templates/[NN]-[Nome].html.hbs
# Edita o template
npm run rebuild:all   # re-renderiza todos os cursos
git add . && git commit -m "fix: ajuste módulo X" && git push
```

---

## 🆘 Troubleshooting

### "command not found: vercel"
```bash
npm i -g vercel
```

### Build falha com "Cannot find module 'handlebars'"
```bash
cd ~/dev/onlive-cursos
npm install handlebars  # se você quer trocar o engine puro Node por Handlebars
```

### Vercel deploy mostra 404 em `/kamille/2026-05-12/00-INDICE.html`
- Confere que `public/kamille/2026-05-12/00-INDICE.html` existe localmente
- Confere que esse folder foi commitado: `git status` não deve mostrar arquivos não rastreados ali
- `git push` pra Vercel rebuildar

### Painel Master não mostra cursos
- Confere que `data/[slug]-[date].json` existe
- Confere que `public/[slug]/[date]/` existe (significa que o build script rodou)

### Painel Master falha ao salvar vídeos no Vercel
- O Vercel é serverless — filesystem **não é persistente** em produção
- Pra produção real, precisa migrar pra: GitHub commits via Octokit, Vercel KV, ou Supabase
- **Workaround MVP:** edite `videos.json` localmente, dá `git push`, Vercel reflete

---

## 📊 Custos esperados

| Item | Custo mensal |
|---|---|
| Vercel Hobby | **R$ 0** (até 100GB bandwidth) |
| GitHub | R$ 0 |
| Domain `onlive.com.br` (já tem) | R$ 0 |
| **TOTAL** | **R$ 0/mês** pra começar |

Quando ativar Claude API pra gerar cursos automáticos: ~R$ 5-10 por curso gerado.

---

## ✅ Checklist final

Depois de seguir todos os passos:

- [ ] `cursos.onlive.com.br/admin` abre o Painel Master
- [ ] Vejo "Kamille · 2026-05-12" na lista
- [ ] Click em ⚙ Configurar abre o editor
- [ ] Cola URL do YouTube e o iframe aparece
- [ ] Click em 👀 Ver curso abre o curso público
- [ ] No curso público, vídeo aparece no topo dos módulos onde colei URL

Se todos os 6 ✓, **sistema está no ar**.

---

## 📞 Próximo passo após deploy

1. Copia o link do curso da Kamille (`cursos.onlive.com.br/kamille/2026-05-12/00-INDICE.html`)
2. Manda no WhatsApp dela hoje à noite
3. Ela começa amanhã (T-7d → T-5d) os módulos 1 e 2

Próximas semanas:
- Migrar templates 02-09 pra Handlebars (atualmente são HTMLs estáticos copiados — funcionam, mas não têm dados dinâmicos da live)
- Conectar Claude API no `/api/generate-course` pra gerar cursos novos pelo form sem mexer em terminal
- Adicionar Octokit pra que edits do Painel Master commitem auto no GitHub (sem precisar `git push` manual)
