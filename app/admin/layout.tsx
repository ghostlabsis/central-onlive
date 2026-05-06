import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-black text-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2 hover:opacity-80">
            <div className="w-3 h-3 rounded-full bg-purple-500 animate-pulse"></div>
            <span className="font-bold tracking-wider text-sm">ONLIVE · MASTER</span>
          </Link>
          <nav className="flex gap-6 text-sm">
            <Link href="/admin" className="hover:text-purple-400 transition">📚 Cursos</Link>
            <Link href="/admin/nova-live" className="hover:text-purple-400 transition">➕ Nova Live</Link>
            <Link href="/admin/sync" className="hover:text-purple-400 transition">🔄 Sync</Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
