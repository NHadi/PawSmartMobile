# Flip Payment Webhook Integration Guide

## Overview

When a customer pays via QRIS, Flip automatically sends a callback to your backend webhook URL to notify you of the payment status.

## Production Flow

```
1. Customer scans QRIS code
2. Customer completes payment in their banking app
3. Flip receives payment confirmation
4. Flip sends POST request to YOUR_WEBHOOK_URL
5. Your backend receives callback
6. Your backend verifies token
7. Your backend updates order status in database (Odoo)
8. Mobile app polls payment status
9. Mobile app detects status change → Shows success screen
```

## Webhook Configuration

### In Flip Dashboard
Configure your webhook URL in Flip for Business dashboard:
- **Webhook URL**: `https://your-backend.com/api/flip/webhook`
- **Validation Token**: Use `EXPO_PUBLIC_FLIP_VALIDATION_KEY` from environment

### Callback Request Format

Flip will send POST request with `Content-Type: application/x-www-form-urlencoded`

**Parameters:**
- `data`: JSON string with transaction details
- `token`: Validation token (must match your `FLIP.VALIDATION_KEY`)

**Example Request:**
```bash
curl -X POST 'https://your-backend.com/api/flip/webhook' \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'data={"id":"PGPWF22595173324048856","bill_link_id":130110,"bill_link":"flip.id/$company/#product","bill_title":"Order Payment","reference_id":"ORDER_123","sender_name":"John Doe","sender_email":"customer@email.com","sender_bank":"qris","sender_bank_type":"wallet_account","amount":50000,"status":"SUCCESSFUL","created_at":"2024-01-15 10:30:45"}&token=YOUR_VALIDATION_TOKEN'
```

### Callback Data Structure

**Successful Payment:**
```json
{
  "id": "PGPWF22595173324048856",
  "bill_link_id": 130110,
  "bill_link": "flip.id/pwf-sandbox/$company/#product",
  "bill_title": "Order Payment",
  "reference_id": "ORDER_123",
  "sender_name": "John Doe",
  "sender_email": "customer@email.com",
  "sender_bank": "qris",
  "sender_bank_type": "wallet_account",
  "amount": 50000,
  "status": "SUCCESSFUL",
  "created_at": "2024-01-15 10:30:45"
}
```

**Cancelled/Expired Payment:**
```json
{
  "id": "PGPWF22595173324048856",
  "bill_link_id": 130110,
  "bill_link": "flip.id/pwf-sandbox/$company/#product",
  "bill_title": "Order Payment",
  "reference_id": "ORDER_123",
  "sender_name": "John Doe",
  "sender_email": "customer@email.com",
  "sender_bank": "qris",
  "sender_bank_type": "wallet_account",
  "amount": 50000,
  "status": "CANCELLED",
  "created_at": "2024-01-15 10:30:45"
}
```

**Status Values:**
- `SUCCESSFUL`: Payment completed successfully
- `CANCELLED`: Payment expired or cancelled

## Backend Implementation

### Node.js/Express Example

```javascript
const express = require('express');
const router = express.Router();

router.post('/api/flip/webhook', async (req, res) => {
  try {
    // 1. Parse callback data
    const { data, token } = req.body;
    const callbackData = JSON.parse(data);

    // 2. Verify token
    const validationToken = process.env.FLIP_VALIDATION_KEY;
    if (token !== validationToken) {
      console.error('Invalid webhook token');
      return res.status(401).json({ error: 'Invalid token' });
    }

    // 3. Log callback for debugging
    console.log('Flip webhook received:', callbackData);

    // 4. Update order status based on payment status
    const orderId = callbackData.reference_id; // This is the order ID we passed during payment creation

    if (callbackData.status === 'SUCCESSFUL') {
      // Update order status in your database (e.g., Odoo)
      await updateOrderStatus(orderId, 'payment_confirmed', {
        payment_id: callbackData.id,
        bill_link_id: callbackData.bill_link_id,
        amount: callbackData.amount,
        sender_name: callbackData.sender_name,
        sender_email: callbackData.sender_email,
        payment_method: callbackData.sender_bank,
        paid_at: callbackData.created_at,
      });

      console.log(`Order ${orderId} marked as paid`);
    } else if (callbackData.status === 'CANCELLED') {
      // Update order status to cancelled/expired
      await updateOrderStatus(orderId, 'payment_expired');
      console.log(`Order ${orderId} marked as expired`);
    }

    // 5. Respond with 200 OK immediately (within 30 seconds)
    // Flip will retry up to 5 times if no response or non-200 status
    res.status(200).json({ success: true });

    // 6. Optionally: Send notification to customer
    // await sendPaymentConfirmationEmail(callbackData);

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function updateOrderStatus(orderId, status, paymentDetails = null) {
  // Update in your database (Odoo, MongoDB, PostgreSQL, etc.)
  // Example with Odoo:
  const odoo = require('./odooService');
  await odoo.updateOrder(orderId, {
    state: status,
    payment_details: paymentDetails,
  });
}

module.exports = router;
```

### Python/Django Example

```python
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
import json
import os

@csrf_exempt
@require_POST
def flip_webhook(request):
    try:
        # 1. Parse callback data
        data = request.POST.get('data')
        token = request.POST.get('token')
        callback_data = json.loads(data)

        # 2. Verify token
        validation_token = os.getenv('FLIP_VALIDATION_KEY')
        if token != validation_token:
            return JsonResponse({'error': 'Invalid token'}, status=401)

        # 3. Log callback
        print(f'Flip webhook received: {callback_data}')

        # 4. Update order status
        order_id = callback_data['reference_id']

        if callback_data['status'] == 'SUCCESSFUL':
            update_order_status(order_id, 'payment_confirmed', {
                'payment_id': callback_data['id'],
                'bill_link_id': callback_data['bill_link_id'],
                'amount': callback_data['amount'],
                'sender_name': callback_data['sender_name'],
                'paid_at': callback_data['created_at'],
            })
        elif callback_data['status'] == 'CANCELLED':
            update_order_status(order_id, 'payment_expired')

        # 5. Respond with 200 OK
        return JsonResponse({'success': True})

    except Exception as e:
        print(f'Webhook error: {e}')
        return JsonResponse({'error': str(e)}, status=500)
```

## Testing Without Backend

For development/testing before backend webhook is ready:

### Option 1: Use "Open Payment Page" Button
1. Create QRIS payment in app
2. Click "Test Payment" → "Open Payment Page"
3. Complete payment in Flip's staging payment page
4. Flip will update bill status in their system
5. App's polling mechanism will detect status change via `GET /big_api/v3/bill/{link_id}`

### Option 2: Manual Status Check
1. Create QRIS payment
2. Pay via actual QRIS scan (if testing with real device)
3. App polls every 5 seconds and detects payment

### Option 3: Simulate Callback (Development Only)
The "Simulate Success" button shows what data Flip would send to your webhook, but doesn't actually update Flip's system. This is for understanding the webhook format.

## Webhook Retry Logic

If your webhook doesn't respond or returns non-200 status:
- **Retry Count**: 5 times
- **Retry Interval**: 2 minutes between retries
- **Timeout**: 30 seconds per request

**Best Practice:** Respond with 200 OK immediately, then process callback data asynchronously.

## Security Best Practices

1. **Always verify the token** - Don't process callbacks with invalid tokens
2. **Validate amount matches** - Check callback amount matches expected order amount
3. **Idempotency** - Handle duplicate callbacks (Flip may retry)
4. **Use HTTPS only** - Never use HTTP for webhook URLs
5. **Log all callbacks** - Keep audit trail for debugging
6. **Validate reference_id** - Ensure order exists before updating

## Production Checklist

- [ ] Backend webhook endpoint implemented
- [ ] Webhook URL configured in Flip dashboard
- [ ] Token validation implemented
- [ ] Order status update logic working
- [ ] Idempotency handling for retries
- [ ] Error logging and monitoring
- [ ] Webhook testing completed
- [ ] HTTPS certificate valid
- [ ] Database transaction handling
- [ ] Customer notification system (optional)

## Mobile App Integration

The mobile app doesn't need to handle webhooks directly. It just:

1. Creates payment via `paymentGatewayService.createPayment()`
2. Displays QR code to user
3. Polls payment status every 5 seconds via `paymentGatewayService.getPaymentStatus()`
4. When backend updates order (triggered by webhook), polling detects the change
5. Shows success screen to user

**Key Point:** Mobile app relies on backend to process webhook and update order status. App just polls to detect those updates.

## Support

- Flip API Docs: https://docs.flip.id/docs/accept-payment/direct-api/qris-integration
- Webhook Guide: See section 4 "Handling Accept Payment Callback"
- Dashboard: https://flip.id/business/dashboard
