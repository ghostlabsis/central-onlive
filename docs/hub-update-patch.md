# Patch do Hub — n-olive-mu-76.vercel.app

## O que muda

1. **Stage 3**: botão muda de URL estática para o Portal da Selliver
2. **Novo handler**: `tryConsumeApproveStage3()` — recebe o callback do M1 e marca Etapa 3 como concluída

---

## Mudança 1: STAGES[2].actions

Substitua em `const STAGES = [...]`, no objeto do stage `id: 3`:

```js
// ANTES
actions: [
  { kind: 'primary', label: 'Curso da próxima live →', url: '#', external: true, dynamic: 'courseUrl' }
],

// DEPOIS
actions: [
  { kind: 'primary', label: 'Ver produtos disponíveis →', url: null, external: true, dynamic: 'portalUrl' }
],
```

---

## Mudança 2: renderStages() — resolver portalUrl

Dentro de `stage.actions.forEach(a => {`, após o bloco de `courseUrl`, adicione:

```js
if (a.dynamic === 'portalUrl') {
  url = `https://cursos.onlive.com.br/portal/${state.selliver}`;
  // local dev:
  // url = `http://localhost:3000/portal/${state.selliver}`;
}
```

---

## Mudança 3: novo handler approveStage3

Adicione esta função logo abaixo de `tryConsumeApproveQuiz()`:

```js
function tryConsumeApproveStage3() {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get('approveStage3');
  if (!encoded) return false;

  try {
    const payload = JSON.parse(decodeURIComponent(escape(atob(encoded))));
    if (!payload.selliver || !SELLIVER_CODES[payload.selliver]) {
      console.warn('approveStage3: payload inválido', payload);
      return false;
    }

    state.selliver = payload.selliver;
    loadOrInit();

    // Marca Etapa 3 (índice 2) como concluída
    state.data.stages[2].done = true;
    state.data.stages[2].checklist = state.data.stages[2].checklist.map(() => true);
    save();

    showApp();
    renderAll();

    setTimeout(() => toast('🎓 Módulo 1 concluído · Etapa 3 desbloqueada!'), 300);

    // Limpa URL
    history.replaceState({}, '', window.location.pathname);
    return true;
  } catch (err) {
    console.error('Falha ao processar approveStage3', err);
    return false;
  }
}
```

---

## Mudança 4: chamar o handler no INIT

No bloco `// === INIT ===`, adicione após a chamada de `tryConsumeApproveQuiz()`:

```js
if (tryConsumeApproveStage3()) return;
```

---

## Fluxo completo após o patch

```
Hub Etapa 3
  ↓ "Ver produtos disponíveis →"
cursos.onlive.com.br/portal/kamille
  ↓ "Começar Módulo 1"
01-O-Produto.html?selliver=kamille&product=ID&hub=1
  ↓ selliver estuda, aprova o módulo
  ↓ aparece "✓ Módulo 1 concluído — Voltar ao Portal"
/portal/kamille?m1done=ID
  ↓ portal marca M1 como concluído
  ↓ botão "Liberar Etapa 4" aparece
  ↓ selliver clica
n-olive-mu-76.vercel.app/?approveStage3=BASE64TOKEN
  ↓ hub marca Etapa 3 ✓
Etapa 4 desbloqueada
```
