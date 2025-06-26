'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Add Razorpay script to window
declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PaymentForm() {
  const [amount, setAmount] = useState('');
  const [creatorId, setCreatorId] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [step, setStep] = useState<'form' | 'payment' | 'success'>('form');

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleCreateOrder = async () => {
    if (!amount || !creatorId) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post('/api/payment/create', {
        amount: Number(amount),
        currency,
        creatorId,
      });

      setOrderId(data.order.id);
      
      // Initialize Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_YOUR_KEY', // Replace with your test key
        amount: data.order.amount,
        currency: data.order.currency,
        name: 'Content Creator Platform',
        description: 'Course Purchase',
        order_id: data.order.id,
        handler: function (response: any) {
          // Payment successful
          handlePaymentSuccess(response);
        },
        prefill: {
          name: 'Test User',
          email: 'test@example.com',
          contact: '9999999999'
        },
        notes: {
          address: 'Content Creator Platform'
        },
        theme: {
          color: '#3399cc'
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to create order. Please try again.');
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (response: any) => {
    setLoading(true);
    try {
      // Confirm payment with backend
      const { data } = await axios.post('/api/payment/confirm', {
        paymentId: response.razorpay_payment_id,
        creatorId,
      });

      setStep('success');
      alert('Payment Successful! Payout has been initiated to the creator.');
    } catch (error) {
      console.error('Error confirming payment:', error);
      alert('Payment received but confirmation failed. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAmount('');
    setCreatorId('');
    setCurrency('INR');
    setOrderId('');
    setStep('form');
  };

  if (step === 'success') {
    return (
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-green-600">Payment Successful! 🎉</CardTitle>
          <CardDescription>
            Your payment has been processed and the creator will receive their payout.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button onClick={resetForm} className="mt-4">
            Make Another Payment
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Payment Details</CardTitle>
        <CardDescription>
          Enter the course details and creator information to proceed with payment.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Course Price
          </label>
          <Input
            type="number"
            placeholder="Enter course price"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full"
            min="0"
            step="0.01"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Creator ID
          </label>
          <Input
            type="text"
            placeholder="Enter creator ID"
            value={creatorId}
            onChange={(e) => setCreatorId(e.target.value)}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Currency
          </label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger>
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INR">INR (Indian Rupee)</SelectItem>
              <SelectItem value="USD">USD (US Dollar)</SelectItem>
              <SelectItem value="EUR">EUR (Euro)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={handleCreateOrder} 
          disabled={loading || !amount || !creatorId}
          className="w-full"
        >
          {loading ? 'Processing...' : 'Pay Now'}
        </Button>

        {orderId && (
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-700">
              Order ID: <Badge variant="outline">{orderId}</Badge>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 