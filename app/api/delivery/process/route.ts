import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { 
  isHighlyShareable, 
  canBeDeliveredExternally, 
  DELIVERY_TEMPLATES 
} from "@/lib/content-delivery"

interface DeliveryRequest {
  courseId: string
  userId: string
  deliveryMethod: 'WHATSAPP' | 'EMAIL' | 'APP_ONLY'
  contact?: string // phone or email
  userPassword?: string // for email users
}

export async function POST(request: NextRequest) {
  try {
    const { 
      courseId, 
      userId, 
      deliveryMethod, 
      contact, 
      userPassword 
    }: DeliveryRequest = await request.json()

    if (!courseId || !userId || !deliveryMethod) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Get course with content
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        contents: true,
        author: {
          select: { name: true }
        }
      }
    })

    if (!course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      )
    }

    // Create course access record
    const courseAccess = await prisma.courseAccess.create({
      data: {
        userId,
        courseId,
        deliveryMethod,
        deliveryStatus: deliveryMethod === 'APP_ONLY' ? 'DELIVERED' : 'PENDING'
      }
    })

    // Handle different delivery methods
    if (deliveryMethod === 'APP_ONLY') {
      return NextResponse.json({
        success: true,
        message: "Course access granted",
        accessId: courseAccess.id
      })
    }

    if (!contact) {
      return NextResponse.json(
        { error: "Contact information required for external delivery" },
        { status: 400 }
      )
    }

    // Filter deliverable content
    const deliverableContent = course.contents.filter(content => 
      canBeDeliveredExternally(content.type)
    )

    if (deliverableContent.length === 0) {
      return NextResponse.json({
        success: true,
        message: "All content is app-only. Access granted in MyCourses section.",
        accessId: courseAccess.id
      })
    }

    // Process delivery based on method
    if (deliveryMethod === 'WHATSAPP') {
      await processWhatsAppDelivery(course, deliverableContent, contact)
    } else if (deliveryMethod === 'EMAIL') {
      await processEmailDelivery(course, deliverableContent, contact, userPassword)
    }

    // Create delivery records
    await Promise.all(
      deliverableContent.map(content =>
        prisma.contentDelivery.create({
          data: {
            courseId,
            userId,
            contentType: content.type,
            deliveryMethod,
            recipientContact: contact,
            status: 'SENT'
          }
        })
      )
    )

    // Update course access status
    await prisma.courseAccess.update({
      where: { id: courseAccess.id },
      data: { deliveryStatus: 'SENT' }
    })

    return NextResponse.json({
      success: true,
      message: `Content delivery initiated via ${deliveryMethod}`,
      accessId: courseAccess.id,
      deliveredItems: deliverableContent.length,
      appOnlyItems: course.contents.filter(c => isHighlyShareable(c.type)).length
    })

  } catch (error) {
    console.error("Error processing delivery:", error)
    return NextResponse.json(
      { error: "Failed to process delivery" },
      { status: 500 }
    )
  }
}

async function processWhatsAppDelivery(course: any, content: any[], phone: string) {
  // Generate download links (in production, these would be secure temporary URLs)
  const downloadLinks = content.map(item => ({
    title: item.title,
    description: item.description || 'Course content',
    downloadLink: `${process.env.NEXT_PUBLIC_APP_URL}/download/${item.id}?token=temp`
  }))

  // Prepare WhatsApp message
  const message = [
    DELIVERY_TEMPLATES.whatsapp.welcome(course.title),
    '',
    ...downloadLinks.map(link => 
      DELIVERY_TEMPLATES.whatsapp.contentItem(link.title, link.description, link.downloadLink)
    ),
    DELIVERY_TEMPLATES.whatsapp.footer('+91-XXXXXXXXXX') // Replace with actual support number
  ].join('\n')

  // TODO: Integrate with WhatsApp Business API
  console.log(`WhatsApp delivery to ${phone}:`, message)
  
  // Example integration:
  // await whatsappAPI.sendMessage(phone, message)
}

async function processEmailDelivery(course: any, content: any[], email: string, password?: string) {
  // Create user account if password provided
  if (password) {
    const bcrypt = await import('bcryptjs')
    const hashedPassword = await bcrypt.hash(password, 10)
    
    await prisma.user.upsert({
      where: { email },
      update: { passwordHash: hashedPassword },
      create: {
        email,
        name: email.split('@')[0],
        passwordHash: hashedPassword,
        role: 'CONSUMER'
      }
    })
  }

  // Generate download links
  const downloadLinks = content.map(item => ({
    title: item.title,
    description: item.description || 'Course content',
    downloadLink: `${process.env.NEXT_PUBLIC_APP_URL}/download/${item.id}?token=temp`
  }))

  // Prepare email content
  const emailContent = [
    DELIVERY_TEMPLATES.email.welcome(course.title, email.split('@')[0]),
    '',
    DELIVERY_TEMPLATES.email.contentList,
    ...downloadLinks.map(link => `• ${link.title}: ${link.downloadLink}`),
    DELIVERY_TEMPLATES.email.footer('support@example.com')
  ].join('\n')

  // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
  console.log(`Email delivery to ${email}:`, emailContent)
  
  // Example integration:
  // await emailService.send({
  //   to: email,
  //   subject: DELIVERY_TEMPLATES.email.subject(course.title),
  //   text: emailContent
  // })
} 