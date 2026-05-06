import { NextResponse } from 'next/server';
import { head } from '@vercel/blob';

export async function GET(req: Request, ctx: { params: Promise<{ slug: string; date: string }> }) {
  const { slug, date } = await ctx.params;
  try {
    const blob = await head(`courses/${slug}/${date}/_data.json`).catch(() => null);
    if (!blob) return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 });
    const res = await fetch(blob.url);
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Erro ao carregar dados do curso' }, { status: 500 });
  }
}
