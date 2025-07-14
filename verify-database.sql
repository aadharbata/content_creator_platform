-- 🗄️ Database Verification Script
-- Run this script to quickly check if all functionality is working

-- 1. Check User Management
SELECT 'User Management' as category, COUNT(*) as count FROM "User"
UNION ALL
SELECT 'Creator Profiles', COUNT(*) FROM "CreatorProfile"
UNION ALL
SELECT 'User Profiles', COUNT(*) FROM "UserProfile";

-- 2. Check Content System
SELECT 'Content System' as category, COUNT(*) as count FROM "Post"
UNION ALL
SELECT 'Post Media', COUNT(*) FROM "PostMedia"
UNION ALL
SELECT 'Content', COUNT(*) FROM "Content"
UNION ALL
SELECT 'Courses', COUNT(*) FROM "Course"
UNION ALL
SELECT 'Lessons', COUNT(*) FROM "Lesson";

-- 3. Check Social Features
SELECT 'Social Features' as category, COUNT(*) as count FROM "Like"
UNION ALL
SELECT 'Comments', COUNT(*) FROM "Comment"
UNION ALL
SELECT 'Subscriptions', COUNT(*) FROM "Subscription"
UNION ALL
SELECT 'Tips', COUNT(*) FROM "Tip"
UNION ALL
SELECT 'Reviews', COUNT(*) FROM "Review";

-- 4. Check Communication
SELECT 'Communication' as category, COUNT(*) as count FROM "Conversation"
UNION ALL
SELECT 'Messages', COUNT(*) FROM "Message"
UNION ALL
SELECT 'Communities', COUNT(*) FROM "Community"
UNION ALL
SELECT 'Community Members', COUNT(*) FROM "CommunityMember"
UNION ALL
SELECT 'Community Conversations', COUNT(*) FROM "CommunityConversation"
UNION ALL
SELECT 'Community Messages', COUNT(*) FROM "CommunityMessage";

-- 5. Check Monetization
SELECT 'Monetization' as category, COUNT(*) as count FROM "Payment"
UNION ALL
SELECT 'Course Access', COUNT(*) FROM "CourseAccess";

-- 6. Check Delivery System
SELECT 'Delivery System' as category, COUNT(*) as count FROM "OTPVerification"
UNION ALL
SELECT 'Content Delivery', COUNT(*) FROM "ContentDelivery";

-- 7. Check Analytics
SELECT 'Analytics' as category, COUNT(*) as count FROM "ContentAnalytics"
UNION ALL
SELECT 'Notifications', COUNT(*) FROM "Notification";

-- 8. Check Categories and Tags
SELECT 'Categories & Tags' as category, COUNT(*) as count FROM "Category"
UNION ALL
SELECT 'Tags', COUNT(*) FROM "Tag";

-- 9. Detailed User Analysis
SELECT 'User Analysis' as category, 
       COUNT(CASE WHEN role = 'CREATOR' THEN 1 END) as creators,
       COUNT(CASE WHEN role = 'CONSUMER' THEN 1 END) as consumers,
       COUNT(CASE WHEN role = 'ADMIN' THEN 1 END) as admins
FROM "User";

-- 10. Recent Activity (last 7 days)
SELECT 'Recent Activity' as category, COUNT(*) as count FROM "Post" 
WHERE "createdAt" > NOW() - INTERVAL '7 days'
UNION ALL
SELECT 'Recent Likes', COUNT(*) FROM "Like" 
WHERE "createdAt" > NOW() - INTERVAL '7 days'
UNION ALL
SELECT 'Recent Comments', COUNT(*) FROM "Comment" 
WHERE "createdAt" > NOW() - INTERVAL '7 days'
UNION ALL
SELECT 'Recent Subscriptions', COUNT(*) FROM "Subscription" 
WHERE "createdAt" > NOW() - INTERVAL '7 days';

-- 11. Check for Data Integrity Issues
SELECT 'Data Integrity Check' as category, 
       CASE WHEN COUNT(*) = 0 THEN 'No orphaned posts' ELSE 'Orphaned posts found' END as status
FROM "Post" p 
LEFT JOIN "CreatorProfile" cp ON p."creatorId" = cp.id 
WHERE cp.id IS NULL
UNION ALL
SELECT 'Data Integrity Check', 
       CASE WHEN COUNT(*) = 0 THEN 'No orphaned likes' ELSE 'Orphaned likes found' END
FROM "Like" l 
LEFT JOIN "User" u ON l."userId" = u.id 
WHERE u.id IS NULL
UNION ALL
SELECT 'Data Integrity Check', 
       CASE WHEN COUNT(*) = 0 THEN 'No orphaned comments' ELSE 'Orphaned comments found' END
FROM "Comment" c 
LEFT JOIN "User" u ON c."userId" = u.id 
WHERE u.id IS NULL;

-- 12. Check Authentication Data
SELECT 'Authentication' as category, 
       COUNT(CASE WHEN "passwordHash" IS NOT NULL AND "passwordHash" != '' THEN 1 END) as users_with_passwords,
       COUNT(CASE WHEN "phoneVerified" = true THEN 1 END) as verified_phones
FROM "User";

-- 13. Check Payment Status
SELECT 'Payment Status' as category, 
       COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_payments,
       COUNT(CASE WHEN status = 'SUCCEEDED' THEN 1 END) as successful_payments,
       COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed_payments
FROM "Payment";

-- 14. Check Content Status
SELECT 'Content Status' as category, 
       COUNT(CASE WHEN status = 'DRAFT' THEN 1 END) as draft_content,
       COUNT(CASE WHEN status = 'PUBLISHED' THEN 1 END) as published_content,
       COUNT(CASE WHEN status = 'ARCHIVED' THEN 1 END) as archived_content
FROM "Content";

-- 15. Check Community Activity
SELECT 'Community Activity' as category, 
       COUNT(CASE WHEN type = 'CONTENT_COMMUNITY' THEN 1 END) as content_communities,
       COUNT(CASE WHEN type = 'SUBSCRIPTION_COMMUNITY' THEN 1 END) as subscription_communities
FROM "Community"; 