import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// GET — lê videos.json do curso
export async function GET(req: Request, ctx: { params: Promise<{ slug: string; date: string }> }) {
  const { slug, date } = await ctx.params;
  const filePath = path.join(process.cwd(), 'public', slug, date, 'videos.json');
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({});
  }
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  return NextResponse.json(data);
}

// POST — atualiza videos.json
export async function POST(req: Request, ctx: { params: Promise<{ slug: string; date: string }> }) {
  const { slug, date } = await ctx.params;
  const body = await req.json();
  const dir = path.join(process.cwd(), 'public', slug, date);
  if (!fs.existsSync(dir)) {
    return NextResponse.json({ error: 'Curso não renderizado ainda. Roda `npm run build:course` primeiro.' }, { status: 404 });
  }
  fs.writeFileSync(path.join(dir, 'videos.json'), JSON.stringify(body, null, 2), 'utf-8');
  return NextResponse.json({ status: 'ok', saved: Object.keys(body).length });
}
