const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTrialStatus() {
  try {
    console.log('🔍 Checking trial subscriptions...');
    
    const trials = await prisma.trialSubscription.findMany({
      include: {
        creator: {
          include: {
            profile: true
          }
        }
      }
    });

    const now = new Date();
    
    trials.forEach(trial => {
      const timeRemaining = trial.expiresAt.getTime() - now.getTime();
      const timeExpired = timeRemaining <= 0;
      const dbExpired = trial.isExpired;
      const isCancelled = dbExpired && !timeExpired;
      const isNaturallyExpired = timeExpired;
      
      console.log(`\n📋 Trial ${trial.id} for creator ${trial.creator.name}:`);
      console.log(`   Started: ${trial.startedAt}`);
      console.log(`   Expires: ${trial.expiresAt}`);
      console.log(`   Time expired: ${timeExpired}`);
      console.log(`   DB expired: ${dbExpired}`);
      console.log(`   Is cancelled: ${isCancelled}`);
      console.log(`   Is naturally expired: ${isNaturallyExpired}`);
      console.log(`   Days remaining: ${timeRemaining / (1000 * 60 * 60 * 24)}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTrialStatus(); 