# Flip QRIS Migration Summary

## Overview
Successfully migrated QRIS payment gateway from Xendit to Flip API as per https://docs.flip.id/docs/accept-payment/direct-api/qris-integration

## Environment Configuration
All environment variables are already configured in `src/config/environment.ts`:
- ✅ `EXPO_PUBLIC_FLIP_SECRET_KEY` - Already set
- ✅ `EXPO_PUBLIC_FLIP_VALIDATION_KEY` - Already set
- ✅ `FLIP.BASE_URL` - Set to `https://fm-dev-box.flip.id/` (sandbox)
- ✅ `FLIP.WEBHOOK_URL` - Configured

## Changes Made

### 1. Flip Payment Gateway Service (`src/services/payment/flipPaymentGateway.ts`)
**New Features:**
- ✅ Added `FlipQRISRequest` and `FlipQRISResponse` interfaces
- ✅ Implemented `createQRISPayment()` method
- ✅ Implemented `getQRISStatus()` method
- ✅ Updated BASE_URL to use fm-dev-box endpoint for QRIS support

**API Endpoints (Staging Mode):**
- Base URL: `https://fm-dev-box.flip.id/`
- Create QRIS: `POST big_api/v3/pwf/bill` (PWF - Payment With Flip)
- Get Status: `GET big_api/v3/bill/{bill_id}`

**Request Parameters (JSON):**
```typescript
{
  title: string,              // Payment description (required)
  type: 'single',             // Bill type: 'single' or 'multiple' (required, lowercase)
  step: 'direct_api',         // Integration type (required for Direct API)
  amount: number,             // Payment amount, min Rp1,000 (required)
  sender_name: string,        // Customer name (required)
  sender_email: string,       // Customer email (required)
  sender_bank: 'qris',        // Payment method, use 'qris' for QRIS (required)
  sender_bank_type: 'wallet_account', // Payment type (required for QRIS)
  reference_id?: string,      // Merchant reference ID (optional)
  expired_date: string,       // Format: YYYY-MM-DD HH:mm:ss (optional)
}
```

**Response Structure:**
```typescript
// Raw Flip Response (from /v2/pwf/bill)
{
  link_id: number,
  link_url: string,
  title: string,
  type: string,
  amount: number,
  expired_date: string,
  status: 'ACTIVE' | 'INACTIVE',
  step: number,
  sender_name: string,
  sender_email: string,
  sender_phone_number: string,
  created_from: string,
  payment_id?: number,
  qr_string?: string,  // QRIS QR code string
  qris_string?: string // Alternative field name
}

// Transformed to our format
{
  qr_id: string,
  qr_string: string,
  amount: number,
  order_id: string,
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED',
  created_at: string,
  expires_at: string,
  paid_at?: string
}
```

### 2. Payment Gateway Service (`src/services/payment/paymentGatewayService.ts`)
**Updates:**
- ✅ Changed QRIS routing from Xendit to Flip
- ✅ Added `createFlipPayment()` QRIS handling
- ✅ Added `mapFlipStatus()` helper method
- ✅ Updated `getPaymentStatus()` to handle Flip QRIS payment IDs
- ✅ E-wallet payments still route to Xendit (unchanged)

**Provider Routing Logic:**
```typescript
QRIS → Flip (NEW)
EWALLET → Xendit (unchanged)
VIRTUAL_ACCOUNT → Flip (unchanged)
```

### 3. QRIS Payment Screen (`src/screens/payment/QRISPaymentScreen.tsx`)
**Updates:**
- ✅ Updated payment status checking to support both Flip and Xendit
- ✅ Added support for Flip response format (`qr_id`, `qrString`)
- ✅ Changed default provider from 'XENDIT' to 'FLIP'
- ✅ QR code display supports both formats

### 4. Payment Gateway Config (`src/services/payment/paymentGatewayConfig.ts`)
**Updates:**
- ✅ Added Flip QRIS fee structure (0.7% percentage, 0 fixed)
- ✅ Maintained backward compatibility with existing config

## API Authentication
Using Basic Auth with SECRET_KEY as username:
```typescript
auth: {
  username: FLIP_CONFIG.SECRET_KEY,
  password: ''
}
```

## Testing Checklist

### Before Testing
- [ ] Verify Flip sandbox credentials are active
- [ ] Ensure fm-dev-box endpoint is accessible
- [ ] Check webhook URL configuration

### Test Scenarios
1. **Create QRIS Payment**
   - [ ] Navigate to checkout
   - [ ] Select QRIS payment method
   - [ ] Verify QR code is displayed
   - [ ] Check payment amount and expiry time

2. **Payment Status Polling**
   - [ ] Verify status checks every 5 seconds
   - [ ] Simulate payment in Flip dashboard
   - [ ] Confirm status updates to PAID

3. **Payment Expiry**
   - [ ] Wait for 30-minute expiry
   - [ ] Verify status updates to EXPIRED
   - [ ] Check user notification

4. **Error Handling**
   - [ ] Test with invalid amount
   - [ ] Test with network failure
   - [ ] Verify error messages display correctly

### Integration Tests
- [ ] Test QRIS payment creation
- [ ] Test payment status retrieval
- [ ] Test webhook callback handling (if implemented)
- [ ] Verify order status updates in Odoo

## Migration Checklist
- ✅ Update Flip payment gateway with QRIS support
- ✅ Update payment routing to use Flip for QRIS
- ✅ Update UI to handle Flip QRIS response format
- ✅ Add fee configuration for Flip QRIS
- ✅ Document changes and testing procedures
- ⏳ Test payment flow end-to-end
- ⏳ Verify webhook integration (if required)
- ⏳ Production deployment preparation

## Rollback Plan
If issues occur with Flip QRIS:

1. Revert routing in `paymentGatewayService.ts`:
```typescript
if (request.paymentMethod === 'QRIS') {
  provider = 'XENDIT'; // Rollback to Xendit
}
```

2. Update QRISPaymentScreen default:
```typescript
const provider = paymentData.provider || 'XENDIT'; // Rollback default
```

## Important Notes

### API Endpoint Discovery
The correct Flip QRIS endpoint was found through investigation:
- **Incorrect**: `/v1/qris` (returns 404 Not Found)
- **Incorrect**: `/v2/pwf/bill` (returns 404 Not Found)
- **Incorrect**: `/big_sandbox_api/v3/pwf/bill` (returns 404 Not Found)
- **Correct (Staging)**: `big_api/v3/pwf/bill` with `type: 'QRIS'`

Flip uses the Payment With Flip (PWF) Bill API v3 for QRIS payments in staging mode. The staging endpoint is `big_api/v3/` (without leading slash). The same endpoint handles multiple payment types based on the `type` parameter.

**Full URL**: `https://fm-dev-box.flip.id/big_api/v3/pwf/bill`

### Technical Details
- Xendit integration remains intact for e-wallet payments
- Flip QRIS uses PWF Bill API with `type: 'QRIS'` parameter
- Expiry: 30 minutes (standard QRIS)
- QR code generation: react-native-qrcode-svg (unchanged)
- Payment status polling: 5 seconds (unchanged)
- Status check: Uses same `/v2/bill/{id}` endpoint as bill payments

## Next Steps
1. Run comprehensive testing in development environment
2. Verify Flip sandbox payment simulation works
3. Test webhook callbacks (if backend implemented)
4. Monitor payment success rates
5. Plan production migration timeline

## Support & Documentation
- Flip API Docs: https://docs.flip.id/docs/accept-payment/direct-api/qris-integration
- Environment Config: `src/config/environment.ts`
- Payment Service: `src/services/payment/flipPaymentGateway.ts`
- Gateway Service: `src/services/payment/paymentGatewayService.ts`
- UI Screen: `src/screens/payment/QRISPaymentScreen.tsx`
