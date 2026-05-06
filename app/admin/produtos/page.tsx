'use client';

import { useEffect, useState } from 'react';

type ProductStatus = 'active' | 'inactive' | 'selective';

interface Product {
  id: string;
  name: string;
  slug: string;
  date: string;
  status: ProductStatus;
  sellivers: string[];
  course_path: string;
  category: string;
  key_phrase: string;
  created_at: string;
}

const ALL_SELLIVERS = ['kamille', 'kauane', 'kerollen', 'teste'];

const STATUS_LABELS: Record<ProductStatus, { label: string; color: string }> = {
  active:    { label: 'Ativo para todos',   color: 'bg-green-100 text-green-800 border-green-200' },
  inactive:  { label: 'Inativo',             color: 'bg-gray-100 text-gray-500 border-gray-200' },
  selective: { label: 'Seletivo',            color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
};

export default function ProdutosAdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [expandedSellivers, setExpandedSellivers] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/products', {
      headers: { Authorization: 'Bearer onlive2026' },
    })
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function updateStatus(id: string, status: ProductStatus, sellivers?: string[]) {
    setSaving(id);
    const r = await fetch(`/api/admin/products?id=${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer onlive2026',
      },
      body: JSON.stringify({ status, sellivers: sellivers ?? [] }),
    });
    const json = await r.json();
    if (r.ok) {
      setProducts((prev) => prev.map((p) => (p.id === id ? json.product : p)));
    }
    setSaving(null);
  }

  function toggleSelliver(product: Product, selliver: string) {
    const next = product.sellivers.includes(selliver)
      ? product.sellivers.filter((s) => s !== selliver)
      : [...product.sellivers, selliver];
    updateStatus(product.id, 'selective', next);
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">

        <header className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-purple-600"></div>
              <p className="text-xs text-purple-600 font-bold tracking-widest">ONLIVE · ADMIN</p>
            </div>
            <h1 className="text-3xl font-bold">Gerenciar Produtos</h1>
            <p className="text-sm text-gray-500 mt-1">Controle quais cursos estão visíveis e para quais Sellivers</p>
          </div>
          <a href="/admin/nova-live"
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors">
            + Novo produto
          </a>
        </header>

        {/* Legend */}
        <div className="flex gap-3 mb-6 flex-wrap">
          {(Object.entries(STATUS_LABELS) as [ProductStatus, { label: string; color: string }][]).map(([s, { label, color }]) => (
            <span key={s} className={`px-3 py-1 rounded-full text-xs font-bold border ${color}`}>{label}</span>
          ))}
        </div>

        {loading && (
          <div className="text-center py-16 text-gray-400">
            <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Carregando produtos…
          </div>
        )}

        {!loading && products.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
            <p className="text-2xl mb-3">📦</p>
            <p className="text-gray-500 font-medium">Nenhum produto cadastrado ainda.</p>
            <a href="/admin/nova-live" className="inline-block mt-4 text-purple-600 font-bold hover:underline">
              Cadastrar primeiro produto →
            </a>
          </div>
        )}

        <div className="space-y-4">
          {products.map((product) => (
            <div key={product.id}
              className={`bg-white rounded-xl border-2 transition-colors overflow-hidden ${
                product.status === 'inactive' ? 'border-gray-200 opacity-60' :
                product.status === 'selective' ? 'border-yellow-200' : 'border-purple-100'
              }`}>

              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-bold text-gray-900 truncate">{product.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold border flex-shrink-0 ${STATUS_LABELS[product.status].color}`}>
                        {STATUS_LABELS[product.status].label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">
                      {product.category} · criado {new Date(product.created_at).toLocaleDateString('pt-BR')}
                    </p>
                    {product.key_phrase && (
                      <p className="text-xs text-purple-700 italic border-l-2 border-purple-300 pl-2">
                        "{product.key_phrase}"
                      </p>
                    )}
                  </div>

                  {/* Course link */}
                  <a
                    href={`${process.env.NEXT_PUBLIC_APP_URL ?? ''}${product.course_path}00-INDICE.html`}
                    target="_blank" rel="noopener"
                    className="flex-shrink-0 text-purple-600 hover:text-purple-800 text-xs font-bold border border-purple-200 px-2 py-1 rounded-lg"
                  >
                    Ver curso →
                  </a>
                </div>

                {/* Status controls */}
                <div className="flex gap-2 mt-4 flex-wrap">
                  {(['active', 'inactive', 'selective'] as ProductStatus[]).map((s) => (
                    <button
                      key={s}
                      disabled={saving === product.id}
                      onClick={() => {
                        if (s === 'selective') {
                          setExpandedSellivers(expandedSellivers === product.id ? null : product.id);
                          if (product.status !== 'selective') updateStatus(product.id, 'selective', product.sellivers);
                        } else {
                          updateStatus(product.id, s);
                          setExpandedSellivers(null);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                        product.status === s
                          ? STATUS_LABELS[s].color + ' shadow-sm'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      } disabled:opacity-50`}
                    >
                      {saving === product.id && product.status === s ? '…' :
                        s === 'active' ? '🟢 Ativo' :
                        s === 'inactive' ? '⭕ Inativo' : '🎯 Seletivo'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selliver selector (when selective) */}
              {(product.status === 'selective' || expandedSellivers === product.id) && (
                <div className="bg-yellow-50 border-t border-yellow-100 px-5 py-4">
                  <p className="text-xs font-bold text-yellow-800 mb-3 tracking-wider">SELLIVERS COM ACESSO</p>
                  <div className="flex gap-3 flex-wrap">
                    {ALL_SELLIVERS.map((sel) => (
                      <button
                        key={sel}
                        onClick={() => toggleSelliver(product, sel)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-bold border transition-colors ${
                          product.sellivers.includes(sel)
                            ? 'bg-yellow-500 text-white border-yellow-500'
                            : 'border-gray-300 text-gray-500 hover:border-yellow-400'
                        }`}
                      >
                        {sel}
                      </button>
                    ))}
                  </div>
                  {product.sellivers.length === 0 && (
                    <p className="text-xs text-yellow-700 mt-2">⚠️ Nenhuma selliver selecionada — o produto não aparece para ninguém.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Portal links */}
        {products.length > 0 && (
          <div className="mt-8 bg-white rounded-xl border p-5">
            <p className="text-xs font-bold text-gray-500 mb-3 tracking-wider">LINKS DO PORTAL POR SELLIVER</p>
            <div className="space-y-2">
              {ALL_SELLIVERS.map((sel) => (
                <div key={sel} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 capitalize">{sel}</span>
                  <a
                    href={`/portal/${sel}`}
                    target="_blank"
                    className="text-xs text-purple-600 hover:underline font-mono"
                  >
                    /portal/{sel} →
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
