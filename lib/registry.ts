import { put, head, del } from '@vercel/blob';

const REGISTRY_BLOB_PATH = 'registry/products.json';

export type ProductStatus = 'active' | 'inactive' | 'selective';

export interface ProductEntry {
  id: string;
  name: string;
  slug: string;
  date: string;
  status: ProductStatus;
  sellivers: string[];
  course_path: string;
  product_url: string;
  key_phrase: string;
  category: string;
  created_at: string;
}

interface Registry {
  version: number;
  products: ProductEntry[];
}

async function readRegistry(): Promise<Registry> {
  try {
    const existing = await head(REGISTRY_BLOB_PATH).catch(() => null);
    if (!existing) return { version: 1, products: [] };

    const res = await fetch(existing.url);
    if (!res.ok) return { version: 1, products: [] };
    return await res.json();
  } catch {
    return { version: 1, products: [] };
  }
}

async function writeRegistry(registry: Registry): Promise<void> {
  await put(REGISTRY_BLOB_PATH, JSON.stringify(registry, null, 2), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
  });
}

export async function registerProduct(entry: Omit<ProductEntry, 'created_at'>): Promise<ProductEntry> {
  const registry = await readRegistry();
  const existing = registry.products.findIndex((p) => p.id === entry.id);
  const product: ProductEntry = { ...entry, created_at: new Date().toISOString() };

  if (existing >= 0) {
    registry.products[existing] = { ...registry.products[existing], ...product };
  } else {
    registry.products.unshift(product);
  }

  await writeRegistry(registry);
  return product;
}

export async function updateProductStatus(
  id: string,
  status: ProductStatus,
  sellivers?: string[]
): Promise<ProductEntry | null> {
  const registry = await readRegistry();
  const idx = registry.products.findIndex((p) => p.id === id);
  if (idx < 0) return null;

  registry.products[idx].status = status;
  registry.products[idx].sellivers = sellivers ?? [];
  await writeRegistry(registry);
  return registry.products[idx];
}

export async function getProductsForSelliver(selliver: string): Promise<ProductEntry[]> {
  const { products } = await readRegistry();
  return products.filter((p) => {
    if (p.status === 'inactive') return false;
    if (p.status === 'active') return true;
    if (p.status === 'selective') return p.sellivers.includes(selliver);
    return false;
  });
}

export async function getAllProducts(): Promise<ProductEntry[]> {
  const { products } = await readRegistry();
  return products;
}
