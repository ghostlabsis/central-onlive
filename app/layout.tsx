import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OnLive Cursos · Painel',
  description: 'Sistema de geração de cursos de Selliver',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
