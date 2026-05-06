import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-2xl text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-3 h-3 rounded-full bg-purple-500 animate-pulse"></div>
          <span className="font-bold text-purple-600 tracking-wider text-sm">ONLIVE · CURSOS</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
          Sistema de Cursos<br/><span className="text-purple-600">para Sellivers</span>
        </h1>
        <p className="text-lg text-gray-600 mb-10">
          Geração automática de cursos personalizados pra cada live. Método LIVE™.
          Microlearning + multimodal + just-in-time.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/admin" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-lg transition">
            🟣 Painel Master (admin)
          </Link>
          <Link href="/kamille/2026-05-12/00-INDICE.html" className="bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold py-4 px-8 rounded-lg transition">
            👀 Ver curso de exemplo
          </Link>
        </div>
        <p className="text-xs text-gray-400 mt-12">v1.0 · MVP · {new Date().getFullYear()}</p>
      </div>
    </main>
  );
}
