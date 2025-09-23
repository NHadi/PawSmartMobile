import { QueryClient } from '@tanstack/react-query';
import apiClient from '../services/api/apiClient';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep cache for 10 minutes
      cacheTime: 10 * 60 * 1000,
      // Retry failed requests 2 times
      retry: 2,
      // Retry delay
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus
      refetchOnWindowFocus: false,
      // Refetch on reconnect
      refetchOnReconnect: 'always',
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
    },
  },
});

// Prefetch utility for critical data
export const prefetchProducts = async (categoryId?: number) => {
  await queryClient.prefetchQuery({
    queryKey: ['products', { category_id: categoryId, limit: 20 }],
    queryFn: async () => {
      // Fetch initial products using unified client
      
      const domain: any[] = [
        ['sale_ok', '=', true],
        ['qty_available', '>', 0],
      ];

      if (categoryId) {
        domain.push(['categ_id', '=', categoryId]);
      }

      return apiClient.odooExecute(
        'product.product',
        'search_read',
        [domain],
        {
          fields: [
            'id', 'name', 'list_price', 'standard_price', 'qty_available',
            'categ_id', 'image_128', 'default_code'
          ],
          limit: 20,
          offset: 0,
          order: 'name ASC',
        }
      );
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Invalidate product queries when needed
export const invalidateProducts = () => {
  queryClient.invalidateQueries({ queryKey: ['products'] });
};

// Remove all product queries from cache
export const removeProductQueries = () => {
  queryClient.removeQueries({ queryKey: ['products'] });
};