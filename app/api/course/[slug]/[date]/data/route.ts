import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// GET — lê data/[slug]-[date].json
export async function GET(req: Request, ctx: { params: Promise<{ slug: string; date: string }> }) {
  const { slug, date } = await ctx.params;
  const filePath = path.join(process.cwd(), 'data', `${slug}-${date}.json`);
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 });
  }
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  return NextResponse.json(data);
}
