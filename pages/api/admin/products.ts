import type { NextApiRequest, NextApiResponse } from 'next';
import { updateProductStatus, type ProductStatus } from '../../../lib/registry';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = req.headers.authorization;
  if (auth !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'PATCH') return res.status(405).end();

  const { id } = req.query;
  if (!id || typeof id !== 'string') return res.status(400).json({ error: 'id required' });

  const { status, sellivers } = req.body as { status: ProductStatus; sellivers?: string[] };
  if (!['active', 'inactive', 'selective'].includes(status)) {
    return res.status(400).json({ error: 'status must be active | inactive | selective' });
  }

  const updated = updateProductStatus(id, status, sellivers);
  if (!updated) return res.status(404).json({ error: 'Product not found' });

  return res.status(200).json({ product: updated });
}
