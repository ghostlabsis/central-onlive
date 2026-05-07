import type { NextApiRequest, NextApiResponse } from 'next';
import { deleteProduct, deleteCourseBlobs } from '../../../lib/registry';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') return res.status(405).end();

  const auth = req.headers.authorization;
  if (auth !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id, slug, date } = req.body as { id: string; slug: string; date: string };
  if (!id || !slug || !date) {
    return res.status(400).json({ error: 'id, slug e date são obrigatórios' });
  }

  try {
    const [removed] = await Promise.all([
      deleteProduct(id),
      deleteCourseBlobs(slug, date),
    ]);

    if (!removed) return res.status(404).json({ error: 'Curso não encontrado no registry' });

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
