import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { generateOTP, isValidPhoneNumber, formatPhoneNumber } from "@/lib/content-delivery"
import { sendOTPSMS, sendOTPSMSAlternative } from "@/lib/sms"

export async function POST(request: NextRequest) {
  try {
    const { phone, purpose } = await request.json()
    console.log("Send OTP request:", { phone, purpose });

    if (!phone || !purpose) {
      return NextResponse.json(
        { error: "Phone number and purpose are required" },
        { status: 400 }
      )
    }

    // Validate phone number
    if (!isValidPhoneNumber(phone)) {
      console.log("Invalid phone number format:", phone);
      return NextResponse.json(
        { error: "Invalid phone number format" },
        { status: 400 }
      )
    }

    const formattedPhone = formatPhoneNumber(phone)
    console.log("Formatted phone for OTP:", formattedPhone);
    
    // Check if there's a recent OTP request (rate limiting)
    const recentOTP = await prisma.oTPVerification.findFirst({
      where: {
        phone: formattedPhone,
        purpose,
        createdAt: {
          gte: new Date(Date.now() - 60000) // Within last 1 minute
        }
      }
    })

    if (recentOTP) {
      console.log("Recent OTP found, rate limiting:", recentOTP.id);
      return NextResponse.json(
        { error: "Please wait before requesting another OTP" },
        { status: 429 }
      )
    }

    // Generate OTP
    const otp = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60000) // 10 minutes

    console.log("Generated new OTP:", otp);
    console.log("OTP expires at:", expiresAt);

    // Save OTP to database
    try {
      const otpRecord = await prisma.oTPVerification.create({
        data: {
          phone: formattedPhone,
          otp,
          purpose,
          expiresAt
        }
      })
      console.log("OTP saved to database:", otpRecord.id);
    } catch (dbError) {
      console.error("Database error saving OTP:", dbError);
      return NextResponse.json(
        { error: "Failed to save OTP to database" },
        { status: 500 }
      )
    }

    // Send OTP via SMS
    const smsResult = await sendOTPSMS(formattedPhone, otp);
    
    if (!smsResult.success) {
      // If SMS fails, try alternative method (console logging for development)
      console.log(`SMS sending failed: ${smsResult.message}`);
      const altResult = await sendOTPSMSAlternative(formattedPhone, otp);
      console.log(`Using alternative SMS method: ${altResult.message}`);
    } else {
      console.log(`SMS sent successfully to ${formattedPhone}: ${smsResult.message}`);
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
      phone: formattedPhone,
      smsStatus: smsResult.success ? 'sent' : 'failed',
      // In development, return OTP for testing
      ...(process.env.NODE_ENV === 'development' && { otp })
    })

  } catch (error) {
    console.error("Error sending OTP:", error)
    return NextResponse.json(
      { error: "Failed to send OTP" },
      { status: 500 }
    )
  }
} 