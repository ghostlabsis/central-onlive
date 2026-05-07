import { list, put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

const BLOB_KEY = 'selliver-courses.json';
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, x-admin-password',
};

const DEFAULT_DATA = {
  versao: '1.0',
  atualizadoEm: new Date().toISOString(),
  sellivers: [
    { slug: 'kauane',   nome: 'Kauane',   codigo: '0501', curso: {}, quizAprovado: false },
    { slug: 'kerollen', nome: 'Kerollen', codigo: '0502', curso: {}, quizAprovado: false },
    { slug: 'kamille',  nome: 'Kamille',  codigo: '0500', curso: {}, quizAprovado: false },
    { slug: 'teste',    nome: 'Teste',    codigo: '0000', curso: {}, quizAprovado: false },
  ],
};

export async function GET(req: NextRequest) {
  // Se x-admin-password está presente, valida antes de retornar
  const pass = req.headers.get('x-admin-password');
  if (pass && pass !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS });
  }
  try {
    const { blobs } = await list({ prefix: BLOB_KEY });
    if (!blobs.length) return NextResponse.json(DEFAULT_DATA, { headers: CORS });
    const r = await fetch(blobs[0].url, { cache: 'no-store' });
    return NextResponse.json(await r.json(), {
      headers: { ...CORS, 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json(DEFAULT_DATA, { headers: CORS });
  }
}

export async function POST(req: NextRequest) {
  if (req.headers.get('x-admin-password') !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS });
  }
  const data = await req.json();
  data.atualizadoEm = new Date().toISOString();
  await put(BLOB_KEY, JSON.stringify(data, null, 2), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  return NextResponse.json({ ok: true }, { headers: CORS });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: { ...CORS, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' },
  });
}
