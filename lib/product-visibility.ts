type ProductIdentity = {
  name: string;
  model: string;
  benefitCode: string;
};

const SEARCH_ONLY_MODELS = new Set(['HM-606', 'HM-608']);
const SEARCH_ONLY_BENEFIT_CODES = new Set(['M06061117101', 'M06060177001']);

export function isSearchOnlyProduct(product: ProductIdentity) {
  const normalizedModel = product.model.trim().toUpperCase();
  const normalizedName = product.name.trim().toUpperCase();
  return SEARCH_ONLY_MODELS.has(normalizedModel)
    || SEARCH_ONLY_MODELS.has(normalizedName)
    || SEARCH_ONLY_BENEFIT_CODES.has(product.benefitCode.trim().toUpperCase());
}

export function filterBrowseProducts<T extends ProductIdentity>(products: T[]) {
  return products.filter((product) => !isSearchOnlyProduct(product));
}
