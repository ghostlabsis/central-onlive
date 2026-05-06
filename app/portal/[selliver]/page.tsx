'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface Product {
  id: string;
  name: string;
  slug: string;
  date: string;
  course_path: string;
  category: string;
  key_phrase: string;
}

const HUB_URL = 'https://n-olive-mu-76.vercel.app';

export default function PortalPage() {
  const params = useParams() ?? {};
  const selliver = typeof params.selliver === 'string' ? params.selliver : '';
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedM1, setCompletedM1] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!selliver) return;

    // Carrega produtos ativos para esta selliver
    fetch(`/api/products?selliver=${selliver}`)
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []))
      .finally(() => setLoading(false));

    // Carrega completions do localStorage
    try {
      const raw = localStorage.getItem(`onlive_m1_done_${selliver}`);
      if (raw) setCompletedM1(new Set(JSON.parse(raw)));
    } catch {}
  }, [selliver]);

  // Recebe sinal de conclusão do M1 via postMessage ou query param ?m1done=productId
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const m1done = params.get('m1done');
    if (m1done) {
      markM1Done(m1done);
      // Limpa URL
      history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  function markM1Done(productId: string) {
    setCompletedM1((prev) => {
      const next = new Set(prev);
      next.add(productId);
      try {
        localStorage.setItem(`onlive_m1_done_${selliver}`, JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }

  function openCourse(product: Product) {
    // Abre o M1 do curso com parâmetros para callback
    const base = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
    const m1Url = `${base}${product.course_path}01-O-Produto.html?selliver=${selliver}&product=${product.id}&hub=1`;
    window.open(m1Url, '_blank');
  }

  function getApproveToken(product: Product): string {
    const payload = {
      v: 1,
      selliver,
      product: product.id,
      ts: Date.now(),
    };
    return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  }

  function goBackToHub(product: Product) {
    const token = getApproveToken(product);
    window.location.href = `${HUB_URL}/?approveStage3=${token}`;
  }

  if (!selliver) return null;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
            <span className="text-xs font-bold tracking-widest text-purple-400">ONLIVE · CURSOS</span>
          </div>
          <span className="text-xs text-gray-500 capitalize">{selliver}</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Seus Cursos</h1>
          <p className="text-gray-400 text-sm">
            Cada curso foi criado especialmente para o produto da sua live.
            Complete o <strong className="text-white">Módulo 1</strong> para desbloquear a <strong className="text-white">Etapa 4</strong>.
          </p>
        </div>

        {loading && (
          <div className="text-center py-16 text-gray-500">
            <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Carregando cursos…
          </div>
        )}

        {!loading && products.length === 0 && (
          <div className="text-center py-16 border-2 border-dashed border-white/10 rounded-2xl">
            <p className="text-3xl mb-3">📭</p>
            <p className="text-gray-400">Nenhum curso disponível no momento.</p>
            <p className="text-gray-600 text-sm mt-2">A OnLive vai publicar o curso quando a sua próxima live for confirmada.</p>
          </div>
        )}

        <div className="space-y-4">
          {products.map((product) => {
            const done = completedM1.has(product.id);
            return (
              <div key={product.id}
                className={`rounded-2xl border overflow-hidden transition-all ${
                  done ? 'border-green-500/30 bg-green-950/20' : 'border-white/10 bg-white/5'
                }`}>

                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${
                      done ? 'bg-green-500/20 text-green-400' : 'bg-purple-500/20 text-purple-400'
                    }`}>
                      {done ? '✓' : '📦'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-white">{product.name}</h3>
                        {done && (
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-bold rounded-full border border-green-500/30">
                            M1 concluído
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mb-3">{product.category}</p>
                      {product.key_phrase && (
                        <p className="text-xs text-purple-400 italic border-l-2 border-purple-500/40 pl-2 leading-relaxed">
                          "{product.key_phrase}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 9 módulos progress dots */}
                  <div className="flex gap-1.5 mt-4 mb-5">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full ${
                        done && i === 0 ? 'bg-green-500' :
                        'bg-white/10'
                      }`} />
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 flex-wrap">
                    {!done ? (
                      <button
                        onClick={() => openCourse(product)}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-xl text-sm transition-colors text-center"
                      >
                        🎓 Começar Módulo 1
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => openCourse(product)}
                          className="flex-1 border border-white/20 hover:border-white/40 text-gray-300 font-bold py-3 px-4 rounded-xl text-sm transition-colors"
                        >
                          Ver curso completo →
                        </button>
                        <button
                          onClick={() => goBackToHub(product)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl text-sm transition-colors"
                        >
                          ✓ Liberar Etapa 4
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info */}
        <div className="mt-10 bg-white/5 border border-white/10 rounded-xl p-5 text-sm text-gray-400">
          <p className="font-bold text-white mb-2 text-xs tracking-wider">COMO FUNCIONA</p>
          <ol className="space-y-2 list-decimal list-inside">
            <li>Abra o curso e complete o <strong className="text-white">Módulo 1 · O Produto</strong></li>
            <li>Volte aqui — o botão <strong className="text-white">Liberar Etapa 4</strong> vai aparecer</li>
            <li>Clique para voltar ao Hub e desbloquear a próxima etapa</li>
          </ol>
        </div>
      </main>
    </div>
  );
}
