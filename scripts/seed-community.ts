import { PrismaClient } from '../lib/generated/prisma';

const prisma = new PrismaClient();

const COMMUNITY_NAME = 'testing comms';
const OWNER_ID = '56533c3c-d6eb-4ce2-976e-39cdfc8e4b26';
const MEMBER_IDS = [
  '91ae3c2e-9350-4d89-9a39-733bcc7badfb',
  'f0dbd7b9-dd24-4a72-b61a-e6b8c83d2481',
];

async function main() {
  console.log('Starting community seeding...');

  try {
    // 1. Create the community
    const community = await prisma.community.create({
      data: {
        name: COMMUNITY_NAME,
        description: 'A community for testing purposes.',
        type: 'SUBSCRIPTION_COMMUNITY', // Default type
        creatorId: OWNER_ID,
      },
    });

    console.log(`Successfully created community: "${community.name}" (ID: ${community.id})`);

    // 2. Add all users (including the owner) as members
    const allMemberIds = [OWNER_ID, ...MEMBER_IDS];
    const memberData = allMemberIds.map(userId => ({
      communityId: community.id,
      userId: userId,
    }));

    const membersCreated = await prisma.communityMember.createMany({
      data: memberData,
      skipDuplicates: true, // Avoid errors if a member already exists
    });

    console.log(`Successfully added ${membersCreated.count} members to the community.`);
    
    // 3. Create the associated conversation for the community
    const conversation = await prisma.communityConversation.create({
        data: {
            communityId: community.id,
        }
    });

    console.log(`Successfully created conversation for community ID: ${community.id}`);


  } catch (error) {
    console.error('An error occurred during seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('Database connection closed.');
  }
}

main(); 