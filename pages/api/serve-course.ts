import type { NextApiRequest, NextApiResponse } from 'next';
import { head } from '@vercel/blob';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { selliver, data, module: mod } = req.query;

  const slug = typeof selliver === 'string' ? selliver : '';
  const date = typeof data === 'string' ? data : '';
  const rawFile = Array.isArray(mod) ? mod.join('/') : (mod ?? '00-INDICE.html');

  // Aceita só .html e .json
  if (!rawFile.match(/\.(html|json)$/)) {
    return res.status(400).send('Tipo de arquivo não suportado');
  }

  const blobPath = `courses/${slug}/${date}/${rawFile}`;

  try {
    const blob = await head(blobPath).catch(() => null);
    if (!blob) {
      return res.status(404).send(`Arquivo não encontrado: ${blobPath}`);
    }

    const upstream = await fetch(blob.url);
    if (!upstream.ok) {
      return res.status(502).send('Erro ao buscar arquivo');
    }

    const content = await upstream.text();
    const contentType = rawFile.endsWith('.json')
      ? 'application/json'
      : 'text/html; charset=utf-8';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
    res.status(200).send(content);
  } catch (err: any) {
    res.status(500).send(`Erro: ${err.message}`);
  }
}
