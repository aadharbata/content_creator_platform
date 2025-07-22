import twilio from 'twilio';

// Twilio configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

let client: twilio.Twilio | null = null;

// Initialize Twilio client
if (accountSid && authToken) {
  client = twilio(accountSid, authToken);
}

export interface SMSResult {
  success: boolean;
  message: string;
  messageId?: string;
  error?: string;
}

export async function sendOTPSMS(phone: string, otp: string): Promise<SMSResult> {
  try {
    // Check if Twilio is configured
    if (!client || !twilioPhoneNumber) {
      console.warn('Twilio not configured. OTP would be sent to:', phone, 'OTP:', otp);
      return {
        success: false,
        message: 'SMS service not configured. Please configure Twilio credentials.',
        error: 'SMS_SERVICE_NOT_CONFIGURED'
      };
    }

    // Format phone number for Twilio (ensure it starts with +)
    const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
    
    // Create SMS message
    const message = `Your OTP verification code is: ${otp}. This code will expire in 10 minutes. Do not share this code with anyone.`;

    console.log(`Sending SMS to ${formattedPhone}...`);

    // Send SMS via Twilio
    const twilioMessage = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: formattedPhone
    });

    console.log(`SMS sent successfully. SID: ${twilioMessage.sid}`);

    return {
      success: true,
      message: 'SMS sent successfully',
      messageId: twilioMessage.sid
    };

  } catch (error: any) {
    console.error('SMS sending error:', error);
    
    // Handle specific Twilio errors
    let errorMessage = 'Failed to send SMS';
    
    if (error.code === 21211) {
      errorMessage = 'Invalid phone number format';
    } else if (error.code === 21614) {
      errorMessage = 'Phone number is not a valid mobile number';
    } else if (error.code === 21408) {
      errorMessage = 'Permission denied to send SMS to this number';
    } else if (error.code === 20003) {
      errorMessage = 'Authentication failed. Please check Twilio credentials';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      message: errorMessage,
      error: error.code || 'SMS_SEND_ERROR'
    };
  }
}

// Alternative SMS service for countries where Twilio might not work well
export async function sendOTPSMSAlternative(phone: string, otp: string): Promise<SMSResult> {
  try {
    // For development/testing - log to console
    console.log('='.repeat(50));
    console.log('📱 SMS WOULD BE SENT TO:', phone);
    console.log('🔐 OTP CODE:', otp);
    console.log('💬 MESSAGE: Your OTP verification code is:', otp);
    console.log('='.repeat(50));
    
    // In production, this could integrate with:
    // - Firebase SMS
    // - AWS SNS
    // - Other regional SMS providers
    // - WhatsApp Business API
    
    return {
      success: true,
      message: 'SMS sent successfully (development mode)',
      messageId: `dev_${Date.now()}`
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to send SMS',
      error: error.message || 'SMS_SEND_ERROR'
    };
  }
} 