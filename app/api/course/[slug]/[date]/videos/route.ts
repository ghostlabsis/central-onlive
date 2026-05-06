import { NextResponse } from 'next/server';
import { head, put } from '@vercel/blob';

export async function GET(req: Request, ctx: { params: Promise<{ slug: string; date: string }> }) {
  const { slug, date } = await ctx.params;
  try {
    const blob = await head(`courses/${slug}/${date}/videos.json`).catch(() => null);
    if (!blob) return NextResponse.json({});
    const res = await fetch(blob.url);
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({});
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ slug: string; date: string }> }) {
  const { slug, date } = await ctx.params;
  const body = await req.json();
  await put(`courses/${slug}/${date}/videos.json`, JSON.stringify(body, null, 2), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
  });
  return NextResponse.json({ status: 'ok', saved: Object.keys(body).length });
}
