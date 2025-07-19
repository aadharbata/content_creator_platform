import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { generateOTP, isValidPhoneNumber, formatPhoneNumber } from '@/lib/content-delivery';
import { sendOTPSMS, sendOTPSMSAlternative } from '@/lib/sms';

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, countryCode, password, role, signupMethod } = await request.json();
    console.log("Signup data: ", { name, email, phone, countryCode, password, role, signupMethod });

    // Validate required fields
    if (!name || !password || !role) {
      return NextResponse.json(
        { message: "Name, password, and role are required." },
        { status: 400 }
      );
    }

    // Validate signup method
    if (!signupMethod || (signupMethod !== 'email' && signupMethod !== 'phone')) {
      return NextResponse.json(
        { message: "Valid signup method (email or phone) is required." },
        { status: 400 }
      );
    }

    // Allow both CONSUMER and CREATOR roles
    if (role !== 'CONSUMER' && role !== 'CREATOR') {
      return NextResponse.json(
        { message: "Invalid role. Must be CONSUMER or CREATOR." },
        { status: 400 }
      );
    }

    let userData: any = {
      name: name,
      passwordHash: await bcrypt.hash(password, 10),
      role: role,
    };

    if (signupMethod === 'email') {
      if (!email) {
        return NextResponse.json(
          { message: "Email is required for email signup." },
          { status: 400 }
        );
      }

      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: email },
      });

      if (existingUser) {
        return NextResponse.json(
          { message: "Email already exists." },
          { status: 400 }
        );
      }

      userData.email = email;
    } else if (signupMethod === 'phone') {
      if (!phone || !countryCode) {
        return NextResponse.json(
          { message: "Phone number and country code are required for phone signup." },
          { status: 400 }
        );
      }

      // Validate phone number
      if (!isValidPhoneNumber(phone)) {
        return NextResponse.json(
          { message: "Invalid phone number format." },
          { status: 400 }
        );
      }

      const formattedPhone = formatPhoneNumber(phone);
      console.log("Formatted phone:", formattedPhone);

      // Check if phone number already exists
      const existingUser = await prisma.user.findUnique({
        where: { phone: formattedPhone },
      });

      if (existingUser) {
        // If user exists but phone is not verified, allow them to get a new OTP
        if (!existingUser.phoneVerified) {
          console.log("User exists but phone not verified, sending new OTP");
          
          // Generate and send OTP
          const otp = generateOTP();
          const expiresAt = new Date(Date.now() + 10 * 60000); // 10 minutes
          
          console.log("Generated OTP:", otp);
          console.log("OTP expires at:", expiresAt);
          console.log("Saving OTP for phone:", formattedPhone);

          // Save OTP to database
          try {
            const otpRecord = await prisma.oTPVerification.create({
              data: {
                phone: formattedPhone,
                otp,
                purpose: 'PHONE_VERIFICATION',
                expiresAt
              }
            });
            console.log("OTP saved to database:", otpRecord.id);
          } catch (otpError) {
            console.error("Error saving OTP to database:", otpError);
            return NextResponse.json(
              { message: "Error generating OTP. Please try again." },
              { status: 500 }
            );
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

          return NextResponse.json(
            { 
              message: "User exists but phone not verified. Please verify your phone number.",
              requiresOTP: true,
              phone: formattedPhone,
              user: {
                id: existingUser.id,
                name: existingUser.name,
                phone: existingUser.phone,
                role: existingUser.role
              },
              smsStatus: smsResult.success ? 'sent' : 'failed',
              // In development, return OTP for testing
              ...(process.env.NODE_ENV === 'development' && { otp })
            },
            { status: 200 }
          );
        } else {
          // User exists and phone is verified
          return NextResponse.json(
            { message: "Phone number already registered and verified. Please login." },
            { status: 400 }
          );
        }
      }

      // Generate unique temporary email with timestamp
      const timestamp = Date.now();
      const tempEmail = `${formattedPhone.replace('+', '')}_${timestamp}@temp.com`;
      
      userData.phone = formattedPhone;
      userData.email = tempEmail;
      userData.phoneVerified = false; // Will be verified via OTP
    }

    // Create user
    const user = await prisma.user.create({
      data: userData,
    });

    console.log("User created:", user.id);

    // Automatically create CreatorProfile if user is a CREATOR
    if (user.role === 'CREATOR') {
      const creatorProfile = await prisma.creatorProfile.create({
        data: {
          userId: user.id,
          isPaid: false,
        },
      });
      console.log("CreatorProfile Created: ", creatorProfile.id);
    }

    // If phone signup, generate and send OTP
    if (signupMethod === 'phone') {
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60000); // 10 minutes
      
      console.log("Generated OTP:", otp);
      console.log("OTP expires at:", expiresAt);
      console.log("Saving OTP for phone:", userData.phone);

      // Save OTP to database
      try {
        const otpRecord = await prisma.oTPVerification.create({
          data: {
            phone: userData.phone,
            otp,
            purpose: 'PHONE_VERIFICATION',
            expiresAt
          }
        });
        console.log("OTP saved to database:", otpRecord.id);
      } catch (otpError) {
        console.error("Error saving OTP to database:", otpError);
        return NextResponse.json(
          { message: "Error generating OTP. Please try again." },
          { status: 500 }
        );
      }

      // Send OTP via SMS
      const smsResult = await sendOTPSMS(userData.phone, otp);
      
      if (!smsResult.success) {
        // If SMS fails, try alternative method (console logging for development)
        console.log(`SMS sending failed: ${smsResult.message}`);
        const altResult = await sendOTPSMSAlternative(userData.phone, otp);
        console.log(`Using alternative SMS method: ${altResult.message}`);
      } else {
        console.log(`SMS sent successfully to ${userData.phone}: ${smsResult.message}`);
      }

      return NextResponse.json(
        { 
          message: "User registered successfully. Please verify your phone number.",
          requiresOTP: true,
          phone: userData.phone,
          user: {
            id: user.id,
            name: user.name,
            phone: user.phone,
            role: user.role
          },
          smsStatus: smsResult.success ? 'sent' : 'failed',
          // In development, return OTP for testing
          ...(process.env.NODE_ENV === 'development' && { otp })
        },
        { status: 201 }
      );
    }

    // For email signup, return success
    return NextResponse.json(
      { 
        message: "User registered successfully.",
        requiresOTP: false,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { message: "Server error." },
      { status: 500 }
    );
  }
} 