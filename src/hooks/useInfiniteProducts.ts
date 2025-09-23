import { useInfiniteQuery } from '@tanstack/react-query';
import odooService from '../services/odoo/odooService';

interface UseInfiniteProductsOptions {
  category_id?: number;
  search?: string;
  limit?: number;
}

export const useInfiniteProducts = (options: UseInfiniteProductsOptions = {}) => {
  const { category_id, search, limit = 20 } = options;

  return useInfiniteQuery({
    queryKey: ['products', 'infinite', { category_id, search }],
    queryFn: async ({ pageParam = 0 }) => {
      const offset = pageParam * limit;
      
      const domain: any[] = [
        ['sale_ok', '=', true],
        ['qty_available', '>', 0],
      ];

      if (category_id) {
        domain.push(['categ_id', '=', category_id]);
      }

      if (search) {
        domain.push(['name', 'ilike', search]);
      }

      const result = await odooService.searchRead({
        model: 'product.product',
        domain,
        fields: [
          'id', 'name', 'list_price', 'standard_price', 'qty_available',
          'categ_id', 'image_128', 'default_code', 'barcode', 'uom_name'
        ],
        limit,
        offset,
        order: 'name ASC',
      });

      return {
        products: result.records,
        nextPage: result.records.length === limit ? pageParam + 1 : undefined,
        totalCount: result.length,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const usePrefetchNextPage = (query: ReturnType<typeof useInfiniteProducts>) => {
  // Prefetch next page when user is near the bottom
  const prefetchNext = () => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      query.fetchNextPage();
    }
  };

  return prefetchNext;
};