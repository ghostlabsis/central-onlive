import type { NextApiRequest, NextApiResponse } from 'next';
import { getProductsForSelliver, readRegistry } from '../../lib/registry';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const { selliver } = req.query;

  if (selliver && typeof selliver === 'string') {
    return res.status(200).json({ products: getProductsForSelliver(selliver) });
  }

  // Sem filtro — retorna todos (só para admin autenticado)
  const auth = req.headers.authorization;
  if (auth !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { products } = readRegistry();
  return res.status(200).json({ products });
}
