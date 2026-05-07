'use client';

import { useState } from 'react';
import { SELLIVERS } from '@/data/sellivers';

// ── Types ──────────────────────────────────────────────────────────────────
type Differential = { label: string; description: string };

type FeatureItem = { feature: string; beneficio: string; para_quem: string; demo_visual: string };

type ProductAnalysis = {
  hero: {
    name: string; category: string; price_full: number; price_live: number;
    stock: number; differentials: Differential[]; main_objection: string; key_phrase: string;
  };
  compliance: {
    regulated_category: string; forbidden_claims: string[];
    allowed_claims: string[]; anvisa_registration: string;
  };
  product_analysis: {
    target_audience: string; main_pains: string[]; main_desires: string[];
    product_strengths: string[]; live_selling_angle: string;
  };
  feature_map?: FeatureItem[];
  angulo_principal?: { feature: string; motivo: string };
  demo_principal?: { setup: string; o_que_mostra: string; frase_chave: string; duracao_segundos: number };
  concorrente_referencia?: { nome: string; preco_referencia: string; nosso_diferencial: string };
  bundle_natural?: { descricao: string; preco_estimado: number; angulo: string };
  gate5?: { demo_vel_30s: boolean; compliance_ok: boolean; preco_impulso_br: boolean; bundle_aov80: boolean; sinal: string };
  checklist_entrega?: Record<string, boolean>;
};

type FormState = {
  selliver: { slug: string; name: string; level: 'iniciante' | 'intermediaria' | 'pro'; previous_lives: number; whatsapp: string };
  live: { date: string; time: string; duration_min: number; context: 'regular' | 'brand-day' | 'cast-day' | 'lancamento'; master_coupon: string };
  hero: { name: string; category: string; price_full: number; price_live: number; extra_coupon: string; stock: number; main_objection: string };
  differentials: Differential[];
  compliance: { regulated_category: string; forbidden_claims: string; allowed_claims: string; anvisa_registration: string };
  selected_sellivers: string[];
};

const ACTIVE_SELLIVER_IDS = SELLIVERS.filter((s) => s.ativo).map((s) => s.id);

const EMPTY_FORM: FormState = {
  selliver: { slug: '', name: '', level: 'iniciante', previous_lives: 0, whatsapp: '' },
  live: { date: '', time: '19:00', duration_min: 90, context: 'regular', master_coupon: '' },
  hero: { name: '', category: '', price_full: 0, price_live: 0, extra_coupon: '', stock: 50, main_objection: '' },
  differentials: [{ label: '', description: '' }, { label: '', description: '' }, { label: '', description: '' }],
  compliance: { regulated_category: '', forbidden_claims: '', allowed_claims: '', anvisa_registration: '' },
  selected_sellivers: ACTIVE_SELLIVER_IDS,
};

const ADMIN_PASSWORD = 'onlive2026';

// ── Main component ─────────────────────────────────────────────────────────
export default function NovaLivePage() {
  const [step, setStep] = useState<'url' | 'review' | 'done'>('url');
  const [productUrl, setProductUrl] = useState('');
  const [extraContext, setExtraContext] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null);
  const [analysisOpen, setAnalysisOpen] = useState(true);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [secondaryProducts, setSecondaryProducts] = useState<
    { name: string; price_live: number; bundle_with_hero: boolean }[]
  >([]);
  type GenerateResult = {
    status: string;
    url: string;
    indice_url: string;
    distribution: Array<{
      selliver_id: string;
      selliver_nome: string;
      whatsapp: string;
      indice_url: string;
    }>;
  };

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResult | null>(null);

  // ── Step 1: Analyze URL ────────────────────────────────────────────────
  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = productUrl.trim();
    if (!trimmed) { setAnalyzeError('Cole o link do produto antes de continuar.'); return; }
    if (!trimmed.startsWith('http')) { setAnalyzeError('Link inválido — precisa começar com http:// ou https://'); return; }
    setAnalyzing(true);
    setAnalyzeError(null);

    try {
      const r = await fetch('/api/analyze-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ADMIN_PASSWORD}`,
        },
        body: JSON.stringify({ url: productUrl.trim(), extra_context: extraContext.trim() || undefined }),
      });

      const json = await r.json();
      if (!r.ok) throw new Error(json.message ?? `Erro ${r.status}`);

      const a: ProductAnalysis = json.analysis;
      setAnalysis(a);

      // Pre-fill form with analysis data
      setForm({
        ...EMPTY_FORM,
        hero: {
          name: a.hero.name ?? '',
          category: a.hero.category ?? '',
          price_full: Number(a.hero.price_full) || 0,
          price_live: Number(a.hero.price_live) || 0,
          extra_coupon: '',
          stock: Number(a.hero.stock) || 50,
          main_objection: a.hero.main_objection ?? '',
        },
        differentials: (a.hero.differentials ?? []).slice(0, 3).map((d) => ({
          label: d.label ?? '',
          description: d.description ?? '',
        })),
        compliance: {
          regulated_category: a.compliance.regulated_category ?? '',
          forbidden_claims: (a.compliance.forbidden_claims ?? []).join('\n'),
          allowed_claims: (a.compliance.allowed_claims ?? []).join('\n'),
          anvisa_registration: a.compliance.anvisa_registration ?? '',
        },
      });

      setStep('review');
    } catch (err: any) {
      setAnalyzeError(err.message);
    } finally {
      setAnalyzing(false);
    }
  }

  // ── Step 2: Generate Course ────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    try {
      // Auto-gera slug a partir do nome do produto
      const productSlug = form.hero.name
        .toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .slice(0, 40);

      // Coupon a partir da primeira palavra do produto (ex: MASCARALIVE)
      const autoCoupon = form.hero.name
        .split(' ')[0]
        .toUpperCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 10) + 'LIVE';

      const today = new Date().toISOString().split('T')[0];

      const payload = {
        ...form,
        selected_sellivers: form.selected_sellivers,
        selliver: {
          slug: productSlug,
          name: 'Selliver',
          level: 'iniciante' as const,
          previous_lives: 0,
          whatsapp: '',
        },
        live: {
          date: today,
          time: '19:00',
          duration_min: 90,
          context: 'regular' as const,
          master_coupon: autoCoupon,
        },
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

      const r = await fetch('/api/generate-course', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ADMIN_PASSWORD}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await r.json();
      if (!r.ok) throw new Error(json.message ?? `Erro ${r.status}`);
      setResult(json);
      setStep('done');
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">

        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-purple-600"></div>
            <p className="text-sm text-purple-600 font-bold tracking-widest">ONLIVE · ADMIN</p>
          </div>
          <h1 className="text-4xl font-bold">Novo Curso Selliver</h1>
          <p className="text-gray-500 mt-1 text-sm">Cole o link do produto → IA analisa → confirma → 10 módulos publicados</p>
        </header>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {(['url', 'review', 'done'] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step === s ? 'bg-purple-600 text-white' :
                (step === 'review' && i === 0) || (step === 'done' && i <= 1) ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>{step !== 'url' && i === 0 ? '✓' : step === 'done' && i === 1 ? '✓' : i + 1}</div>
              <span className={`text-sm hidden sm:block ${step === s ? 'text-purple-700 font-bold' : 'text-gray-400'}`}>
                {s === 'url' ? 'Link do produto' : s === 'review' ? 'Revisar + configurar' : 'Curso gerado'}
              </span>
              {i < 2 && <div className="w-8 h-0.5 bg-gray-200 mx-1"></div>}
            </div>
          ))}
        </div>

        {/* ── STEP 1: URL ───────────────────────────────────────────────── */}
        {step === 'url' && (
          <form onSubmit={handleAnalyze} className="space-y-4">
            <div className="bg-white rounded-2xl border-2 border-purple-100 p-8 shadow-sm">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">🔗</div>
                <div>
                  <h2 className="text-xl font-bold">Link do produto</h2>
                  <p className="text-sm text-gray-500 mt-0.5">TikTok Shop, Shopee, Mercado Livre, site da marca — qualquer URL funciona</p>
                </div>
              </div>

              <input
                type="text"
                value={productUrl}
                onChange={(e) => setProductUrl(e.target.value)}
                placeholder="https://www.tiktok.com/shop/products/... ou qualquer link"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base focus:border-purple-500 focus:outline-none transition-colors"
              />

              <div className="mt-5">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Contexto adicional <span className="font-normal text-gray-400">(opcional)</span>
                </label>
                <textarea
                  value={extraContext}
                  onChange={(e) => setExtraContext(e.target.value)}
                  rows={4}
                  placeholder="Cole aqui ficha técnica, ingredientes, resultados de testes, informações do fornecedor, observações sobre o público ou qualquer detalhe que enriquece a análise…"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-mono focus:border-purple-500 focus:outline-none transition-colors resize-none"
                />
              </div>

              {analyzeError && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                  ✗ {analyzeError}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={analyzing || !productUrl.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white font-bold py-4 rounded-xl text-lg transition-colors flex items-center justify-center gap-3"
            >
              {analyzing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analisando produto com IA…
                </>
              ) : '🔍 Analisar produto'}
            </button>

            {analyzing && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-5 text-sm">
                <p className="font-bold text-purple-900 mb-3">O que está acontecendo:</p>
                <ol className="space-y-2 list-decimal list-inside text-purple-700">
                  <li>Buscando conteúdo da página do produto</li>
                  <li>Claude analisa: ingredientes ativos, diferenciais, embalagem, certificações</li>
                  <li>Pesquisa público-alvo, dores, desejos e forças do produto</li>
                  <li>Mapeia regulação ANVISA e claims permitidos / proibidos</li>
                  <li>Pré-preenche o formulário automaticamente</li>
                </ol>
              </div>
            )}
          </form>
        )}

        {/* ── STEP 2: REVIEW ────────────────────────────────────────────── */}
        {step === 'review' && analysis && (
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Analysis card */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-2xl overflow-hidden shadow-lg">
              <button
                type="button"
                onClick={() => setAnalysisOpen(!analysisOpen)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-sm">🧠</div>
                  <div>
                    <p className="font-bold text-sm">Análise completa — {analysis.hero.name}</p>
                    <p className="text-xs text-gray-400">Features · Público · Dores · Demo · Forças · Ângulo</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {analysis.gate5 && (
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      analysis.gate5.sinal === 'Hero candidate' ? 'bg-green-500/20 text-green-300 border border-green-500/40' :
                      analysis.gate5.sinal === 'Trending candidate' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40' :
                      analysis.gate5.sinal === 'Avaliar' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40' :
                      'bg-red-500/20 text-red-300 border border-red-500/40'
                    }`}>
                      {analysis.gate5.sinal === 'Hero candidate' ? '★ Hero' :
                       analysis.gate5.sinal === 'Trending candidate' ? '↗ Trending' :
                       analysis.gate5.sinal === 'Avaliar' ? '? Avaliar' : '✗ Recusar'}
                    </span>
                  )}
                  <span className="text-gray-400">{analysisOpen ? '▲' : '▼'}</span>
                </div>
              </button>

              {analysisOpen && (
                <div className="px-6 pb-6 space-y-5 border-t border-white/10 pt-5">

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-purple-600/20 border border-purple-500/30 rounded-xl p-4">
                      <p className="text-xs text-purple-300 font-bold mb-2 tracking-wider">FRASE-CHAVE PARA DECORAR</p>
                      <p className="text-white text-sm font-semibold leading-relaxed">"{analysis.hero.key_phrase}"</p>
                    </div>
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                      <p className="text-xs text-yellow-300 font-bold mb-2 tracking-wider">ÂNGULO DE ABERTURA NA LIVE</p>
                      <p className="text-yellow-100 text-sm leading-relaxed">{analysis.product_analysis.live_selling_angle}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 font-bold mb-2 tracking-wider">PÚBLICO-ALVO</p>
                    <p className="text-gray-200 text-sm leading-relaxed">{analysis.product_analysis.target_audience}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-red-400 font-bold mb-2 tracking-wider">DORES</p>
                      <div className="space-y-1.5">
                        {(analysis.product_analysis.main_pains ?? []).map((p, i) => (
                          <div key={i} className="bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2 text-xs text-red-200 leading-snug">{p}</div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-green-400 font-bold mb-2 tracking-wider">DESEJOS</p>
                      <div className="space-y-1.5">
                        {(analysis.product_analysis.main_desires ?? []).map((d, i) => (
                          <div key={i} className="bg-green-900/20 border border-green-800/30 rounded-lg px-3 py-2 text-xs text-green-200 leading-snug">{d}</div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-blue-400 font-bold mb-2 tracking-wider">FORÇAS DO PRODUTO</p>
                      <div className="space-y-1.5">
                        {(analysis.product_analysis.product_strengths ?? []).map((s, i) => (
                          <div key={i} className="bg-blue-900/20 border border-blue-800/30 rounded-lg px-3 py-2 text-xs text-blue-200 leading-snug">{s}</div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Feature Map */}
                  {analysis.feature_map && analysis.feature_map.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <p className="text-xs text-orange-400 font-bold tracking-wider">MAPA DE FEATURES</p>
                        {analysis.angulo_principal && (
                          <span className="text-xs bg-orange-500/20 text-orange-300 border border-orange-500/30 px-2 py-0.5 rounded-full">
                            Principal: {analysis.angulo_principal.feature}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {analysis.feature_map.map((f, i) => {
                          const isPrincipal = analysis.angulo_principal?.feature === f.feature;
                          return (
                            <div key={i} className={`rounded-lg px-3 py-2.5 border text-xs leading-snug ${
                              isPrincipal
                                ? 'bg-orange-900/30 border-orange-500/50'
                                : 'bg-white/5 border-white/10'
                            }`}>
                              <div className="flex items-center gap-1.5 mb-1">
                                {isPrincipal && <span className="text-orange-400">★</span>}
                                <span className="font-bold text-white">{f.feature}</span>
                                <span className="text-gray-400">→</span>
                                <span className="text-gray-300">{f.para_quem}</span>
                              </div>
                              <p className="text-gray-400 mb-1">{f.beneficio}</p>
                              <p className="text-teal-300/80 italic">📹 {f.demo_visual}</p>
                            </div>
                          );
                        })}
                      </div>
                      {analysis.angulo_principal && (
                        <p className="text-xs text-orange-300/70 mt-2 italic">
                          Por que principal: {analysis.angulo_principal.motivo}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Demo Principal + Concorrente + Bundle */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {analysis.demo_principal && (
                      <div className="bg-teal-900/20 border border-teal-500/30 rounded-xl p-3">
                        <p className="text-xs text-teal-300 font-bold mb-2 tracking-wider">🎬 DEMO PRINCIPAL</p>
                        <p className="text-xs text-gray-400 mb-1"><span className="text-white font-medium">Setup:</span> {analysis.demo_principal.setup}</p>
                        <p className="text-xs text-gray-400 mb-1"><span className="text-white font-medium">On camera:</span> {analysis.demo_principal.o_que_mostra}</p>
                        <p className="text-xs text-teal-200 font-semibold mt-2">"{analysis.demo_principal.frase_chave}"</p>
                        <p className="text-xs text-gray-500 mt-1">{analysis.demo_principal.duracao_segundos}s</p>
                      </div>
                    )}
                    {analysis.concorrente_referencia && (
                      <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                        <p className="text-xs text-gray-400 font-bold mb-2 tracking-wider">⚔️ CONCORRENTE</p>
                        <p className="text-xs text-white font-medium">{analysis.concorrente_referencia.nome}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{analysis.concorrente_referencia.preco_referencia}</p>
                        <p className="text-xs text-green-300 mt-2">{analysis.concorrente_referencia.nosso_diferencial}</p>
                      </div>
                    )}
                    {analysis.bundle_natural && (
                      <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-3">
                        <p className="text-xs text-purple-300 font-bold mb-2 tracking-wider">📦 BUNDLE</p>
                        <p className="text-xs text-white">{analysis.bundle_natural.descricao}</p>
                        {analysis.bundle_natural.preco_estimado > 0 && (
                          <p className="text-xs text-purple-300 mt-1 font-medium">R$ {analysis.bundle_natural.preco_estimado}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1 italic">{analysis.bundle_natural.angulo}</p>
                      </div>
                    )}
                  </div>

                  {/* Checklist de entrega */}
                  {analysis.checklist_entrega && (
                    <div className="border-t border-white/10 pt-4">
                      <p className="text-xs text-gray-400 font-bold mb-3 tracking-wider">CHECKLIST DA ANÁLISE</p>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                        {Object.entries(analysis.checklist_entrega).map(([key, val]) => (
                          <div key={key} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs ${
                            val ? 'bg-green-900/20 text-green-300' : 'bg-red-900/20 text-red-300'
                          }`}>
                            <span>{val ? '✓' : '✗'}</span>
                            <span className="truncate">{key.replace(/_/g, ' ')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Hero product — pre-filled, editable */}
            <Section title="Produto (pré-preenchido — revise)" emoji="🛍️">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Nome do produto" value={form.hero.name} onChange={(v) => setForm({ ...form, hero: { ...form.hero, name: v } })} full />
                <Field label="Categoria" value={form.hero.category} onChange={(v) => setForm({ ...form, hero: { ...form.hero, category: v } })} />
                <Field label="Preço cheio (R$)" type="number" value={String(form.hero.price_full)} onChange={(v) => setForm({ ...form, hero: { ...form.hero, price_full: Number(v) } })} />
                <Field label="Preço de live (R$)" type="number" value={String(form.hero.price_live)} onChange={(v) => setForm({ ...form, hero: { ...form.hero, price_live: Number(v) } })} />
                <Field label="Cupom extra" value={form.hero.extra_coupon} onChange={(v) => setForm({ ...form, hero: { ...form.hero, extra_coupon: v.toUpperCase() } })} />
                <Field label="Estoque" type="number" value={String(form.hero.stock)} onChange={(v) => setForm({ ...form, hero: { ...form.hero, stock: Number(v) } })} />
                <Field label="Objeção principal" full value={form.hero.main_objection} onChange={(v) => setForm({ ...form, hero: { ...form.hero, main_objection: v } })} />
              </div>
              <p className="text-xs font-bold text-gray-500 mt-4 mb-2 tracking-wider">DIFERENCIAIS</p>
              {form.differentials.map((d, i) => (
                <div key={i} className="grid grid-cols-3 gap-3 mb-2">
                  <Field label={`Label ${i + 1}`} value={d.label} onChange={(v) => {
                    const nd = [...form.differentials]; nd[i] = { ...nd[i], label: v }; setForm({ ...form, differentials: nd });
                  }} />
                  <div className="col-span-2">
                    <Field label={`Descrição ${i + 1}`} value={d.description} onChange={(v) => {
                      const nd = [...form.differentials]; nd[i] = { ...nd[i], description: v }; setForm({ ...form, differentials: nd });
                    }} />
                  </div>
                </div>
              ))}
            </Section>

            {/* ===== Sellivers ===== */}
            <section className="bg-white rounded-xl border p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">👥</span>
                <div>
                  <h2 className="text-base font-bold">Quem recebe o curso</h2>
                  <p className="text-xs text-gray-400">Por padrão todas marcadas. Desmarque se quiser limitar.</p>
                </div>
              </div>
              <div className="space-y-2">
                {SELLIVERS.filter((s) => s.ativo).map((s) => (
                  <label key={s.id} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={form.selected_sellivers.includes(s.id)}
                      onChange={(e) => {
                        const nd = e.target.checked
                          ? [...form.selected_sellivers, s.id]
                          : form.selected_sellivers.filter((id) => id !== s.id);
                        setForm({ ...form, selected_sellivers: nd });
                      }}
                      className="w-5 h-5 accent-purple-600"
                    />
                    <div className="flex-1">
                      <div className="font-bold text-sm">{s.nome}</div>
                      <div className="text-xs text-gray-500">{s.horario_live} · {s.nicho}</div>
                    </div>
                  </label>
                ))}
              </div>
              <div className="mt-3 flex gap-4">
                <button type="button"
                  onClick={() => setForm({ ...form, selected_sellivers: ACTIVE_SELLIVER_IDS })}
                  className="text-sm text-purple-600 underline">
                  Selecionar todas
                </button>
                <button type="button"
                  onClick={() => setForm({ ...form, selected_sellivers: [] })}
                  className="text-sm text-gray-500 underline">
                  Limpar
                </button>
              </div>
            </section>

            {/* Compliance — pre-filled */}
            <Section title="Compliance (pré-preenchido — revise)" emoji="⚖️">
              <div className="grid grid-cols-2 gap-4 mb-3">
                <Field label="Categoria regulada" value={form.compliance.regulated_category} onChange={(v) => setForm({ ...form, compliance: { ...form.compliance, regulated_category: v } })} />
                <Field label="Registro ANVISA" value={form.compliance.anvisa_registration} onChange={(v) => setForm({ ...form, compliance: { ...form.compliance, anvisa_registration: v } })} />
              </div>
              <Textarea label="Claims PROIBIDOS (1 por linha)" value={form.compliance.forbidden_claims} onChange={(v) => setForm({ ...form, compliance: { ...form.compliance, forbidden_claims: v } })} />
              <Textarea label="Claims PERMITIDOS (1 por linha)" value={form.compliance.allowed_claims} onChange={(v) => setForm({ ...form, compliance: { ...form.compliance, allowed_claims: v } })} />
            </Section>

            {/* Secondary products */}
            <Section title="Produtos secundários" emoji="➕" subtitle="Opcional — cross-sell na live">
              <div className="flex justify-end mb-2">
                <button type="button"
                  onClick={() => setSecondaryProducts([...secondaryProducts, { name: '', price_live: 0, bundle_with_hero: false }])}
                  className="text-purple-600 font-bold text-sm hover:text-purple-800">
                  + Adicionar
                </button>
              </div>
              {secondaryProducts.length === 0 && <p className="text-sm text-gray-400 text-center py-2">Nenhum.</p>}
              {secondaryProducts.map((p, i) => (
                <div key={i} className="grid grid-cols-4 gap-3 mb-2 items-end">
                  <div className="col-span-2"><Field label={`Nome ${i + 1}`} value={p.name} onChange={(v) => { const ns = [...secondaryProducts]; ns[i] = { ...ns[i], name: v }; setSecondaryProducts(ns); }} /></div>
                  <Field label="Preço live" type="number" value={String(p.price_live)} onChange={(v) => { const ns = [...secondaryProducts]; ns[i] = { ...ns[i], price_live: Number(v) }; setSecondaryProducts(ns); }} />
                  <div className="flex items-center gap-2 pb-1">
                    <input type="checkbox" id={`b-${i}`} checked={p.bundle_with_hero}
                      onChange={(e) => { const ns = [...secondaryProducts]; ns[i] = { ...ns[i], bundle_with_hero: e.target.checked }; setSecondaryProducts(ns); }}
                      className="accent-purple-600" />
                    <label htmlFor={`b-${i}`} className="text-xs">Bundle?</label>
                    <button type="button" onClick={() => setSecondaryProducts(secondaryProducts.filter((_, j) => j !== i))} className="ml-auto text-red-400 hover:text-red-600 text-sm">✕</button>
                  </div>
                </div>
              ))}
            </Section>

            {submitError && (
              <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 text-sm text-red-700">✗ {submitError}</div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setStep('url')}
                className="px-6 py-4 rounded-xl border-2 border-gray-200 text-gray-600 font-bold hover:border-gray-300 transition-colors">
                ← Voltar
              </button>
              <button type="submit" disabled={submitting}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white font-bold py-4 rounded-xl text-lg transition-colors flex items-center justify-center gap-3">
                {submitting ? (
                  <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Gerando curso…</>
                ) : '🟣 Gerar curso'}
              </button>
            </div>

            {submitting && (
              <div className="bg-purple-50 border-2 border-purple-300 rounded-xl p-5">
                <p className="text-sm font-bold text-purple-900 mb-3">
                  ⏳ Gerando… leva 1–2 minutos. Não feche essa aba.
                </p>
                <div className="space-y-2 text-sm text-purple-700">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                    <span>Claude analisando produto + gerando 12 camadas PSS-10…</span>
                  </div>
                  <div className="flex items-center gap-2 opacity-50">
                    <div className="w-4 h-4 border-2 border-purple-200 rounded-full flex-shrink-0" />
                    <span>Renderizando 10 módulos HTML</span>
                  </div>
                  <div className="flex items-center gap-2 opacity-50">
                    <div className="w-4 h-4 border-2 border-purple-200 rounded-full flex-shrink-0" />
                    <span>Publicando + enviando link para Sellivers</span>
                  </div>
                </div>
                <p className="text-xs text-purple-500 mt-3">
                  A IA gera ~15.000 tokens de conteúdo estruturado — isso vale o tempo.
                </p>
              </div>
            )}
          </form>
        )}

        {/* ── STEP 3: DONE ──────────────────────────────────────────────── */}
        {step === 'done' && result && (
          <div className="space-y-4">

            {/* Curso gerado — 1 só */}
            <div className="bg-green-50 border-2 border-green-400 rounded-xl p-5">
              <p className="font-bold text-green-900 mb-1">✓ Curso gerado com sucesso</p>
              <a href={result.indice_url} target="_blank" rel="noopener"
                className="text-sm text-green-800 underline break-all">
                {result.indice_url}
              </a>
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(result.indice_url)}
                  className="bg-white border border-green-300 text-green-800 font-bold py-1.5 px-4 rounded-lg text-sm hover:bg-green-100 transition-colors">
                  📋 Copiar link
                </button>
              </div>
            </div>

            {/* Distribuição — mesmo link, WhatsApp diferente */}
            <p className="text-sm font-bold text-gray-600 tracking-wider">ENVIAR PARA</p>
            {result.distribution.map((r) => {
              const mensagem = `Oi ${r.selliver_nome}! Seu curso pré-live tá pronto: ${r.indice_url}`;
              const whatsappUrl = `https://wa.me/${r.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(mensagem)}`;
              return (
                <div key={r.selliver_id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-sm">{r.selliver_nome}</p>
                    <p className="text-xs text-gray-400">{r.whatsapp}</p>
                  </div>
                  <a href={whatsappUrl} target="_blank" rel="noopener"
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg text-sm text-center transition-colors whitespace-nowrap">
                    💬 Abrir WhatsApp
                  </a>
                </div>
              );
            })}

            <button
              onClick={() => { setStep('url'); setProductUrl(''); setExtraContext(''); setAnalysis(null); setResult(null); setForm(EMPTY_FORM); setSecondaryProducts([]); }}
              className="w-full border-2 border-gray-200 rounded-xl py-3 text-gray-600 font-bold hover:border-gray-300 transition-colors">
              + Gerar outro curso
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

// ── Shared form helpers ────────────────────────────────────────────────────
function Section({ title, emoji, subtitle, children }: { title: string; emoji: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">{emoji}</span>
        <div>
          <h2 className="text-base font-bold">{title}</h2>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', full = false }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; full?: boolean;
}) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <label className="block text-xs font-bold text-gray-600 mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-100 transition-colors" />
    </div>
  );
}

function Select({ label, value, options, onChange }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-600 mb-1">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-purple-500 focus:outline-none transition-colors">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function Textarea({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="mt-3">
      <label className="block text-xs font-bold text-gray-600 mb-1">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-mono focus:border-purple-500 focus:outline-none transition-colors resize-none" />
    </div>
  );
}
