// @ts-nocheck
// This script seeds additional purchased products for development/testing
// Run with: npx tsx scripts/seed-products.ts --email you@example.com
import prisma from '@/lib/prisma'
import pkg from '@prisma/client'
const { ProductType, ProductStatus, PaymentStatus } = pkg

function getArg(name: string) {
  const idx = process.argv.findIndex(a => a === `--${name}`)
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1]
  const pref = `--${name}=`
  const found = process.argv.find(a => a.startsWith(pref))
  return found ? found.slice(pref.length) : undefined
}

async function main() {
  const emailArg = getArg('email')
  const user = emailArg
    ? await prisma.user.findUnique({ where: { email: emailArg } })
    : await prisma.user.findFirst({})
  if (!user) throw new Error('No user found for seeding')

  // Count current purchases for this user
  const purchases = await prisma.productSale.count({
    where: { buyerId: user.id, status: PaymentStatus.SUCCEEDED }
  })

  const need = Math.max(0, 5 - purchases)
  if (need === 0) {
    console.log(`Already have enough purchased products for ${user.email}`)
    return
  }

  const types = [
    ProductType.COURSE,
    ProductType.SOFTWARE,
    ProductType.EBOOK,
    ProductType.IMAGE,
    ProductType.VIDEO,
  ]

  for (let i = 0; i < need; i++) {
    const creator = await prisma.user.create({
      data: {
        name: `Demo Creator ${Date.now()}-${i}`,
        email: `demo.creator.${Date.now()}-${i}@example.com`,
        role: 'CREATOR',
        profile: { create: { avatarUrl: 'https://i.pravatar.cc/150?img=' + ((i+3)%70) } }
      }
    })

    const product = await prisma.product.create({
      data: {
        title: `Sample Product ${Date.now()}-${i}`,
        description: 'Seeded product for demo purposes.',
        price: 29.99 + i,
        type: types[i % types.length],
        thumbnail: 'https://images.unsplash.com/photo-1509223197845-458d87318791?w=1200',
        status: ProductStatus.PUBLISHED,
        creatorId: creator.id
      }
    })

    await prisma.productSale.create({
      data: {
        buyerId: user.id,
        productId: product.id,
        amount: product.price,
        status: PaymentStatus.SUCCEEDED
      }
    })
  }

  console.log(`Seeded ${need} products for user ${user.email}`)
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => process.exit(0)) 