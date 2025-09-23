import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService, Product, ProductFilter, ProductCategory, ProductBrand } from '../services';

// Query keys
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filter?: ProductFilter) => [...productKeys.lists(), filter] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...productKeys.details(), id] as const,
  categories: () => [...productKeys.all, 'categories'] as const,
  brands: () => [...productKeys.all, 'brands'] as const,
  recommended: () => [...productKeys.all, 'recommended'] as const,
  search: (query: string) => [...productKeys.all, 'search', query] as const,
};

/**
 * Hook to fetch products with filters
 */
export function useProducts(filter?: ProductFilter) {
  return useQuery({
    queryKey: productKeys.list(filter),
    queryFn: () => productService.getProducts(filter),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
}

/**
 * Hook to fetch a single product by ID
 */
export function useProduct(productId: string | number, enabled = true) {
  return useQuery({
    queryKey: productKeys.detail(productId),
    queryFn: () => productService.getProductById(productId),
    enabled: enabled && !!productId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to fetch product categories
 */
export function useProductCategories() {
  return useQuery({
    queryKey: productKeys.categories(),
    queryFn: () => productService.getCategories(),
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
}

/**
 * Hook to fetch product brands
 */
export function useProductBrands() {
  return useQuery({
    queryKey: productKeys.brands(),
    queryFn: () => productService.getBrands(),
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}

/**
 * Hook to fetch recommended products
 */
export function useRecommendedProducts(limit = 10) {
  return useQuery({
    queryKey: productKeys.recommended(),
    queryFn: () => productService.getRecommendedProducts(limit),
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
  });
}

/**
 * Hook to search products
 */
export function useProductSearch(query: string, enabled = true) {
  return useQuery({
    queryKey: productKeys.search(query),
    queryFn: () => productService.searchProducts(query),
    enabled: enabled && query.length > 2,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to prefetch product data
 */
export function usePrefetchProduct() {
  const queryClient = useQueryClient();

  return (productId: string | number) => {
    queryClient.prefetchQuery({
      queryKey: productKeys.detail(productId),
      queryFn: () => productService.getProductById(productId),
      staleTime: 5 * 60 * 1000,
    });
  };
}

/**
 * Hook to invalidate product queries
 */
export function useInvalidateProducts() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: productKeys.all }),
    invalidateList: () => queryClient.invalidateQueries({ queryKey: productKeys.lists() }),
    invalidateDetail: (id: string | number) =>
      queryClient.invalidateQueries({ queryKey: productKeys.detail(id) }),
    invalidateCategories: () =>
      queryClient.invalidateQueries({ queryKey: productKeys.categories() }),
    invalidateBrands: () =>
      queryClient.invalidateQueries({ queryKey: productKeys.brands() }),
  };
}