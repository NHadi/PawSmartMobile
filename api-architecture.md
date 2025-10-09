# PawSmart API Architecture

## Overview
This document defines the complete REST API architecture for PawSmart standalone backend that will replace Odoo integration. These APIs will serve **PawSmartMobile** (Customer App), **CMS** (Admin Dashboard), and **Tenant** apps (Grooming, Hotel, and Doctor services).

---

## API Base Structure

```
Base URL: https://api.pawsmart.com/v1
```

### Common Headers
```
Content-Type: application/json
Authorization: Bearer {token}
X-API-Key: {api_key}
```

### Standard Response Format
```json
{
  "success": true,
  "data": {},
  "message": "Success message",
  "errors": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## 1. AUTHENTICATION & AUTHORIZATION APIs

### Used By: Mobile, CMS, Tenant

| Method | Endpoint | Description | Used By |
|--------|----------|-------------|---------|
| POST | `/auth/register` | Register new user account | Mobile |
| POST | `/auth/login` | Login with username/password | Mobile, CMS, Tenant |
| POST | `/auth/logout` | Logout and invalidate token | Mobile, CMS, Tenant |
| POST | `/auth/refresh` | Refresh access token | Mobile, CMS, Tenant |
| POST | `/auth/verify-otp` | Verify OTP for 2FA | Mobile |
| POST | `/auth/resend-otp` | Resend OTP code | Mobile |
| POST | `/auth/forgot-password` | Request password reset | Mobile, CMS, Tenant |
| POST | `/auth/reset-password` | Reset password with token | Mobile, CMS, Tenant |
| POST | `/auth/forgot-username` | Request username recovery | Mobile |
| POST | `/auth/social/google` | Login with Google OAuth | Mobile |
| POST | `/auth/social/facebook` | Login with Facebook OAuth | Mobile |
| POST | `/auth/social/apple` | Login with Apple OAuth | Mobile |
| GET | `/auth/me` | Get current user profile | Mobile, CMS, Tenant |
| PUT | `/auth/change-password` | Change user password | Mobile, CMS, Tenant |

---

## 2. USER MANAGEMENT APIs

### Used By: Mobile, CMS

| Method | Endpoint | Description | Used By |
|--------|----------|-------------|---------|
| GET | `/users/profile` | Get user profile | Mobile, CMS |
| PUT | `/users/profile` | Update user profile | Mobile, CMS |
| PATCH | `/users/profile/avatar` | Update profile photo | Mobile, CMS |
| DELETE | `/users/account` | Delete user account | Mobile |
| GET | `/users/:id` | Get user by ID (Admin) | CMS |
| GET | `/users` | List all users (Admin) | CMS |
| PUT | `/users/:id` | Update user (Admin) | CMS |
| DELETE | `/users/:id` | Delete user (Admin) | CMS |
| PATCH | `/users/:id/status` | Activate/deactivate user | CMS |

---

## 3. PET MANAGEMENT APIs

### Used By: Mobile, CMS

| Method | Endpoint | Description | Used By |
|--------|----------|-------------|---------|
| GET | `/pets` | Get all pets for current user | Mobile, CMS |
| POST | `/pets` | Add new pet | Mobile, CMS |
| GET | `/pets/:id` | Get pet details | Mobile, CMS |
| PUT | `/pets/:id` | Update pet information | Mobile, CMS |
| DELETE | `/pets/:id` | Delete pet | Mobile, CMS |
| PATCH | `/pets/:id/photo` | Update pet photo | Mobile, CMS |
| GET | `/pets/:id/medical-history` | Get pet medical records | Mobile, CMS |
| POST | `/pets/:id/medical-history` | Add medical record | Mobile, CMS, Tenant (Doctor) |
| GET | `/pets/:id/vaccinations` | Get vaccination records | Mobile, CMS |
| POST | `/pets/:id/vaccinations` | Add vaccination record | Mobile, CMS, Tenant (Doctor) |
| PUT | `/pets/:id/vaccinations/:vaccId` | Update vaccination | Mobile, CMS, Tenant (Doctor) |
| DELETE | `/pets/:id/vaccinations/:vaccId` | Delete vaccination | Mobile, CMS |

---

## 4. PRODUCT MANAGEMENT APIs

### Used By: Mobile, CMS

| Method | Endpoint | Description | Used By |
|--------|----------|-------------|---------|
| GET | `/products` | Get all products with filters | Mobile, CMS |
| GET | `/products/:id` | Get product details | Mobile, CMS |
| POST | `/products` | Create new product (Admin) | CMS |
| PUT | `/products/:id` | Update product (Admin) | CMS |
| DELETE | `/products/:id` | Delete product (Admin) | CMS |
| PATCH | `/products/:id/stock` | Update product stock | CMS |
| GET | `/products/categories` | Get product categories | Mobile, CMS |
| POST | `/products/categories` | Create category (Admin) | CMS |
| PUT | `/products/categories/:id` | Update category (Admin) | CMS |
| DELETE | `/products/categories/:id` | Delete category (Admin) | CMS |
| GET | `/products/brands` | Get product brands | Mobile, CMS |
| POST | `/products/brands` | Create brand (Admin) | CMS |
| GET | `/products/search` | Search products | Mobile, CMS |
| GET | `/products/recommended` | Get recommended products | Mobile |
| GET | `/products/best-sellers` | Get best-selling products | Mobile |
| GET | `/products/:id/reviews` | Get product reviews | Mobile, CMS |
| POST | `/products/:id/reviews` | Add product review | Mobile |
| PUT | `/products/:id/reviews/:reviewId` | Update review | Mobile |
| DELETE | `/products/:id/reviews/:reviewId` | Delete review | Mobile, CMS |

---

## 5. CART & CHECKOUT APIs

### Used By: Mobile

| Method | Endpoint | Description | Used By |
|--------|----------|-------------|---------|
| GET | `/cart` | Get user's cart | Mobile |
| POST | `/cart/items` | Add item to cart | Mobile |
| PUT | `/cart/items/:itemId` | Update cart item quantity | Mobile |
| DELETE | `/cart/items/:itemId` | Remove item from cart | Mobile |
| DELETE | `/cart` | Clear entire cart | Mobile |
| POST | `/cart/validate` | Validate cart before checkout | Mobile |
| GET | `/cart/summary` | Get cart summary with totals | Mobile |

---

## 6. ORDER MANAGEMENT APIs

### Used By: Mobile, CMS

| Method | Endpoint | Description | Used By |
|--------|----------|-------------|---------|
| GET | `/orders` | Get user's order history | Mobile, CMS |
| POST | `/orders` | Create new order | Mobile |
| GET | `/orders/:id` | Get order details | Mobile, CMS |
| PUT | `/orders/:id` | Update order (Admin) | CMS |
| DELETE | `/orders/:id` | Cancel order | Mobile, CMS |
| PATCH | `/orders/:id/status` | Update order status | CMS |
| GET | `/orders/:id/tracking` | Get order tracking info | Mobile |
| POST | `/orders/:id/cancel` | Cancel order with reason | Mobile |
| GET | `/orders/history` | Get order history | Mobile |
| GET | `/orders/active` | Get active orders | Mobile |
| POST | `/orders/:id/confirm` | Confirm order completion | Mobile |
| POST | `/orders/:id/return` | Request order return | Mobile |
| GET | `/admin/orders` | Get all orders (Admin) | CMS |
| GET | `/admin/orders/stats` | Get order statistics | CMS |

---

## 7. PAYMENT APIs

### Used By: Mobile, CMS

| Method | Endpoint | Description | Used By |
|--------|----------|-------------|---------|
| GET | `/payments/methods` | Get available payment methods | Mobile |
| POST | `/payments/create` | Create payment intent | Mobile |
| POST | `/payments/confirm` | Confirm payment | Mobile |
| GET | `/payments/:id` | Get payment details | Mobile, CMS |
| GET | `/payments/:id/status` | Check payment status | Mobile |
| POST | `/payments/webhook` | Payment gateway webhook | System |
| POST | `/payments/virtual-account` | Generate virtual account | Mobile |
| POST | `/payments/qr-code` | Generate QR payment code | Mobile |
| POST | `/payments/ewallet` | Process e-wallet payment | Mobile |
| GET | `/payments/history` | Get payment history | Mobile, CMS |
| POST | `/payments/:id/refund` | Process refund | CMS |

---

## 8. ADDRESS MANAGEMENT APIs

### Used By: Mobile, CMS

| Method | Endpoint | Description | Used By |
|--------|----------|-------------|---------|
| GET | `/addresses` | Get user's addresses | Mobile, CMS |
| POST | `/addresses` | Add new address | Mobile, CMS |
| GET | `/addresses/:id` | Get address details | Mobile, CMS |
| PUT | `/addresses/:id` | Update address | Mobile, CMS |
| DELETE | `/addresses/:id` | Delete address | Mobile, CMS |
| PATCH | `/addresses/:id/default` | Set as default address | Mobile |
| GET | `/addresses/provinces` | Get provinces list | Mobile, CMS |
| GET | `/addresses/cities/:provinceId` | Get cities by province | Mobile, CMS |
| GET | `/addresses/districts/:cityId` | Get districts by city | Mobile, CMS |
| GET | `/addresses/subdistricts/:districtId` | Get subdistricts | Mobile, CMS |

---

## 9. LOCATION & DELIVERY APIs

### Used By: Mobile, CMS

| Method | Endpoint | Description | Used By |
|--------|----------|-------------|---------|
| GET | `/locations/nearby` | Get nearby stores/services | Mobile |
| GET | `/locations/poi` | Get points of interest | Mobile |
| POST | `/locations/geocode` | Geocode address | Mobile, CMS |
| POST | `/locations/reverse-geocode` | Reverse geocode coordinates | Mobile, CMS |
| GET | `/delivery/estimate` | Estimate delivery cost | Mobile |
| GET | `/delivery/methods` | Get delivery methods | Mobile |
| POST | `/delivery/schedule` | Schedule delivery | Mobile |
| GET | `/delivery/:trackingId/track` | Track delivery | Mobile |

---

## 10. DOCTOR SERVICES APIs

### Used By: Mobile, Tenant (Doctor)

| Method | Endpoint | Description | Used By |
|--------|----------|-------------|---------|
| GET | `/doctors` | Get list of doctors | Mobile |
| GET | `/doctors/:id` | Get doctor details | Mobile |
| GET | `/doctors/:id/schedule` | Get doctor schedule | Mobile |
| GET | `/doctors/:id/available-slots` | Get available time slots | Mobile |
| POST | `/appointments` | Create appointment | Mobile |
| GET | `/appointments` | Get user appointments | Mobile, Tenant (Doctor) |
| GET | `/appointments/:id` | Get appointment details | Mobile, Tenant (Doctor) |
| PUT | `/appointments/:id` | Update appointment | Mobile, Tenant (Doctor) |
| DELETE | `/appointments/:id` | Cancel appointment | Mobile, Tenant (Doctor) |
| PATCH | `/appointments/:id/status` | Update appointment status | Tenant (Doctor) |
| POST | `/appointments/:id/prescription` | Add prescription | Tenant (Doctor) |
| GET | `/appointments/:id/prescription` | Get prescription | Mobile, Tenant (Doctor) |
| POST | `/appointments/:id/medical-record` | Add medical record | Tenant (Doctor) |
| GET | `/doctors/search` | Search doctors | Mobile |
| GET | `/doctors/recommended` | Get recommended doctors | Mobile |
| POST | `/appointments/:id/reschedule` | Reschedule appointment | Mobile |
| POST | `/appointments/:id/complete` | Mark appointment complete | Tenant (Doctor) |

---

## 11. GROOMING SERVICES APIs

### Used By: Mobile, Tenant (Grooming)

| Method | Endpoint | Description | Used By |
|--------|----------|-------------|---------|
| GET | `/grooming/services` | Get grooming services | Mobile |
| GET | `/grooming/services/:id` | Get service details | Mobile |
| POST | `/grooming/bookings` | Create grooming booking | Mobile |
| GET | `/grooming/bookings` | Get user bookings | Mobile, Tenant (Grooming) |
| GET | `/grooming/bookings/:id` | Get booking details | Mobile, Tenant (Grooming) |
| PUT | `/grooming/bookings/:id` | Update booking | Mobile, Tenant (Grooming) |
| DELETE | `/grooming/bookings/:id` | Cancel booking | Mobile, Tenant (Grooming) |
| PATCH | `/grooming/bookings/:id/status` | Update booking status | Tenant (Grooming) |
| GET | `/grooming/available-slots` | Get available time slots | Mobile |
| GET | `/grooming/packages` | Get grooming packages | Mobile |
| POST | `/grooming/walk-in` | Create walk-in booking | Mobile |
| POST | `/grooming/home-service` | Create home service booking | Mobile |
| GET | `/grooming/stylists` | Get grooming stylists | Mobile |
| GET | `/grooming/stylists/:id/schedule` | Get stylist schedule | Mobile |

---

## 12. HOTEL (PET BOARDING) APIs

### Used By: Mobile, Tenant (Hotel)

| Method | Endpoint | Description | Used By |
|--------|----------|-------------|---------|
| GET | `/hotel/rooms` | Get available rooms | Mobile |
| GET | `/hotel/rooms/:id` | Get room details | Mobile |
| POST | `/hotel/bookings` | Create hotel booking | Mobile |
| GET | `/hotel/bookings` | Get user bookings | Mobile, Tenant (Hotel) |
| GET | `/hotel/bookings/:id` | Get booking details | Mobile, Tenant (Hotel) |
| PUT | `/hotel/bookings/:id` | Update booking | Mobile, Tenant (Hotel) |
| DELETE | `/hotel/bookings/:id` | Cancel booking | Mobile, Tenant (Hotel) |
| PATCH | `/hotel/bookings/:id/status` | Update booking status | Tenant (Hotel) |
| GET | `/hotel/availability` | Check room availability | Mobile |
| POST | `/hotel/bookings/:id/checkin` | Check-in pet | Tenant (Hotel) |
| POST | `/hotel/bookings/:id/checkout` | Check-out pet | Tenant (Hotel) |
| GET | `/hotel/packages` | Get hotel packages | Mobile |
| POST | `/hotel/bookings/:id/activities` | Add pet activity log | Tenant (Hotel) |
| GET | `/hotel/bookings/:id/activities` | Get pet activity logs | Mobile, Tenant (Hotel) |

---

## 13. PROMO & VOUCHER APIs

### Used By: Mobile, CMS

| Method | Endpoint | Description | Used By |
|--------|----------|-------------|---------|
| GET | `/promos` | Get active promotions | Mobile |
| GET | `/promos/:id` | Get promotion details | Mobile |
| GET | `/vouchers` | Get user vouchers | Mobile |
| POST | `/vouchers/claim` | Claim voucher | Mobile |
| POST | `/vouchers/apply` | Apply voucher to order | Mobile |
| GET | `/vouchers/:code/validate` | Validate voucher code | Mobile |
| GET | `/vouchers/available` | Get available vouchers | Mobile |
| POST | `/promos` | Create promotion (Admin) | CMS |
| PUT | `/promos/:id` | Update promotion (Admin) | CMS |
| DELETE | `/promos/:id` | Delete promotion (Admin) | CMS |
| GET | `/admin/vouchers` | Get all vouchers (Admin) | CMS |
| POST | `/admin/vouchers` | Create voucher (Admin) | CMS |
| GET | `/admin/vouchers/stats` | Get voucher statistics | CMS |

---

## 14. NOTIFICATION APIs

### Used By: Mobile, CMS

| Method | Endpoint | Description | Used By |
|--------|----------|-------------|---------|
| GET | `/notifications` | Get user notifications | Mobile |
| GET | `/notifications/:id` | Get notification details | Mobile |
| PATCH | `/notifications/:id/read` | Mark notification as read | Mobile |
| PATCH | `/notifications/read-all` | Mark all as read | Mobile |
| DELETE | `/notifications/:id` | Delete notification | Mobile |
| POST | `/notifications/register-device` | Register device for push | Mobile |
| DELETE | `/notifications/unregister-device` | Unregister device | Mobile |
| POST | `/admin/notifications/send` | Send notification (Admin) | CMS |
| POST | `/admin/notifications/broadcast` | Broadcast notification | CMS |
| GET | `/notifications/settings` | Get notification preferences | Mobile |
| PUT | `/notifications/settings` | Update notification settings | Mobile |

---

## 15. ACTIVITY & FEED APIs

### Used By: Mobile

| Method | Endpoint | Description | Used By |
|--------|----------|-------------|---------|
| GET | `/activities` | Get user activity feed | Mobile |
| GET | `/activities/:id` | Get activity details | Mobile |
| GET | `/activities/timeline` | Get timeline view | Mobile |
| GET | `/activities/summary` | Get activity summary | Mobile |

---

## 16. LOYALTY & POINTS APIs

### Used By: Mobile, CMS

| Method | Endpoint | Description | Used By |
|--------|----------|-------------|---------|
| GET | `/loyalty/points` | Get user points balance | Mobile |
| GET | `/loyalty/history` | Get points history | Mobile |
| POST | `/loyalty/redeem` | Redeem points | Mobile |
| GET | `/loyalty/rewards` | Get available rewards | Mobile |
| GET | `/loyalty/tiers` | Get loyalty tier info | Mobile |
| POST | `/admin/loyalty/award` | Award points (Admin) | CMS |
| POST | `/admin/loyalty/adjust` | Adjust points (Admin) | CMS |

---

## 17. REVIEW & RATING APIs

### Used By: Mobile, CMS, Tenant

| Method | Endpoint | Description | Used By |
|--------|----------|-------------|---------|
| GET | `/reviews/products/:productId` | Get product reviews | Mobile, CMS |
| POST | `/reviews/products/:productId` | Add product review | Mobile |
| GET | `/reviews/services/:serviceId` | Get service reviews | Mobile, Tenant |
| POST | `/reviews/services/:serviceId` | Add service review | Mobile |
| GET | `/reviews/doctors/:doctorId` | Get doctor reviews | Mobile, Tenant (Doctor) |
| POST | `/reviews/doctors/:doctorId` | Add doctor review | Mobile |
| PUT | `/reviews/:id` | Update review | Mobile |
| DELETE | `/reviews/:id` | Delete review | Mobile, CMS |
| POST | `/reviews/:id/report` | Report inappropriate review | Mobile |
| GET | `/reviews/my-reviews` | Get user's reviews | Mobile |

---

## 18. SEARCH & FILTER APIs

### Used By: Mobile, CMS

| Method | Endpoint | Description | Used By |
|--------|----------|-------------|---------|
| GET | `/search` | Global search | Mobile, CMS |
| GET | `/search/products` | Search products | Mobile, CMS |
| GET | `/search/services` | Search services | Mobile |
| GET | `/search/doctors` | Search doctors | Mobile |
| GET | `/search/suggestions` | Get search suggestions | Mobile |
| GET | `/search/history` | Get search history | Mobile |
| DELETE | `/search/history` | Clear search history | Mobile |

---

## 19. FAQ & SUPPORT APIs

### Used By: Mobile, CMS

| Method | Endpoint | Description | Used By |
|--------|----------|-------------|---------|
| GET | `/faq` | Get FAQ list | Mobile |
| GET | `/faq/categories` | Get FAQ categories | Mobile |
| GET | `/faq/:id` | Get FAQ details | Mobile |
| POST | `/support/tickets` | Create support ticket | Mobile |
| GET | `/support/tickets` | Get user tickets | Mobile, CMS |
| GET | `/support/tickets/:id` | Get ticket details | Mobile, CMS |
| POST | `/support/tickets/:id/messages` | Add ticket message | Mobile, CMS |
| PATCH | `/support/tickets/:id/close` | Close ticket | Mobile, CMS |
| POST | `/admin/faq` | Create FAQ (Admin) | CMS |
| PUT | `/admin/faq/:id` | Update FAQ (Admin) | CMS |
| DELETE | `/admin/faq/:id` | Delete FAQ (Admin) | CMS |

---

## 20. SETTINGS & CONFIGURATION APIs

### Used By: Mobile, CMS

| Method | Endpoint | Description | Used By |
|--------|----------|-------------|---------|
| GET | `/settings/app` | Get app configuration | Mobile |
| GET | `/settings/terms` | Get terms & conditions | Mobile |
| GET | `/settings/privacy` | Get privacy policy | Mobile |
| GET | `/settings/about` | Get about information | Mobile |
| PUT | `/admin/settings` | Update settings (Admin) | CMS |
| GET | `/admin/settings` | Get admin settings | CMS |
| PUT | `/admin/settings/terms` | Update T&C (Admin) | CMS |
| PUT | `/admin/settings/privacy` | Update privacy policy (Admin) | CMS |

---

## 21. ADMIN DASHBOARD APIs

### Used By: CMS

| Method | Endpoint | Description | Used By |
|--------|----------|-------------|---------|
| GET | `/admin/dashboard/stats` | Get dashboard statistics | CMS |
| GET | `/admin/dashboard/sales` | Get sales analytics | CMS |
| GET | `/admin/dashboard/revenue` | Get revenue reports | CMS |
| GET | `/admin/dashboard/users` | Get user analytics | CMS |
| GET | `/admin/dashboard/orders` | Get order analytics | CMS |
| GET | `/admin/dashboard/products` | Get product analytics | CMS |
| GET | `/admin/dashboard/services` | Get service analytics | CMS |
| GET | `/admin/dashboard/top-products` | Get top-selling products | CMS |
| GET | `/admin/dashboard/recent-orders` | Get recent orders | CMS |

---

## 22. TENANT MANAGEMENT APIs

### Used By: CMS, Tenant

| Method | Endpoint | Description | Used By |
|--------|----------|-------------|---------|
| GET | `/tenants` | Get all tenants | CMS |
| POST | `/tenants` | Create new tenant | CMS |
| GET | `/tenants/:id` | Get tenant details | CMS, Tenant |
| PUT | `/tenants/:id` | Update tenant | CMS, Tenant |
| DELETE | `/tenants/:id` | Delete tenant | CMS |
| PATCH | `/tenants/:id/status` | Activate/deactivate tenant | CMS |
| GET | `/tenants/:id/services` | Get tenant services | CMS, Tenant |
| POST | `/tenants/:id/services` | Add tenant service | CMS, Tenant |
| GET | `/tenants/:id/bookings` | Get tenant bookings | Tenant |
| GET | `/tenants/:id/revenue` | Get tenant revenue | Tenant |
| GET | `/tenants/:id/stats` | Get tenant statistics | Tenant |

---

## 23. REPORT & ANALYTICS APIs

### Used By: CMS

| Method | Endpoint | Description | Used By |
|--------|----------|-------------|---------|
| GET | `/reports/sales` | Get sales report | CMS |
| GET | `/reports/revenue` | Get revenue report | CMS |
| GET | `/reports/orders` | Get orders report | CMS |
| GET | `/reports/products` | Get products report | CMS |
| GET | `/reports/customers` | Get customers report | CMS |
| GET | `/reports/services` | Get services report | CMS |
| POST | `/reports/export` | Export report | CMS |
| GET | `/reports/custom` | Get custom report | CMS |

---

## 24. MEDIA & FILE MANAGEMENT APIs

### Used By: Mobile, CMS, Tenant

| Method | Endpoint | Description | Used By |
|--------|----------|-------------|---------|
| POST | `/media/upload` | Upload file | Mobile, CMS, Tenant |
| POST | `/media/upload-multiple` | Upload multiple files | Mobile, CMS, Tenant |
| DELETE | `/media/:id` | Delete file | Mobile, CMS, Tenant |
| GET | `/media/:id` | Get file details | Mobile, CMS, Tenant |
| GET | `/media/signed-url` | Get signed URL for upload | Mobile, CMS, Tenant |

---

## 25. WHATSAPP INTEGRATION APIs

### Used By: Mobile, CMS

| Method | Endpoint | Description | Used By |
|--------|----------|-------------|---------|
| POST | `/whatsapp/send-otp` | Send OTP via WhatsApp | Mobile |
| POST | `/whatsapp/send-notification` | Send notification | CMS |
| POST | `/whatsapp/send-order-update` | Send order update | CMS |
| GET | `/whatsapp/verify-business` | Verify business number | CMS |

---

## API CATEGORIZATION BY APPLICATION

### Mobile App APIs (PawSmartMobile)
- Authentication & Authorization (All)
- User Management
- Pet Management
- Product Management (Read)
- Cart & Checkout
- Orders (Create, Read)
- Payments
- Addresses
- Location & Delivery
- Doctor Services (Booking)
- Grooming Services (Booking)
- Hotel Services (Booking)
- Promos & Vouchers
- Notifications
- Activities
- Loyalty & Points
- Reviews & Ratings
- Search
- FAQ & Support
- Settings (Read)
- Media Upload

### CMS Admin APIs
- Authentication & Authorization
- User Management (Full CRUD)
- Pet Management (Full CRUD)
- Product Management (Full CRUD)
- Order Management (Full)
- Payment Management
- Promo & Voucher Management (Full CRUD)
- Notification Management
- Loyalty & Points Management
- FAQ Management (Full CRUD)
- Settings (Full CRUD)
- Admin Dashboard
- Tenant Management
- Reports & Analytics
- Media Management

### Tenant APIs (Grooming, Hotel, Doctor)
- Authentication & Authorization
- Appointments Management (Doctor)
- Grooming Bookings Management
- Hotel Bookings Management
- Service Management
- Schedule Management
- Customer Management (Limited)
- Reviews (Read)
- Media Upload
- Tenant Statistics

---

## NOTES

1. **Authentication**: All endpoints (except login/register) require JWT Bearer token
2. **Pagination**: List endpoints support `?page=1&limit=20` query parameters
3. **Filtering**: List endpoints support filtering via query params
4. **Sorting**: Use `?sort=field&order=asc|desc`
5. **Search**: Use `?search=keyword` for text search
6. **Role-Based Access**: CMS and Tenant endpoints have role-based restrictions
7. **Rate Limiting**: API calls are rate-limited per user/IP
8. **File Upload**: Max file size 10MB for images, 50MB for documents
9. **Webhooks**: Payment and notification webhooks for async operations
10. **API Versioning**: Version included in base URL (`/v1/`)

---

## ERROR CODES

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Validation Error |
| 429 | Too Many Requests |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

---

**Last Updated**: 2025-10-08
**Version**: 1.0
**Maintained By**: PawSmart Development Team
