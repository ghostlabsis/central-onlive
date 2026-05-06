#!/usr/bin/env node
/**
 * build-course.js — OnLive Cursos · Build Engine
 *
 * Lê um arquivo JSON de dados de curso e renderiza os 10 HTMLs no folder /public/[selliver]/[data]/
 *
 * Uso:
 *   node scripts/build-course.js data/kamille-2026-05-12.json
 *
 * Engine: Mustache-like minimal puro Node (zero deps). Suporta:
 *   {{var}} · {{a.b.c}} · {{#each list}}...{{/each}} · {{#if cond}}...{{/if}}
 *   {{> partial}} · helpers customizados via {{@helper arg}}
 *
 * Em produção, recomenda-se substituir por Handlebars real (npm i handlebars)
 * para suporte completo a mais helpers e melhor performance. A sintaxe abaixo é
 * 100% compatível.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TEMPLATES_DIR = path.join(ROOT, 'templates');
const PARTIALS_DIR = path.join(TEMPLATES_DIR, '_partials');
const PUBLIC_DIR = path.join(ROOT, 'public');

const MODULES = [
  { file: '00-INDICE', title: 'Índice' },
  { file: '01-O-Produto', title: 'O Produto' },
  { file: '02-A-Audiencia', title: 'A Audiência' },
  { file: '03-O-Ciclo-OnLive', title: 'O Ciclo OnLive' },
  { file: '04-Hooks', title: 'Hooks que Capturam' },
  { file: '05-Demonstracao', title: 'Demonstração que Vende' },
  { file: '06-Oferta-e-Preco', title: 'Oferta e Preço' },
  { file: '07-CTA-e-Objecoes', title: 'CTA e Objeções' },
  { file: '08-Plano-B', title: 'Plano B e Emergências' },
  { file: '09-Prova-Final', title: 'Prova Final — Live Simulada' },
];

// ===== Helpers (compatível com Handlebars) =====
const helpers = {
  moduleNumber: (n) => String(n).padStart(2, '0'),
  formatPrice: (price) => 'R$ ' + Number(price).toFixed(2).replace('.', ','),
  json: (ctx) => JSON.stringify(ctx),
  uppercase: (s) => String(s).toUpperCase(),
  progressPct: (current, total) => Math.round((current / total) * 100),
};

// ===== Resolve dot path =====
function resolvePath(ctx, dotpath) {
  if (dotpath === '.') return ctx.__primitive !== undefined ? ctx.__primitive : ctx;
  if (dotpath === '@first') return ctx.__first;
  if (dotpath === '@last') return ctx.__last;
  if (dotpath === '@index') return ctx.__index;
  if (dotpath === 'this') {
    // Em iteração de primitivos, `this` é o valor primitivo
    if (ctx.__primitive !== undefined) return ctx.__primitive;
    // Em iteração de objetos, `this` é o item (já espalhado em ctx)
    return ctx;
  }
  return dotpath.split('.').reduce((acc, key) => {
    if (acc == null) return undefined;
    return acc[key];
  }, ctx);
}

// ===== Carregar partials =====
const partials = {};
function loadPartials() {
  if (!fs.existsSync(PARTIALS_DIR)) return;
  for (const f of fs.readdirSync(PARTIALS_DIR)) {
    if (!f.endsWith('.hbs')) continue;
    const name = path.basename(f, '.hbs');
    partials[name] = fs.readFileSync(path.join(PARTIALS_DIR, f), 'utf-8');
    console.log(`  ✓ partial registered: ${name}`);
  }
}

// ===== Template engine =====
function render(template, ctx) {
  // 1. Partials {{> name}}
  template = template.replace(/\{\{>\s*([\w-]+)\s*\}\}/g, (m, name) => {
    if (!partials[name]) {
      console.warn(`    ⚠ partial não encontrado: ${name}`);
      return '';
    }
    return render(partials[name], ctx);
  });

  // 2. {{#if path}} blocks
  template = template.replace(/\{\{#if\s+([^\}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (m, cond, body) => {
    const v = resolvePath(ctx, cond.trim());
    if (v && (Array.isArray(v) ? v.length > 0 : true)) {
      return render(body, ctx);
    }
    return '';
  });

  // 3. {{#unless cond}} blocks (oposto de #if)
  template = template.replace(/\{\{#unless\s+([^\}]+)\}\}([\s\S]*?)\{\{\/unless\}\}/g, (m, cond, body) => {
    const v = resolvePath(ctx, cond.trim());
    const truthy = v && (Array.isArray(v) ? v.length > 0 : true);
    if (!truthy) return render(body, ctx);
    return '';
  });

  // 4. {{#each list}} blocks
  template = template.replace(/\{\{#each\s+([^\}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (m, listPath, body) => {
    const list = resolvePath(ctx, listPath.trim());
    if (!Array.isArray(list)) return '';
    return list.map((item, i) => {
      let itemCtx;
      if (typeof item === 'object' && item !== null) {
        // Item OBJETO: ctx primeiro, depois item (item sobrepõe ctx em conflitos)
        itemCtx = { ...ctx, ...item, __first: i === 0, __last: i === list.length - 1, __index: i };
      } else {
        // Item PRIMITIVO: ctx + flag __primitive
        itemCtx = { ...ctx, __primitive: item, __first: i === 0, __last: i === list.length - 1, __index: i };
      }
      return render(body, itemCtx);
    }).join('');
  });

  // 4. {{#with path}} blocks (suporte mínimo)
  template = template.replace(/\{\{#with\s+([^\}]+)\}\}([\s\S]*?)\{\{\/with\}\}/g, (m, p, body) => {
    const v = resolvePath(ctx, p.trim());
    if (v == null) return '';
    return render(body, { ...ctx, ...v });
  });

  // 5. Helpers com argumentos: {{helper arg1 arg2}}
  template = template.replace(/\{\{(\w+)\s+([^\}]+?)\}\}/g, (m, helperName, argsStr) => {
    if (!helpers[helperName]) return m;
    const args = argsStr.trim().split(/\s+/).map(a => {
      // string literal?
      if (a.startsWith('"') && a.endsWith('"')) return a.slice(1, -1);
      if (a.startsWith("'") && a.endsWith("'")) return a.slice(1, -1);
      // number?
      if (!isNaN(Number(a))) return Number(a);
      // path
      return resolvePath(ctx, a);
    });
    const v = helpers[helperName](...args);
    return v == null ? '' : String(v);
  });

  // 6. {{lookup obj index}} compat
  template = template.replace(/\{\{lookup\s+([^\s]+)\s+(\d+)\}\}/g, (m, p, idx) => {
    const arr = resolvePath(ctx, p);
    if (!Array.isArray(arr)) return '';
    const v = arr[parseInt(idx)];
    return v == null ? '' : String(v);
  });

  // 7. Variáveis simples {{path}}
  template = template.replace(/\{\{([^\#\/\>\@\!][^\}]*?)\}\}/g, (m, p) => {
    p = p.trim();
    // se contém espaço, é helper sem captura — ignora (já processado)
    if (p.includes(' ')) return m;
    const v = resolvePath(ctx, p);
    if (v == null) return '';
    if (typeof v === 'object') return ''; // não derrama JSON em variáveis simples
    return String(v)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  });

  return template;
}

// ===== Build =====
function build(dataPath) {
  const absolutePath = path.resolve(dataPath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`❌ Data file not found: ${absolutePath}`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(absolutePath, 'utf-8'));
  const slug = data.selliver.slug;
  const date = data.live.date;
  const outDir = path.join(PUBLIC_DIR, slug, date);
  fs.mkdirSync(outDir, { recursive: true });

  console.log(`\n🟣 Building course: ${data.selliver.name} · ${date}\n`);
  console.log(`📂 Output: ${outDir}\n`);

  console.log('Loading partials...');
  loadPartials();

  console.log('\nRendering modules...');
  let rendered = 0, skipped = 0;

  for (let i = 0; i < MODULES.length; i++) {
    const mod = MODULES[i];
    const tplPath = path.join(TEMPLATES_DIR, `${mod.file}.html.hbs`);
    if (!fs.existsSync(tplPath)) {
      console.log(`  ⚠ skipped (template missing): ${mod.file}.html.hbs`);
      skipped++;
      continue;
    }
    const tpl = fs.readFileSync(tplPath, 'utf-8');
    const ctx = {
      ...data,
      module: {
        number: i,
        number_padded: String(i).padStart(2, '0'),
        title: mod.title,
        file: mod.file,
        total: MODULES.length - 1,
        progress_pct: Math.round((i / (MODULES.length - 1)) * 100),
        next_file: i < MODULES.length - 1 ? MODULES[i + 1].file : null,
        prev_file: i > 0 ? MODULES[i - 1].file : null,
      },
      brand: {
        name: process.env.NEXT_PUBLIC_BRAND_NAME || 'OnLive',
        purple: '#7547FF',
        black: '#0A0A0A',
      },
    };

    const html = render(tpl, ctx);
    const outFile = path.join(outDir, `${mod.file}.html`);
    fs.writeFileSync(outFile, html, 'utf-8');
    console.log(`  ✓ ${mod.file}.html (${(html.length / 1024).toFixed(1)} KB)`);
    rendered++;
  }

  // Salva data.json para auditoria
  fs.writeFileSync(path.join(outDir, '_data.json'), JSON.stringify(data, null, 2), 'utf-8');

  // Cria videos.json vazio se ainda não existir (Ana preenche depois via Painel Master)
  const videosPath = path.join(outDir, 'videos.json');
  if (!fs.existsSync(videosPath)) {
    const empty = {};
    for (let j = 1; j <= 9; j++) empty[String(j).padStart(2, '0')] = '';
    fs.writeFileSync(videosPath, JSON.stringify(empty, null, 2), 'utf-8');
    console.log(`  ✓ videos.json (slots vazios pra Ana preencher no Painel)`);
  }

  console.log(`\n✅ Done — ${rendered} renderizados, ${skipped} pulados`);
  console.log(`\n🌐 Preview local:`);
  console.log(`   open ${path.join(outDir, '00-INDICE.html')}`);
  console.log(`\n🌍 URL pública (após deploy Vercel):`);
  console.log(`   https://cursos.onlive.com.br/${slug}/${date}/\n`);
}

// ===== CLI =====
const arg = process.argv[2];
if (!arg) {
  console.error('Uso: node scripts/build-course.js <data.json>');
  console.error('Ex:  node scripts/build-course.js data/kamille-2026-05-12.json');
  process.exit(1);
}
build(arg);
