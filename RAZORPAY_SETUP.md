# Razorpay Setup Guide

## Environment Variables Setup

Create a `.env.local` file in your project root with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/your_database"

# Razorpay Configuration (Backend)
RAZORPAY_KEY_ID=rzp_test_your_test_key_id
RAZORPAY_SECRET=your_test_secret_key
RAZORPAY_PAYOUT_ACCOUNT=your_payout_account_number

# Public Razorpay Key (Frontend)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_test_key_id

# JWT Secret
JWT_SECRET=your_jwt_secret_key
```

## Getting Razorpay Test Keys

1. **Sign up for Razorpay**: Go to [razorpay.com](https://razorpay.com) and create an account
2. **Access Dashboard**: Login to your Razorpay dashboard
3. **Get Test Keys**: 
   - Go to Settings → API Keys
   - Copy your **Test Key ID** and **Test Secret Key**
   - Replace the placeholder values in `.env.local`

## Test Card Details

For testing payments, you can use these test card details:

### Credit/Debit Cards
- **Card Number**: 4111 1111 1111 1111
- **Expiry**: Any future date (e.g., 12/25)
- **CVV**: Any 3 digits (e.g., 123)
- **Name**: Any name

### UPI
- **UPI ID**: success@razorpay (for successful payment)
- **UPI ID**: failure@razorpay (for failed payment)

### Net Banking
- **Bank**: Any test bank
- **Credentials**: Use any test credentials

## Testing Flow

1. **Start the server**: `npm run dev`
2. **Create a creator**: Visit `http://localhost:3001/test-creator`
3. **Make payment**: Visit `http://localhost:3001/payment`
4. **Enter details**: Course price, creator ID, currency
5. **Click "Pay Now"**: Razorpay checkout will open
6. **Enter test card details**: Use the test cards above
7. **Complete payment**: Payment will be processed

## Important Notes

- **Test Mode**: Use test keys for development
- **Live Mode**: Switch to live keys for production
- **Webhooks**: Set up webhooks for production (optional for testing)
- **Payout Account**: Configure your payout account in Razorpay dashboard

## Security

- Never commit `.env.local` to version control
- Use different keys for test and production
- Keep your secret keys secure
- Use HTTPS in production 