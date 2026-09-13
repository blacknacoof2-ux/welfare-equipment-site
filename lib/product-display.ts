import type { Product } from './products';

function normalizeProductLabel(value: string) {
  return value.trim().replace(/\s+/g, '').replace(/[-_]/g, '').toLocaleLowerCase('ko-KR');
}

export function isSameProductNameAndModel(product: Pick<Product, 'name' | 'model'>) {
  return normalizeProductLabel(product.name) === normalizeProductLabel(product.model);
}

export function getProductDisplayTitle(product: Pick<Product, 'name' | 'model'>) {
  return isSameProductNameAndModel(product)
    ? product.name.trim()
    : `${product.name.trim()} ${product.model.trim()}`;
}
