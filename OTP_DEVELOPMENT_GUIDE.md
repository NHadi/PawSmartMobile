# OTP Development Guide

## Current Status
The OTP system now works with **real WhatsApp service (Fonnte)** for production and local fallback for development.

## How It Works

### 1. OTP Generation
- **Real WhatsApp Service**: Uses Fonnte API to send OTP to user's WhatsApp
- **Local Storage**: OTP stored in AsyncStorage with 5-minute expiry
- **Fallback Available**: Works even if WhatsApp service fails
- **Security**: OTP not displayed to user (sent via WhatsApp)

### 2. OTP Verification
- **Local Verification**: Verifies OTP against stored value
- **Automatic Registration**: Completes user registration after successful verification
- **Token Storage**: Stores auth tokens after successful registration

## WhatsApp Integration (Fonnte)

### Service Details:
- **Provider**: Fonnte (Indonesian WhatsApp service)
- **API**: `https://api.fonnte.com/send`
- **Message Format**: Professional PawSmart branded messages
- **Expiry**: 5 minutes (WhatsApp standard)

### Message Template:
```
*PawSmart - Kode OTP*

Kode OTP Anda: *1234*

Kode ini berlaku selama 5 menit.
Jangan bagikan kode ini kepada siapapun.

_Abaikan pesan ini jika Anda tidak melakukan registrasi._
```

## Development Experience

### For Testing:
1. Enter phone number in registration
2. OTP is sent to your WhatsApp number
3. Check WhatsApp for the 4-digit code
4. Enter it in the OTP verification screen
5. Registration completes successfully

### Console Logging:
The system provides detailed logging:
- WhatsApp service status
- OTP generation details
- Verification process
- Registration completion

### Sample Console Output:
```
🔄 Generating OTP for 08123456789 using WhatsApp service
💾 OTP stored locally: 1234
📱 Sending OTP via WhatsApp to 08123456789
✅ OTP sent successfully via WhatsApp to 08123456789
📱 Check WhatsApp for OTP: 1234
```

### Debugging:
If WhatsApp fails, the system still works:
```
⚠️ WhatsApp service failed, but OTP is still available locally
💡 OTP (development fallback): 1234
```

## Configuration

### Required Environment Variables:
```bash
EXPO_PUBLIC_FONNTE_TOKEN=your_fonnte_token_here
EXPO_PUBLIC_WHATSAPP_provider=fonnte
```

### Fonnte Setup:
1. Register at [fonnte.com](https://fonnte.com/)
2. Connect your WhatsApp number (scan QR code)
3. Get your API token from dashboard
4. Add token to environment variables

## Production Features

### Security:
- ✅ Real OTP sent via WhatsApp
- ✅ No OTP displayed in app (secure)
- ✅ 5-minute expiry
- ✅ Professional branded messages

### Reliability:
- ✅ Fallback available if WhatsApp fails
- ✅ Local verification works offline
- ✅ Error handling and logging
- ✅ Indonesian number formatting

### User Experience:
- ✅ Familiar WhatsApp experience
- ✅ Clear instructions
- ✅ Auto-focus on OTP input
- ✅ Resend functionality

## API Endpoints Needed

### Generate OTP
```
POST /auth/generate-otp
{
  "phone": "08123456789"
}

Response:
{
  "success": true,
  "otp": "123456"
}
```

### Verify OTP
```
POST /auth/verify-otp
{
  "phone": "08123456789",
  "otp": "123456",
  "registration_data": {
    "username": "johndoe",
    "password": "password123",
    "email": "john@example.com",
    "name": "John Doe",
    "phone": "08123456789"
  }
}

Response:
{
  "success": true,
  "data": {
    "access_token": "jwt_token_here",
    "refresh_token": "refresh_token_here",
    "user": { ... }
  }
}
```

## Testing Checklist

- [x] OTP generation works with fallback
- [x] OTP verification works with fallback
- [x] Registration completes after OTP verification
- [x] User is automatically logged in
- [x] Tokens are stored correctly
- [x] Navigation to home screen works
- [x] Console logging provides debugging info
- [x] Development alerts show OTP codes