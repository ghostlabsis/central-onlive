'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const MODULES = [
  { num: '01', file: '01-O-Produto', title: 'O Produto' },
  { num: '02', file: '02-A-Audiencia', title: 'A Audiência' },
  { num: '03', file: '03-O-Ciclo-OnLive', title: 'O Ciclo OnLive' },
  { num: '04', file: '04-Hooks', title: 'Hooks que Capturam' },
  { num: '05', file: '05-Demonstracao', title: 'Demonstração que Vende' },
  { num: '06', file: '06-Oferta-e-Preco', title: 'Oferta e Preço' },
  { num: '07', file: '07-CTA-e-Objecoes', title: 'CTA e Objeções' },
  { num: '08', file: '08-Plano-B', title: 'Plano B e Emergências' },
  { num: '09', file: '09-Prova-Final', title: 'Prova Final' },
];

// Extrai ID do YouTube de qualquer formato de URL
function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match?.[1] ?? null;
}

export default function EditCoursePage() {
  const params = useParams();
  const slug = params?.slug as string;
  const date = params?.date as string;

  const [videos, setVideos] = useState<Record<string, string>>({});
  const [courseData, setCourseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  // Carrega videos.json e course data
  useEffect(() => {
    Promise.all([
      fetch(`/api/course/${slug}/${date}/videos`).then((r) => (r.ok ? r.json() : {})),
      fetch(`/api/course/${slug}/${date}/data`).then((r) => (r.ok ? r.json() : null)),
    ]).then(([v, d]) => {
      setVideos(v);
      setCourseData(d);
      setLoading(false);
    });
  }, [slug, date]);

  // Auto-save com debounce
  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(async () => {
      setSaving(true);
      await fetch(`/api/course/${slug}/${date}/videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(videos),
      });
      setSaving(false);
      setSavedAt(new Date());
    }, 800);
    return () => clearTimeout(timer);
  }, [videos, slug, date, loading]);

  if (loading) return <div className="p-12 text-center">Carregando...</div>;

  function updateVideo(num: string, url: string) {
    setVideos({ ...videos, [num]: url });
  }

  const totalFilled = Object.values(videos).filter((v) => v && v.length > 0).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <Link href="/admin" className="text-sm text-purple-600 hover:underline">← Voltar pra lista de cursos</Link>

      <div className="mt-4 mb-8">
        <p className="text-sm text-purple-600 font-bold tracking-wider">CONFIGURAR CURSO</p>
        <h1 className="text-3xl font-bold mt-1">{courseData?.selliver?.name ?? slug} · {date}</h1>
        <p className="text-gray-600 mt-1">{courseData?.hero?.name}</p>
      </div>

      {/* Status save */}
      <div className="mb-6 flex items-center justify-between bg-white border rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="bg-gray-200 rounded h-2 w-48 overflow-hidden">
            <div className="bg-purple-500 h-full transition-all" style={{ width: `${(totalFilled / 9) * 100}%` }} />
          </div>
          <span className="text-sm text-gray-700"><strong>{totalFilled}/9</strong> módulos com vídeo</span>
        </div>
        <div className="text-xs text-gray-500">
          {saving ? '💾 Salvando...' : savedAt ? `✓ Salvo ${savedAt.toLocaleTimeString('pt-BR')}` : ''}
        </div>
      </div>

      {/* Lista de módulos */}
      <div className="space-y-4">
        {MODULES.map((m) => {
          const url = videos[m.num] || '';
          const ytId = extractYouTubeId(url);
          const valid = url === '' || ytId !== null;

          return (
            <div key={m.num} className={`bg-white rounded-xl border-2 p-5 ${ytId ? 'border-green-300' : 'border-gray-200'}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs text-purple-600 font-bold">MÓDULO {m.num}</p>
                  <h3 className="text-lg font-bold">{m.title}</h3>
                </div>
                {ytId && (
                  <a href={`https://youtube.com/watch?v=${ytId}`} target="_blank" rel="noopener" className="text-xs text-green-700 font-bold">✓ vídeo OK ↗</a>
                )}
              </div>

              <input
                type="text"
                value={url}
                onChange={(e) => updateVideo(m.num, e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className={`w-full px-3 py-2 border rounded-lg text-sm font-mono ${
                  valid ? 'border-gray-300 focus:border-purple-500' : 'border-red-500 bg-red-50'
                }`}
              />
              {!valid && url && <p className="text-xs text-red-600 mt-1">⚠️ URL do YouTube inválida</p>}

              {ytId && (
                <div className="mt-3 aspect-video bg-black rounded-lg overflow-hidden">
                  <iframe
                    src={`https://www.youtube.com/embed/${ytId}`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 bg-purple-50 border border-purple-200 rounded-xl p-6">
        <h2 className="font-bold text-purple-900 mb-2">📌 Como funciona</h2>
        <ol className="text-sm text-gray-800 space-y-1 list-decimal list-inside">
          <li>Cola a URL do YouTube em qualquer formato (watch, embed, share, shorts)</li>
          <li>Auto-save em 800ms — você não precisa clicar "salvar"</li>
          <li>Os vídeos são puxados direto pelo curso público (no slot acima do "L · Learn")</li>
          <li>Se módulo fica em branco, slot mostra "vídeo não disponível ainda" pro Selliver</li>
        </ol>
      </div>

      {courseData?.live?.master_coupon && (
        <div className="mt-4 bg-gray-100 border rounded-xl p-4 text-sm text-gray-700">
          <strong>📋 Dados desta live:</strong>
          <span className="ml-2">Cupom: <code>{courseData.live.master_coupon}</code></span>
          <span className="ml-2">Duração: {courseData.live.duration_min} min</span>
          <span className="ml-2">Persona: {courseData.persona?.fictional_name}</span>
        </div>
      )}
    </div>
  );
}
