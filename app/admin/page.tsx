import fs from 'fs';
import path from 'path';
import Link from 'next/link';

interface CourseRow {
  slug: string;
  date: string;
  selliverName: string;
  heroName: string;
  duration: number;
  status: 'draft' | 'rendered' | 'live-done';
  modulesWithVideo: number;
  totalModules: number;
}

// Lê todos os cursos do filesystem (data/*.json)
function listCourses(): CourseRow[] {
  const dataDir = path.join(process.cwd(), 'data');
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(dataDir)) return [];
  const files = fs.readdirSync(dataDir).filter((f) => f.endsWith('.json'));
  return files.map((f): CourseRow => {
    const data = JSON.parse(fs.readFileSync(path.join(dataDir, f), 'utf-8'));
    const slug = data.selliver?.slug ?? 'unknown';
    const date = data.live?.date ?? 'unknown';
    const renderedDir = path.join(publicDir, slug, date);
    const renderedExists = fs.existsSync(renderedDir);
    const videosFile = path.join(renderedDir, 'videos.json');
    let modulesWithVideo = 0;
    if (fs.existsSync(videosFile)) {
      try {
        const v = JSON.parse(fs.readFileSync(videosFile, 'utf-8'));
        modulesWithVideo = Object.values(v).filter((url) => typeof url === 'string' && url.length > 0).length;
      } catch {}
    }
    return {
      slug,
      date,
      selliverName: data.selliver?.name ?? '?',
      heroName: data.hero?.name ?? '?',
      duration: data.live?.duration_min ?? 0,
      status: renderedExists ? 'rendered' : 'draft',
      modulesWithVideo,
      totalModules: 9,
    };
  }).sort((a, b) => b.date.localeCompare(a.date));
}

export default function AdminHomePage() {
  const courses = listCourses();

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-sm text-purple-600 font-bold tracking-wider">PAINEL MASTER</p>
          <h1 className="text-4xl font-bold mt-1">Cursos OnLive</h1>
          <p className="text-gray-600 mt-2">Cada live tem 1 curso. Clica em qualquer um pra editar vídeos do YouTube e configurar.</p>
        </div>
        <Link href="/admin/nova-live" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg">
          ➕ Nova Live
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
          <p className="text-2xl mb-2">📭</p>
          <p className="text-lg text-gray-600 mb-4">Nenhum curso cadastrado ainda.</p>
          <Link href="/admin/nova-live" className="text-purple-600 font-bold underline">Criar primeira live →</Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 font-bold">Data</th>
                <th className="px-4 py-3 font-bold">Selliver</th>
                <th className="px-4 py-3 font-bold">Hero</th>
                <th className="px-4 py-3 font-bold">Duração</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Vídeos</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={`${c.slug}-${c.date}`} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono">{c.date}</td>
                  <td className="px-4 py-3 font-bold">{c.selliverName}</td>
                  <td className="px-4 py-3 text-gray-700">{c.heroName}</td>
                  <td className="px-4 py-3 text-gray-600">{c.duration} min</td>
                  <td className="px-4 py-3">
                    {c.status === 'rendered' ? (
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">✓ Renderizado</span>
                    ) : (
                      <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold">⏳ Draft</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="bg-gray-200 rounded h-2 w-24 overflow-hidden">
                        <div className="bg-purple-500 h-full" style={{ width: `${(c.modulesWithVideo / c.totalModules) * 100}%` }} />
                      </div>
                      <span className="text-xs text-gray-600">{c.modulesWithVideo}/{c.totalModules}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link href={`/admin/curso/${c.slug}/${c.date}`} className="text-purple-600 hover:underline font-bold text-xs">⚙ Configurar</Link>
                      {c.status === 'rendered' && (
                        <a href={`/${c.slug}/${c.date}/00-INDICE.html`} target="_blank" rel="noopener" className="text-blue-600 hover:underline font-bold text-xs">👀 Ver curso</a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Cards de status do sistema */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="bg-white rounded-xl border p-5">
          <p className="text-xs text-gray-500 mb-1">CURSOS TOTAIS</p>
          <p className="text-3xl font-black text-purple-600">{courses.length}</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-xs text-gray-500 mb-1">RENDERIZADOS</p>
          <p className="text-3xl font-black text-green-600">{courses.filter((c) => c.status === 'rendered').length}</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-xs text-gray-500 mb-1">VÍDEOS PREENCHIDOS</p>
          <p className="text-3xl font-black text-blue-600">{courses.reduce((sum, c) => sum + c.modulesWithVideo, 0)} / {courses.length * 9}</p>
        </div>
      </div>

      <div className="mt-8 bg-purple-50 border border-purple-200 rounded-xl p-6">
        <h2 className="font-bold text-purple-900 mb-2">🔄 Como adicionar/editar conteúdo</h2>
        <ol className="text-sm text-gray-800 space-y-1 list-decimal list-inside">
          <li>Click em <strong>Configurar</strong> de qualquer curso pra adicionar vídeos do YouTube por módulo</li>
          <li>Edits automaticamente salvam em <code>data/[slug]-[date].json</code></li>
          <li><code>git push</code> dispara rebuild no Vercel (~2 min)</li>
          <li>Selliver acessa pelo link público do curso</li>
        </ol>
      </div>
    </div>
  );
}
