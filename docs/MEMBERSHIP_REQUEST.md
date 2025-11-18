# Membership Request Feature

## Overview

This feature allows logged-in users with 100% complete profiles to submit membership requests for the CSE DIU Alumni platform.

## Profile Requirements (100% Complete)

Users must have all of the following fields filled in their profile:
- Name (First Name + Last Name)
- Photo (Profile Picture)
- Email
- Phone Number
- Batch
- Date of Birth
- Company
- Designation
- Passing Year
- Education Level

## Membership Status Workflow

1. **Draft** (Default) - Initial status when request is submitted
2. **Information Verified** - After admin reviews and verifies user information
3. **Payment Required** (Optional) - If payment is needed for membership
4. **Approved** - Final approval status
5. **Rejected** - Can be rejected from any stage except Approved

## Email Notifications

Users receive friendly email notifications at each status transition:
- Draft confirmation
- Information verified notification
- Payment required with secure payment link
- Approval welcome email
- Rejection notification with reason

## Payment Integration

- **Payment Gateway**: SSLCommerz (configured for extensibility)
- **Sandbox Support**: Yes (configurable via environment variables)
- **Payment URL**: Auto-generated when status changes to "Payment Required"
- **Payment Verification**: Secure verification endpoint available

## API Endpoints

All endpoints require JWT authentication:

- `POST /api/membership-request` - Submit new membership request
- `GET /api/membership-request/my-request` - Get user's own request
- `GET /api/membership-request` - Get all requests (with optional status filter)
- `GET /api/membership-request/:id` - Get specific request by ID
- `PATCH /api/membership-request/:id/status` - Update status (admin only)
- `POST /api/membership-request/:id/payment/verify` - Verify payment

## Configuration

Add these environment variables to `.env`:

```env
# Payment Gateway Configuration
PAYMENT_GATEWAY=sslcommerz
SSLCOMMERZ_STORE_ID=your-store-id
SSLCOMMERZ_STORE_PASSWORD=your-store-password
SSLCOMMERZ_SANDBOX=true

# API URL (for payment callbacks)
API_URL=http://localhost:3000
```

## Best Practices Implemented

1. **Security**: JWT authentication on all endpoints
2. **Validation**: Profile completion check before submission
3. **Audit Trail**: Status history maintained for all changes
4. **Extensibility**: Payment gateway abstraction for easy integration of new providers
5. **User Experience**: Friendly email notifications with clear next steps
6. **Testing**: Comprehensive unit tests (15 tests covering all scenarios)
7. **Error Handling**: Clear error messages for common issues

## Testing

Run tests with:
```bash
npm test -- membership-request.service.spec.ts
```

All 15 tests are passing and cover:
- Profile validation
- Status transitions
- Payment integration
- Error scenarios
- Email notifications
