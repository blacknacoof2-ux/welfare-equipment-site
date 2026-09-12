import { categories as coreCategories } from './categories';
import { additionalCategories } from './additional-categories';

export const categories = [...coreCategories, ...additionalCategories];

export function getCategoryBySlug(slug: string) {
  return categories.find((category) => category.slug === slug);
}
