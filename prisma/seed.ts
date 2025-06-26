import prisma from '@/lib/prisma'

async function main() {
  console.log('Starting seed...')

  // Create sample users (creators)
  const creator1 = await prisma.user.create({
    data: {
      email: 'john.doe@example.com',
      name: 'John Doe',
      passwordHash: 'hashed_password_123',
      role: 'CREATOR',
      profile: {
        create: {
          bio: 'Full-stack developer and coding instructor with 5+ years of experience. Passionate about teaching modern web development technologies.',
          avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
          twitter: '@johndoe_dev',
          instagram: '@johndoe_codes',
          youtube: '@JohnDoeCode'
        }
      }
    },
    include: {
      profile: true
    }
  })

  const creator2 = await prisma.user.create({
    data: {
      email: 'sarah.wilson@example.com',
      name: 'Sarah Wilson',
      passwordHash: 'hashed_password_456',
      role: 'CREATOR',
      profile: {
        create: {
          bio: 'UI/UX Designer and digital marketing expert. I help businesses create beautiful and effective online experiences.',
          avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616c96c4aeb?w=400&h=400&fit=crop&crop=face',
          twitter: '@sarahwilson_ux',
          instagram: '@sarah_designs',
          youtube: '@SarahWilsonDesign'
        }
      }
    },
    include: {
      profile: true
    }
  })

  // Create categories
  const webDevCategory = await prisma.category.create({
    data: { name: 'Web Development' }
  })

  const designCategory = await prisma.category.create({
    data: { name: 'Design' }
  })

  const marketingCategory = await prisma.category.create({
    data: { name: 'Digital Marketing' }
  })

  // Create tags
  const reactTag = await prisma.tag.create({
    data: { name: 'React' }
  })

  const nextjsTag = await prisma.tag.create({
    data: { name: 'Next.js' }
  })

  const uiuxTag = await prisma.tag.create({
    data: { name: 'UI/UX' }
  })

  // Create courses for creator1 (John Doe)
  const course1 = await prisma.course.create({
    data: {
      title: 'Complete React & Next.js Development Course',
      description: 'Master modern React and Next.js development from scratch. Build real-world projects and deploy them to production.',
      price: 2999,
      duration: 240, // 4 hours
      authorId: creator1.id,
      salesCount: 156,
      imgURL: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=400&fit=crop',
      rating: 4.8
    }
  })

  const course2 = await prisma.course.create({
    data: {
      title: 'Full-Stack JavaScript Masterclass',
      description: 'Learn to build complete web applications using Node.js, Express, MongoDB, and React.',
      price: 3999,
      duration: 360, // 6 hours
      authorId: creator1.id,
      salesCount: 89,
      imgURL: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800&h=400&fit=crop',
      rating: 4.6
    }
  })

  const course3 = await prisma.course.create({
    data: {
      title: 'TypeScript for Beginners',
      description: 'Get started with TypeScript and learn how to write type-safe JavaScript applications.',
      price: 1999,
      duration: 180, // 3 hours
      authorId: creator1.id,
      salesCount: 234,
      imgURL: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&h=400&fit=crop',
      rating: 4.9
    }
  })

  // Create courses for creator2 (Sarah Wilson)
  const course4 = await prisma.course.create({
    data: {
      title: 'UI/UX Design Fundamentals',
      description: 'Learn the principles of user interface and user experience design. Create stunning designs that users love.',
      price: 2499,
      duration: 300, // 5 hours
      authorId: creator2.id,
      salesCount: 178,
      imgURL: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=400&fit=crop',
      rating: 4.7
    }
  })

  const course5 = await prisma.course.create({
    data: {
      title: 'Digital Marketing Strategy 2024',
      description: 'Master modern digital marketing techniques including SEO, social media, and content marketing.',
      price: 3499,
      duration: 420, // 7 hours
      authorId: creator2.id,
      salesCount: 92,
      imgURL: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop',
      rating: 4.5
    }
  })

  // Create lessons for courses
  await prisma.lesson.createMany({
    data: [
      {
        title: 'Introduction to React',
        description: 'Getting started with React fundamentals',
        order: 1,
        contenturl: 'https://example.com/lesson1',
        courseId: course1.id
      },
      {
        title: 'Components and Props',
        description: 'Understanding React components and props',
        order: 2,
        contenturl: 'https://example.com/lesson2',
        courseId: course1.id
      },
      {
        title: 'State and Hooks',
        description: 'Managing state with React hooks',
        order: 3,
        contenturl: 'https://example.com/lesson3',
        courseId: course1.id
      }
    ]
  })

  // Create some consumers
  const consumer1 = await prisma.user.create({
    data: {
      email: 'alice.student@example.com',
      name: 'Alice Student',
      passwordHash: 'hashed_password_789',
      role: 'CONSUMER'
    }
  })

  const consumer2 = await prisma.user.create({
    data: {
      email: 'bob.learner@example.com',
      name: 'Bob Learner',
      passwordHash: 'hashed_password_101',
      role: 'CONSUMER'
    }
  })

  // Create more consumers
  const consumer3 = await prisma.user.create({
    data: {
      email: 'priya.sharma@example.com',
      name: 'Priya Sharma',
      passwordHash: 'hashed_password_102',
      role: 'CONSUMER'
    }
  })

  const consumer4 = await prisma.user.create({
    data: {
      email: 'amit.kumar@example.com',
      name: 'Amit Kumar',
      passwordHash: 'hashed_password_103',
      role: 'CONSUMER'
    }
  })

  const consumer5 = await prisma.user.create({
    data: {
      email: 'neha.singh@example.com',
      name: 'Neha Singh',
      passwordHash: 'hashed_password_104',
      role: 'CONSUMER'
    }
  })

  const consumer6 = await prisma.user.create({
    data: {
      email: 'raj.patel@example.com',
      name: 'Raj Patel',
      passwordHash: 'hashed_password_105',
      role: 'CONSUMER'
    }
  })

  // Create reviews
  await prisma.review.createMany({
    data: [
      {
        rating: 5,
        comment: 'Excellent course! John explains everything very clearly and the projects are practical.',
        userId: consumer1.id,
        courseId: course1.id
      },
      {
        rating: 4,
        comment: 'Great content, learned a lot about React and Next.js. Highly recommended!',
        userId: consumer2.id,
        courseId: course1.id
      },
      {
        rating: 5,
        comment: 'Perfect for beginners. The step-by-step approach is fantastic.',
        userId: consumer1.id,
        courseId: course3.id
      },
      {
        rating: 4,
        comment: 'Sarah has great design insights. This course improved my design skills significantly.',
        userId: consumer2.id,
        courseId: course4.id
      }
    ]
  })

  // Create content
  const content1 = await prisma.content.create({
    data: {
      title: 'React Cheat Sheet PDF',
      description: 'Comprehensive React cheat sheet with all essential concepts',
      type: 'EBOOK',
      url: 'https://example.com/react-cheat-sheet.pdf',
      status: 'PUBLISHED',
      price: 299,
      language: 'en',
      tags: '["react", "cheatsheet", "reference"]',
      authorId: creator1.id,
      courseId: course1.id,
      categoryId: webDevCategory.id,
      tagId: reactTag.id
    }
  })

  const content2 = await prisma.content.create({
    data: {
      title: 'UI Design Templates Pack',
      description: 'Collection of modern UI design templates for web and mobile',
      type: 'TEMPLATE',
      url: 'https://example.com/ui-templates.zip',
      status: 'PUBLISHED',
      price: 1499,
      language: 'en',
      tags: '["ui", "templates", "design"]',
      authorId: creator2.id,
      categoryId: designCategory.id,
      tagId: uiuxTag.id
    }
  })

  // Create content analytics
  await prisma.contentAnalytics.createMany({
    data: [
      {
        views: 1250,
        likes: 89,
        shares: 23,
        contentId: content1.id
      },
      {
        views: 890,
        likes: 67,
        shares: 15,
        contentId: content2.id
      }
    ]
  })

  // Create subscriptions and payments
  const subscription1 = await prisma.subscription.create({
    data: {
      status: 'ACTIVE',
      startdate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      userId: consumer1.id
    }
  })

  await prisma.payment.create({
    data: {
      amount: 2999,
      currency: 'INR',
      status: 'SUCCEEDED',
      paymentvia: 'razorpay',
      paymentId: 'pay_123456789',
      subscriptionId: subscription1.id,
      userId: consumer1.id
    }
  })

  // Create notifications
  await prisma.notification.createMany({
    data: [
      {
        type: 'PAYMENT',
        message: 'Payment received for React & Next.js Course',
        read: false,
        userId: creator1.id
      },
      {
        type: 'CONTENT',
        message: 'New review received on your course',
        read: false,
        userId: creator1.id
      },
      {
        type: 'SYSTEM',
        message: 'Your course has reached 100+ students!',
        read: true,
        userId: creator1.id
      }
    ]
  })

  // Create conversations and messages with realistic timestamps
  const conversation1 = await prisma.conversation.create({
    data: {
      creatorId: creator1.id,
      fanId: consumer1.id,
      lastMessageAt: new Date('2024-12-21T14:30:00.000Z') // Today 2:30 PM
    }
  })

  const conversation2 = await prisma.conversation.create({
    data: {
      creatorId: creator1.id,
      fanId: consumer3.id,
      lastMessageAt: new Date('2024-12-21T16:45:00.000Z') // Today 4:45 PM
    }
  })

  const conversation3 = await prisma.conversation.create({
    data: {
      creatorId: creator2.id,
      fanId: consumer2.id,
      lastMessageAt: new Date('2024-12-21T17:20:00.000Z') // Today 5:20 PM
    }
  })

  // Create messages for conversation1 (John Doe & Alice Student)
  await prisma.message.createMany({
    data: [
      {
        content: 'Hi John! I just enrolled in your React course and I\'m really excited to start learning!',
        conversationId: conversation1.id,
        senderId: consumer1.id,
        createdAt: new Date('2024-12-21T13:15:00.000Z') // Today 1:15 PM
      },
      {
        content: 'That\'s wonderful, Alice! Welcome to the course. Feel free to ask me anything if you get stuck.',
        conversationId: conversation1.id,
        senderId: creator1.id,
        createdAt: new Date('2024-12-21T13:45:00.000Z') // Today 1:45 PM
      },
      {
        content: 'Thank you so much! I\'m currently on the hooks section. The useState explanation was really clear.',
        conversationId: conversation1.id,
        senderId: consumer1.id,
        createdAt: new Date('2024-12-21T14:30:00.000Z') // Today 2:30 PM
      }
    ]
  })

  // Create messages for conversation2 (John Doe & Priya Sharma)
  await prisma.message.createMany({
    data: [
      {
        content: 'Hello John, I have a question about the deployment section in your Next.js course.',
        conversationId: conversation2.id,
        senderId: consumer3.id,
        createdAt: new Date('2024-12-21T16:10:00.000Z') // Today 4:10 PM
      },
      {
        content: 'Hi Priya! I\'d be happy to help. What specific part of the deployment are you having trouble with?',
        conversationId: conversation2.id,
        senderId: creator1.id,
        createdAt: new Date('2024-12-21T16:25:00.000Z') // Today 4:25 PM
      },
      {
        content: 'I\'m getting an error when trying to deploy to Vercel. The build process fails.',
        conversationId: conversation2.id,
        senderId: consumer3.id,
        createdAt: new Date('2024-12-21T16:45:00.000Z') // Today 4:45 PM
      }
    ]
  })

  // Create messages for conversation3 (Sarah Wilson & Bob Learner)
  await prisma.message.createMany({
    data: [
      {
        content: 'Hi Sarah! Your UI/UX course is amazing. I\'ve learned so much about design principles.',
        conversationId: conversation3.id,
        senderId: consumer2.id,
        createdAt: new Date('2024-12-21T16:50:00.000Z') // Today 4:50 PM
      },
      {
        content: 'Thank you so much, Bob! I\'m thrilled to hear you\'re enjoying the course. Design is such a rewarding field!',
        conversationId: conversation3.id,
        senderId: creator2.id,
        createdAt: new Date('2024-12-21T17:05:00.000Z') // Today 5:05 PM
      },
      {
        content: 'I\'m working on my first design project now. Could you review it when I\'m done?',
        conversationId: conversation3.id,
        senderId: consumer2.id,
        createdAt: new Date('2024-12-21T17:20:00.000Z') // Today 5:20 PM
      }
    ]
  })

  console.log('✅ Seed completed successfully!')
  console.log(`👤 Created ${2} creators`)
  console.log(`👥 Created ${6} consumers`)
  console.log(`📚 Created ${5} courses`)
  console.log(`💬 Created ${4} reviews`)
  console.log(`📄 Created ${2} content items`)
  console.log(`🔔 Created ${3} notifications`)
  console.log(`💬 Created ${3} conversations`)
  console.log(`💬 Created ${9} messages`)
  console.log('')
  console.log('🎯 Sample creator IDs for testing:')
  console.log(`   John Doe: ${creator1.id}`)
  console.log(`   Sarah Wilson: ${creator2.id}`)
  console.log('')
  console.log('🌐 Test URLs:')
  console.log(`   http://localhost:3000/creator/${creator1.id}/dashboard`)
  console.log(`   http://localhost:3000/creator/${creator2.id}/dashboard`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 