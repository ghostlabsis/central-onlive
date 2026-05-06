import type { NextApiRequest, NextApiResponse } from 'next';
import { getProductsForSelliver, getAllProducts } from '../../lib/registry';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const { selliver } = req.query;

  if (selliver && typeof selliver === 'string') {
    const products = await getProductsForSelliver(selliver);
    return res.status(200).json({ products });
  }

  const auth = req.headers.authorization;
  if (auth !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const products = await getAllProducts();
  return res.status(200).json({ products });
}
