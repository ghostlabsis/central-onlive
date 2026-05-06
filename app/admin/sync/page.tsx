'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SyncPage() {
  const [status, setStatus] = useState<{ commit?: string; ago?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function checkStatus() {
    setLoading(true);
    try {
      const r = await fetch('/api/sync/status');
      setStatus(await r.json());
    } catch (e) {
      setStatus({ commit: 'erro', ago: '' });
    }
    setLoading(false);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <p className="text-sm text-purple-600 font-bold tracking-wider">🔄 SINCRONIZAÇÃO</p>
      <h1 className="text-3xl font-bold mt-1 mb-2">Vault ↔ Vercel</h1>
      <p className="text-gray-600 mb-8">Como o sistema mantém vault (Obsidian) sincronizado com o site público.</p>

      <div className="bg-white border rounded-xl p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">📐 Arquitetura</h2>
        <div className="bg-gray-50 rounded-lg p-4 font-mono text-xs leading-relaxed">
{`┌──────────────────┐    git push     ┌──────────────┐    auto-deploy    ┌──────────────┐
│  Vault Obsidian  │ ──────────────► │   GitHub     │ ─────────────────► │   Vercel     │
│  (iCloud sync)   │                 │  onlive-     │                    │  cursos.     │
│                  │                 │   cursos     │                    │  onlive.     │
│  + Cursor edita  │ ◄────────────── │              │ ◄───────────────── │  com.br      │
└──────────────────┘    git pull      └──────────────┘    revalidate      └──────────────┘`}
        </div>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 mb-6">
        <h2 className="font-bold text-purple-900 mb-3">✅ Como funciona na prática</h2>
        <ol className="text-sm text-gray-800 space-y-2 list-decimal list-inside">
          <li><strong>Source of truth = GitHub</strong> (não vault, não Vercel)</li>
          <li>Vault tem <code>onlive-cursos-skeleton/</code> que é o repo (clonado dentro do iCloud)</li>
          <li>Edits via <strong>Cursor</strong> (você abre o folder, edita, commit, push)</li>
          <li>Vercel detecta push em <code>main</code> e re-deploya em ~2 min</li>
          <li>Edits via <strong>Painel Master</strong> (esse aqui) salvam direto no filesystem do servidor — em produção, vão pra GitHub via Octokit (sprint 2)</li>
        </ol>
      </div>

      <div className="bg-white border rounded-xl p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">🛠️ Comandos úteis (terminal)</h2>
        <div className="space-y-3">
          <div>
            <p className="text-sm font-bold mb-1">Pull mudanças do GitHub:</p>
            <code className="block bg-gray-900 text-green-400 p-3 rounded-lg text-sm font-mono">git pull origin main</code>
          </div>
          <div>
            <p className="text-sm font-bold mb-1">Gerar curso novo localmente:</p>
            <code className="block bg-gray-900 text-green-400 p-3 rounded-lg text-sm font-mono">npm run build:course -- data/[slug]-[date].json</code>
          </div>
          <div>
            <p className="text-sm font-bold mb-1">Push pra Vercel:</p>
            <code className="block bg-gray-900 text-green-400 p-3 rounded-lg text-sm font-mono">git add . && git commit -m "novo curso" && git push</code>
          </div>
          <div>
            <p className="text-sm font-bold mb-1">Re-render todos os cursos:</p>
            <code className="block bg-gray-900 text-green-400 p-3 rounded-lg text-sm font-mono">npm run rebuild:all</code>
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4">🔍 Status do deploy</h2>
        <button onClick={checkStatus} disabled={loading} className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-2 rounded-lg disabled:opacity-50">
          {loading ? 'Checando...' : 'Checar último deploy'}
        </button>
        {status && (
          <div className="mt-4 bg-gray-50 rounded-lg p-4 text-sm">
            <p>Último commit: <code className="font-mono">{status.commit ?? '-'}</code></p>
            <p>Há: {status.ago ?? '-'}</p>
          </div>
        )}
        <p className="text-xs text-gray-500 mt-3">⚠️ Esse endpoint precisa ser implementado pra usar Vercel API (sprint 2).</p>
      </div>

      <div className="mt-8 text-center">
        <Link href="/admin" className="text-purple-600 hover:underline">← Voltar pro Painel Master</Link>
      </div>
    </div>
  );
}
