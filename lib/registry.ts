import { readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';

const REGISTRY_PATH = resolve(process.cwd(), 'data', 'products-registry.json');

export type ProductStatus = 'active' | 'inactive' | 'selective';

export interface ProductEntry {
  id: string;
  name: string;
  slug: string;
  date: string;
  status: ProductStatus;
  sellivers: string[];          // só usado quando status='selective'
  course_path: string;          // ex: /mascara-led/2026-05-05/
  product_url: string;
  key_phrase: string;
  category: string;
  created_at: string;
}

interface Registry {
  version: number;
  products: ProductEntry[];
}

export function readRegistry(): Registry {
  try {
    return JSON.parse(readFileSync(REGISTRY_PATH, 'utf-8'));
  } catch {
    return { version: 1, products: [] };
  }
}

export function writeRegistry(registry: Registry): void {
  writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2), 'utf-8');
}

export function registerProduct(entry: Omit<ProductEntry, 'created_at'>): ProductEntry {
  const registry = readRegistry();
  const existing = registry.products.findIndex((p) => p.id === entry.id);
  const product: ProductEntry = { ...entry, created_at: new Date().toISOString() };

  if (existing >= 0) {
    registry.products[existing] = { ...registry.products[existing], ...product };
  } else {
    registry.products.unshift(product);
  }

  writeRegistry(registry);
  return product;
}

export function updateProductStatus(
  id: string,
  status: ProductStatus,
  sellivers?: string[]
): ProductEntry | null {
  const registry = readRegistry();
  const idx = registry.products.findIndex((p) => p.id === id);
  if (idx < 0) return null;

  registry.products[idx].status = status;
  registry.products[idx].sellivers = sellivers ?? [];
  writeRegistry(registry);
  return registry.products[idx];
}

export function getProductsForSelliver(selliver: string): ProductEntry[] {
  const { products } = readRegistry();
  return products.filter((p) => {
    if (p.status === 'inactive') return false;
    if (p.status === 'active') return true;
    if (p.status === 'selective') return p.sellivers.includes(selliver);
    return false;
  });
}
