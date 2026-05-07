'use client';

import { useState } from 'react';

interface Selliver {
  id: string;
  nome: string;
  whatsapp: string;
}

interface CourseRowActionsProps {
  productId: string;
  slug: string;
  date: string;
  heroName: string;
  indexUrl: string;
  sellivers: Selliver[];
}

const ADMIN_PASSWORD = 'onlive2026';

export function CourseRowActions({ productId, slug, date, heroName, indexUrl, sellivers }: CourseRowActionsProps) {
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showWpp, setShowWpp] = useState(false);
  const [deleted, setDeleted] = useState(false);

  if (deleted) {
    return <span className="text-xs text-gray-400 italic">Excluído</span>;
  }

  async function copyLink() {
    await navigator.clipboard.writeText(indexUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDelete() {
    if (!confirm(`Excluir o curso "${heroName}"?\n\nEssa ação remove do registry e apaga os arquivos do curso.`)) return;
    setDeleting(true);
    try {
      const r = await fetch('/api/admin/delete-course', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ADMIN_PASSWORD}`,
        },
        body: JSON.stringify({ id: productId, slug, date }),
      });
      if (r.ok) setDeleted(true);
      else alert('Erro ao excluir — tente novamente.');
    } finally {
      setDeleting(false);
    }
  }

  function whatsappUrl(selliver: Selliver) {
    const msg = `Oi ${selliver.nome}! Seu curso pré-live tá pronto: ${indexUrl}`;
    return `https://wa.me/${selliver.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {/* Ver curso */}
      <a
        href={indexUrl}
        target="_blank"
        rel="noopener"
        className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 border border-purple-200 px-2 py-1 rounded-lg hover:bg-purple-50 transition-colors"
      >
        👀 Ver
      </a>

      {/* Copiar link */}
      <button
        onClick={copyLink}
        className="inline-flex items-center gap-1 text-xs font-bold text-gray-600 border border-gray-200 px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors"
      >
        {copied ? '✓ Copiado' : '📋 Link'}
      </button>

      {/* WhatsApp — expande lista de sellivers */}
      {sellivers.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setShowWpp(!showWpp)}
            className="inline-flex items-center gap-1 text-xs font-bold text-green-700 border border-green-200 px-2 py-1 rounded-lg hover:bg-green-50 transition-colors"
          >
            💬 WhatsApp {sellivers.length > 1 && `(${sellivers.length})`}
          </button>
          {showWpp && (
            <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 min-w-[200px] py-1">
              {sellivers.map((s) => (
                <a
                  key={s.id}
                  href={whatsappUrl(s)}
                  target="_blank"
                  rel="noopener"
                  className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 transition-colors"
                  onClick={() => setShowWpp(false)}
                >
                  <span className="text-green-500 font-bold">↗</span>
                  <span className="font-semibold">{s.nome}</span>
                  <span className="text-gray-400">{s.whatsapp}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Configurar */}
      <a
        href={`/admin/curso/${slug}/${date}`}
        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 border border-blue-200 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
      >
        ⚙ Editar
      </a>

      {/* Excluir */}
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="inline-flex items-center gap-1 text-xs font-bold text-red-500 border border-red-200 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40"
      >
        {deleting ? '…' : '🗑 Excluir'}
      </button>
    </div>
  );
}
