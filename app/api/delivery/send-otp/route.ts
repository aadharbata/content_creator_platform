import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { generateOTP, isValidPhoneNumber, formatPhoneNumber } from "@/lib/content-delivery"

export async function POST(request: NextRequest) {
  try {
    const { phone, purpose } = await request.json()

    if (!phone || !purpose) {
      return NextResponse.json(
        { error: "Phone number and purpose are required" },
        { status: 400 }
      )
    }

    // Validate phone number
    if (!isValidPhoneNumber(phone)) {
      return NextResponse.json(
        { error: "Invalid phone number format" },
        { status: 400 }
      )
    }

    const formattedPhone = formatPhoneNumber(phone)
    
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
      return NextResponse.json(
        { error: "Please wait before requesting another OTP" },
        { status: 429 }
      )
    }

    // Generate OTP
    const otp = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60000) // 10 minutes

    // Save OTP to database
    await prisma.oTPVerification.create({
      data: {
        phone: formattedPhone,
        otp,
        purpose,
        expiresAt
      }
    })

    // In production, integrate with WhatsApp Business API or SMS gateway
    // For now, we'll just log the OTP (in development)
    console.log(`OTP for ${formattedPhone}: ${otp}`)

    // TODO: Integrate with actual WhatsApp/SMS service
    // Example: await sendWhatsAppOTP(formattedPhone, otp)

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
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