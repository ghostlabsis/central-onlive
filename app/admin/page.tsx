import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import { getAllProducts, type ProductStatus } from '@/lib/registry';
import { SELLIVERS } from '@/data/sellivers';
import { CourseRowActions } from './_components/CourseRowActions';

export const dynamic = 'force-dynamic';

function localCourseData(slug: string, date: string) {
  try {
    const dataPath = path.join(process.cwd(), 'data', `${slug}-${date}.json`);
    if (!fs.existsSync(dataPath)) return null;
    return JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  } catch {
    return null;
  }
}

function StatusBadge({ status }: { status: ProductStatus }) {
  if (status === 'active')
    return <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">● Ativo</span>;
  if (status === 'selective')
    return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">◑ Seletivo</span>;
  return <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded text-xs font-bold">○ Inativo</span>;
}

export default async function AdminHomePage() {
  const products = await getAllProducts();

  const rows = products.map((p) => {
    const local = localCourseData(p.slug, p.date);
    const heroName = local?.hero?.name ?? p.name;
    const duration: number = local?.live?.duration_min ?? 0;
    const selliverOwner = SELLIVERS.find((s) => s.slug === p.slug);

    const selliverIds =
      p.status === 'inactive' ? [] : p.status === 'active' ? SELLIVERS.filter((s) => s.ativo).map((s) => s.id) : p.sellivers;

    const selliverDetails = selliverIds
      .map((id) => SELLIVERS.find((s) => s.id === id))
      .filter((s): s is (typeof SELLIVERS)[number] => !!s)
      .map((s) => ({ id: s.id, nome: s.nome, whatsapp: s.whatsapp }));

    const indexUrl = `/${p.slug}/${p.date}/00-INDICE.html`;

    return { p, heroName, duration, selliverOwner, selliverDetails, indexUrl };
  });

  const activeCount = products.filter((p) => p.status !== 'inactive').length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-sm text-purple-600 font-bold tracking-wider">PAINEL MASTER</p>
          <h1 className="text-4xl font-bold mt-1">Cursos OnLive</h1>
          <p className="text-gray-600 mt-2">Cada live tem 1 curso. Clica em qualquer um pra editar e configurar.</p>
        </div>
        <Link href="/admin/nova-live" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg">
          + Nova Live
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
          <p className="text-lg text-gray-600 mb-4">Nenhum curso cadastrado ainda.</p>
          <Link href="/admin/nova-live" className="text-purple-600 font-bold underline">Criar primeira live →</Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 font-bold">Data</th>
                <th className="px-4 py-3 font-bold">Selliver</th>
                <th className="px-4 py-3 font-bold">Produto</th>
                <th className="px-4 py-3 font-bold">Duração</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ p, heroName, duration, selliverOwner, selliverDetails, indexUrl }) => (
                <tr key={`${p.slug}-${p.date}`} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{p.date}</td>
                  <td className="px-4 py-3 font-bold">{selliverOwner?.nome ?? p.slug}</td>
                  <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{heroName}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{duration > 0 ? `${duration} min` : '—'}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3">
                    <CourseRowActions
                      productId={p.id}
                      slug={p.slug}
                      date={p.date}
                      heroName={heroName}
                      indexUrl={indexUrl}
                      sellivers={selliverDetails}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="bg-white rounded-xl border p-5">
          <p className="text-xs text-gray-500 mb-1">CURSOS TOTAIS</p>
          <p className="text-3xl font-black text-purple-600">{products.length}</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-xs text-gray-500 mb-1">ATIVOS / SELETIVOS</p>
          <p className="text-3xl font-black text-green-600">{activeCount}</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-xs text-gray-500 mb-1">INATIVOS</p>
          <p className="text-3xl font-black text-gray-400">{products.length - activeCount}</p>
        </div>
      </div>

      <div className="mt-8 bg-purple-50 border border-purple-200 rounded-xl p-6">
        <h2 className="font-bold text-purple-900 mb-2">Como funciona</h2>
        <ol className="text-sm text-gray-800 space-y-1 list-decimal list-inside">
          <li>Crie uma nova live e o curso é gerado automaticamente</li>
          <li>Clique em <strong>Editar</strong> para configurar vídeos do YouTube por módulo</li>
          <li>Use <strong>WhatsApp</strong> para mandar o link direto para a selliver</li>
          <li>Clique em <strong>Ver</strong> para acessar o curso como a selliver verá</li>
        </ol>
      </div>
    </div>
  );
}
