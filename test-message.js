const { PrismaClient } = require('./lib/generated/prisma')

const prisma = new PrismaClient()

async function addTestMessage() {
  try {
    // First, let's find the conversation between John Doe and Priya Sharma
    console.log('Looking for existing conversation...')
    
    // Find John Doe (creator)
    const johnDoe = await prisma.user.findFirst({
      where: {
        name: 'John Doe',
        role: 'CREATOR'
      }
    })
    
    // Find Priya Sharma (consumer/fan)
    const priyaSharma = await prisma.user.findFirst({
      where: {
        name: 'Priya Sharma',
        role: 'CONSUMER'
      }
    })
    
    if (!johnDoe || !priyaSharma) {
      console.log('Users not found:')
      console.log('John Doe:', johnDoe ? 'Found' : 'Not found')
      console.log('Priya Sharma:', priyaSharma ? 'Found' : 'Not found')
      return
    }
    
    console.log('Found users:')
    console.log('John Doe ID:', johnDoe.id)
    console.log('Priya Sharma ID:', priyaSharma.id)
    
    // Find or create a conversation between them
    let conversation = await prisma.conversation.findFirst({
      where: {
        creatorId: johnDoe.id,
        fanId: priyaSharma.id
      }
    })
    
    if (!conversation) {
      console.log('Creating new conversation...')
      conversation = await prisma.conversation.create({
        data: {
          creatorId: johnDoe.id,
          fanId: priyaSharma.id
        }
      })
    }
    
    console.log('Conversation ID:', conversation.id)
    
    // Add a new message from Priya Sharma (fan)
    const testMessage = await prisma.message.create({
      data: {
        content: `Another question about the course`,
        conversationId: conversation.id,
        senderId: priyaSharma.id
      }
    })
    
    console.log('✅ Test message created successfully!')
    console.log('Message ID:', testMessage.id)
    console.log('Content:', testMessage.content)
    console.log('Sent by:', priyaSharma.name, '(Fan)')
    console.log('To:', johnDoe.name, '(Creator)')
    console.log('Time:', testMessage.createdAt)
    
    // Update conversation's last message info
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: testMessage.createdAt
      }
    })
    
    console.log('✅ Conversation updated with unread count!')
    console.log('\n🚀 Now go to your dashboard and select the Priya Sharma conversation.')
    console.log('📡 The new message should appear within 5 seconds due to polling!')
    
  } catch (error) {
    console.error('❌ Error creating test message:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addTestMessage() 