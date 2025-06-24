# Payment System Implementation

This document describes the payment system implementation for the content creator platform using Razorpay.

## Overview

The payment system allows users to purchase courses from creators, with automatic commission calculation and payout to creators.

## Features

- **Payment Creation**: Create Razorpay orders for course purchases
- **Payment Confirmation**: Verify payments and process payouts
- **Commission System**: Automatic 20% commission calculation
- **Creator Payouts**: Direct bank transfers to creators
- **Multi-currency Support**: INR, USD, EUR support

## Database Schema

### Creator Model
```prisma
model Creator {
  id            String   @id @default(uuid())
  name          String
  email         String   @unique
  bankAccount   String
  ifsc          String
  upi           String?
  createdAt     DateTime @default(now())
  payments      Payment[]
}
```

### Payment Model (Updated)
```prisma
model Payment {
  id               String        @id @default(uuid())
  amount           Float
  currency         String        @default("INR")
  status           PaymentStatus
  paymentvia       String
  paymentId        String
  razorpayOrderId  String?
  creatorId        String?
  originalAmount   Float?
  originalCurrency String?
  convertedAmount  Float?
  createdAt        DateTime      @default(now())
  subscription     Subscription  @relation(fields: [subscriptionId], references: [id])
  subscriptionId   String
  user             User          @relation(fields: [userId], references: [id])
  userId           String
  creator          Creator?      @relation(fields: [creatorId], references: [id])
}
```

## API Endpoints

### 1. Create Payment Order
**POST** `/api/payment/create`

Creates a Razorpay order and stores payment record.

**Request Body:**
```json
{
  "amount": 1000,
  "currency": "INR",
  "creatorId": "creator-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "order": {
    "id": "order_xyz",
    "amount": 100000,
    "currency": "INR",
    "receipt": "rcpt_1234567890"
  },
  "message": "Order created successfully"
}
```

### 2. Confirm Payment
**POST** `/api/payment/confirm`

Verifies payment and initiates payout to creator.

**Request Body:**
```json
{
  "paymentId": "pay_xyz",
  "creatorId": "creator-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "payout": { /* Razorpay payout response */ },
  "message": "Payment confirmed and payout initiated",
  "details": {
    "originalAmount": 1000,
    "commission": 200,
    "payoutAmount": 800,
    "creatorName": "John Doe"
  }
}
```

### 3. Manage Creators
**GET** `/api/creators` - Fetch all creators
**POST** `/api/creators` - Create a new creator

## Frontend Components

### Payment Page
- **Route**: `/payment`
- **Component**: `app/payment/page.tsx`
- **Features**: Complete payment flow with form validation

### Payment Form Component
- **Location**: `components/PaymentForm.tsx`
- **Features**: 
  - Multi-step payment process
  - Currency selection
  - Real-time validation
  - Success/error handling

### Test Creator Page
- **Route**: `/test-creator`
- **Component**: `app/test-creator/page.tsx`
- **Purpose**: Create test creators for development

## Environment Variables

Add these to your `.env.local` file:

```env
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_SECRET=your_razorpay_secret_key
RAZORPAY_PAYOUT_ACCOUNT=your_payout_account_number
```

## Installation & Setup

1. **Install Dependencies:**
   ```bash
   npm install razorpay axios
   ```

2. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

3. **Run Database Migrations:**
   ```bash
   npx prisma db push
   ```

4. **Set Environment Variables:**
   - Add Razorpay credentials to `.env.local`

## Usage Flow

1. **Create a Creator:**
   - Visit `/test-creator`
   - Fill in creator details
   - Note the creator ID

2. **Make a Payment:**
   - Visit `/payment`
   - Enter course price and creator ID
   - Select currency
   - Create payment order
   - Enter Razorpay payment ID (for testing)
   - Confirm payment

3. **Payment Processing:**
   - System verifies payment with Razorpay
   - Calculates 20% commission
   - Initiates payout to creator's bank account
   - Updates payment status

## Commission Structure

- **Platform Commission**: 20% of payment amount
- **Creator Payout**: 80% of payment amount
- **Payout Method**: Direct bank transfer via IMPS

## Error Handling

The system includes comprehensive error handling for:
- Invalid creator IDs
- Payment verification failures
- Razorpay API errors
- Database operation failures

## Security Considerations

- All API endpoints validate required fields
- Payment verification through Razorpay
- Secure environment variable usage
- Input sanitization and validation

## Testing

1. Use the test creator page to create creators
2. Use test Razorpay credentials for development
3. Monitor payment status in database
4. Check payout status in Razorpay dashboard

## Future Enhancements

- Webhook integration for real-time payment updates
- Multiple payout methods (UPI, wallet)
- Subscription-based payments
- Refund handling
- Payment analytics and reporting 