import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { orderService, Activity } from '../services';
import { useAuth } from '../contexts/AuthContext';

// Query keys
export const activityKeys = {
  all: ['activities'] as const,
  list: (userId?: number, limit?: number) => [...activityKeys.all, 'list', userId, limit] as const,
};

export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (filters: any) => [...orderKeys.lists(), { filters }] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...orderKeys.details(), id] as const,
};

/**
 * Hook to fetch user activities
 * Note: Uses user.id for standalone API (previously used partner_id for Odoo)
 */
export function useActivities(limit: number = 50) {
  const { user } = useAuth();
  // Use user.id for standalone API compatibility
  const userId = user?.id;

  return useQuery({
    queryKey: activityKeys.list(userId, limit),
    queryFn: () => orderService.getActivities(limit, userId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!userId, // Only fetch if user is logged in
  });
}

/**
 * Hook to fetch orders with infinite scroll pagination
 * Note: Uses user.id for standalone API (previously used partner_id for Odoo)
 */
export function useOrders(pageSize: number = 10) {
  const { user } = useAuth();
  const userId = user?.id;

  return useInfiniteQuery({
    queryKey: ['orders', userId, pageSize],
    queryFn: ({ pageParam = 0 }) => {
      return orderService.getOrders({
        user_id: userId,
        limit: pageSize,
        offset: pageParam * pageSize
      });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      // If last page has fewer items than pageSize, we've reached the end
      if (lastPage.length < pageSize) {
        return undefined;
      }
      return pages.length; // Return next page number
    },
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    gcTime: 5 * 60 * 1000,    // Keep in memory for 5 minutes
    enabled: !!userId, // Only fetch if user is logged in
  });
}

/**
 * Hook to fetch orders with simple pagination (legacy)
 * Note: Uses user.id for standalone API (previously used partner_id for Odoo)
 */
export function useOrdersSimple(limit: number = 20) {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: ['orders-simple', userId, limit],
    queryFn: () => orderService.getOrders({
      user_id: userId,
      limit
    }),
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    gcTime: 5 * 60 * 1000,    // Keep in memory for 5 minutes
    enabled: !!userId, // Only fetch if user is logged in
  });
}

/**
 * Hook to fetch a single order by ID
 */
export function useOrder(orderId: string | number) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  return useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: async () => {
      // FIRST: Try to find the order in cached data (which has images!)
      console.log('🔍 Checking cached orders first for order:', orderId);

      const possibleKeys = [
        ['orders', userId, 5],
        ['orders', userId, 10],
        ['orders', userId, 20],
        ['orders-simple', userId, 20],
      ];

      for (const key of possibleKeys) {
        try {
          const cachedData = queryClient.getQueryData(key);
          if (cachedData) {
            let orders = [];

            // Handle both infinite query format and simple array format
            if (cachedData && typeof cachedData === 'object' && 'pages' in cachedData) {
              orders = (cachedData as any).pages.flatMap((page: any) => page);
            } else if (Array.isArray(cachedData)) {
              orders = cachedData;
            }

            const foundOrder = orders.find((order: any) =>
              order.id.toString() === orderId.toString()
            );

            if (foundOrder) {
              console.log('✅ Found order with images in React Query cache:', foundOrder.id);
              console.log('🖼️ Order has items with images:', foundOrder.items?.length || foundOrder.order_line?.length);
              return foundOrder;
            }
          }
        } catch (cacheError) {
          console.log('Cache check failed for key:', key, cacheError);
        }
      }

      // FALLBACK: Only try API if not found in cache
      console.log('⚠️ Order not in cache, trying API call as fallback...');
      try {
        const apiOrder = await orderService.getOrderById(orderId);
        console.log('✅ Got order from API (but without images)');
        return apiOrder;
      } catch (error) {
        console.log('❌ API call also failed');
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    gcTime: 5 * 60 * 1000,    // Keep in memory for 5 minutes
    enabled: !!orderId, // Only fetch if orderId is provided
    retry: 1, // Reduce retries since we have fallback logic
  });
}