# 🗄️ Database Verification Guide

## 📋 How to Verify All Functionality is Working

This guide shows you exactly which database entries to check after testing each API route to verify functionality.

---

## 🔍 **Step 1: Open Prisma Studio**

```bash
npx prisma studio
```

This will open a web interface where you can browse all your database tables.

---

## 📊 **Step 2: Check Each Table for Functionality**

### **1. User Management - Check `User` Table**

**What to look for:**
- New users created via signup
- Users with different roles (CREATOR, CONSUMER)

**Expected entries after signup:**
```sql
SELECT id, name, email, role, createdAt FROM "User" ORDER BY createdAt DESC;
```

**✅ Working if you see:**
- Users with `role: 'CREATOR'` and `role: 'CONSUMER'`
- `passwordHash` field is populated (not empty)
- `createdAt` timestamps are recent

---

### **2. Creator Profiles - Check `CreatorProfile` Table**

**What to look for:**
- Creator profiles automatically created for CREATOR users

**Expected entries:**
```sql
SELECT id, userId, isPaid, createdAt FROM "CreatorProfile" ORDER BY createdAt DESC;
```

**✅ Working if you see:**
- Rows with `userId` matching CREATOR users from User table
- `isPaid: false` for new creators

---

### **3. Posts - Check `Post` Table**

**What to look for:**
- Posts created by creators

**Expected entries:**
```sql
SELECT id, title, content, creatorId, isPaidOnly, createdAt FROM "Post" ORDER BY createdAt DESC;
```

**✅ Working if you see:**
- Posts with `creatorId` matching existing creators
- `title` and `content` fields populated
- `isPaidOnly` boolean values

---

### **4. Post Media - Check `PostMedia` Table**

**What to look for:**
- Media attachments for posts

**Expected entries:**
```sql
SELECT id, url, type, postId, LikesCount, createdAt FROM "PostMedia" ORDER BY createdAt DESC;
```

**✅ Working if you see:**
- Rows with `postId` matching posts
- `url` field with file paths
- `LikesCount` that updates when posts are liked

---

### **5. Likes - Check `Like` Table**

**What to look for:**
- User likes on posts

**Expected entries:**
```sql
SELECT userId, postId, createdAt FROM "Like" ORDER BY createdAt DESC;
```

**✅ Working if you see:**
- Rows with `userId` and `postId` combinations
- Rows disappear when posts are unliked
- `createdAt` timestamps for when likes were added

---

### **6. Comments - Check `Comment` Table**

**What to look for:**
- Comments on posts

**Expected entries:**
```sql
SELECT id, content, userId, postId, createdAt FROM "Comment" ORDER BY createdAt DESC;
```

**✅ Working if you see:**
- Rows with `content`, `userId`, and `postId`
- `content` field has actual comment text
- Rows disappear when comments are deleted

---

### **7. Subscriptions - Check `Subscription` Table**

**What to look for:**
- User subscriptions to creators

**Expected entries:**
```sql
SELECT id, userId, creatorId, createdAt FROM "Subscription" ORDER BY createdAt DESC;
```

**✅ Working if you see:**
- Rows with `userId` (consumer) and `creatorId` (creator)
- No duplicate combinations (due to unique constraint)
- `createdAt` timestamps

---

### **8. Payments - Check `Payment` Table**

**What to look for:**
- Payment records

**Expected entries:**
```sql
SELECT id, amount, currency, status, paymentvia, paymentId, userId, subscriptionId, createdAt FROM "Payment" ORDER BY createdAt DESC;
```

**✅ Working if you see:**
- Rows with `amount`, `currency`, `status`
- `paymentId` field populated
- `userId` and `subscriptionId` relationships
- `status` changes from 'PENDING' to 'SUCCEEDED'

---

### **9. Content - Check `Content` Table**

**What to look for:**
- Content uploaded by creators

**Expected entries:**
```sql
SELECT id, title, description, type, url, authorId, price, status, createdAt FROM "Content" ORDER BY createdAt DESC;
```

**✅ Working if you see:**
- Rows with `title`, `description`, `type`
- `authorId` matching creator users
- `url` field with file paths
- `status` field (DRAFT, PUBLISHED, etc.)

---

### **10. Courses - Check `Course` Table**

**What to look for:**
- Courses created by creators

**Expected entries:**
```sql
SELECT id, title, description, price, duration, authorId, salesCount, rating, createdAt FROM "Course" ORDER BY createdAt DESC;
```

**✅ Working if you see:**
- Rows with course details
- `authorId` matching creator users
- `price`, `duration`, `rating` fields populated

---

### **11. Course Access - Check `CourseAccess` Table**

**What to look for:**
- User access to courses

**Expected entries:**
```sql
SELECT id, userId, courseId, deliveryMethod, deliveryStatus, purchaseDate FROM "CourseAccess" ORDER BY purchaseDate DESC;
```

**✅ Working if you see:**
- Rows with `userId` and `courseId` combinations
- `deliveryMethod` and `deliveryStatus` fields
- `purchaseDate` timestamps

---

### **12. Communities - Check `Community` Table**

**What to look for:**
- Communities created

**Expected entries:**
```sql
SELECT id, name, description, type, creatorId, contentId, maxMembers, createdAt FROM "Community" ORDER BY createdAt DESC;
```

**✅ Working if you see:**
- Rows with `name`, `description`, `type`
- `creatorId` matching creator users
- `type` field (CONTENT_COMMUNITY, SUBSCRIPTION_COMMUNITY)

---

### **13. Community Members - Check `CommunityMember` Table**

**What to look for:**
- Users joining communities

**Expected entries:**
```sql
SELECT id, userId, communityId, joinedAt, lastActive, lastReadAt FROM "CommunityMember" ORDER BY joinedAt DESC;
```

**✅ Working if you see:**
- Rows with `userId` and `communityId` combinations
- `joinedAt` timestamps
- No duplicate memberships (due to unique constraint)

---

### **14. Conversations - Check `Conversation` Table**

**What to look for:**
- Direct conversations between users

**Expected entries:**
```sql
SELECT id, creatorId, fanId, lastMessageAt, createdAt FROM "Conversation" ORDER BY lastMessageAt DESC;
```

**✅ Working if you see:**
- Rows with `creatorId` and `fanId` combinations
- `lastMessageAt` timestamps that update
- No duplicate conversations (due to unique constraint)

---

### **15. Messages - Check `Message` Table**

**What to look for:**
- Messages in conversations

**Expected entries:**
```sql
SELECT id, content, conversationId, senderId, isRead, createdAt FROM "Message" ORDER BY createdAt DESC;
```

**✅ Working if you see:**
- Rows with `content`, `conversationId`, `senderId`
- `content` field has actual message text
- `isRead` boolean values

---

### **16. Tips - Check `Tip` Table**

**What to look for:**
- Tips sent to creators

**Expected entries:**
```sql
SELECT id, userId, postId, amount, createdAt FROM "Tip" ORDER BY createdAt DESC;
```

**✅ Working if you see:**
- Rows with `userId`, `postId`, `amount`
- `amount` field with tip values
- `createdAt` timestamps

---

### **17. OTP Verification - Check `OTPVerification` Table**

**What to look for:**
- OTP records for delivery verification

**Expected entries:**
```sql
SELECT id, phone, otp, purpose, verified, attempts, expiresAt, createdAt FROM "OTPVerification" ORDER BY createdAt DESC;
```

**✅ Working if you see:**
- Rows with `phone`, `otp`, `purpose`
- `verified` boolean values
- `attempts` count
- `expiresAt` timestamps

---

### **18. Content Delivery - Check `ContentDelivery` Table**

**What to look for:**
- Content delivery records

**Expected entries:**
```sql
SELECT id, userId, courseId, deliveryMethod, deliveryStatus, contact, createdAt FROM "ContentDelivery" ORDER BY createdAt DESC;
```

**✅ Working if you see:**
- Rows with `userId`, `courseId`, `deliveryMethod`
- `deliveryStatus` field
- `contact` information

---

## 🚨 **Step 3: Quick Verification Checklist**

Run these queries to quickly check if all functionality is working:

```sql
-- 1. Check if users exist
SELECT COUNT(*) as user_count FROM "User";

-- 2. Check if creators have profiles
SELECT COUNT(*) as creator_profiles FROM "CreatorProfile";

-- 3. Check if posts exist
SELECT COUNT(*) as post_count FROM "Post";

-- 4. Check if likes exist
SELECT COUNT(*) as like_count FROM "Like";

-- 5. Check if comments exist
SELECT COUNT(*) as comment_count FROM "Comment";

-- 6. Check if subscriptions exist
SELECT COUNT(*) as subscription_count FROM "Subscription";

-- 7. Check if payments exist
SELECT COUNT(*) as payment_count FROM "Payment";

-- 8. Check if content exists
SELECT COUNT(*) as content_count FROM "Content";

-- 9. Check if courses exist
SELECT COUNT(*) as course_count FROM "Course";

-- 10. Check if communities exist
SELECT COUNT(*) as community_count FROM "Community";
```

**✅ All working if:**
- All counts are > 0 (or at least the ones you've tested)
- No error messages
- Data looks consistent

---

## 🔧 **Step 4: Test Each Functionality**

### **Test Order:**
1. **Signup** → Check `User` and `CreatorProfile` tables
2. **Login** → Verify user exists and can authenticate
3. **Create Post** → Check `Post` table
4. **Like Post** → Check `Like` table
5. **Comment on Post** → Check `Comment` table
6. **Subscribe to Creator** → Check `Subscription` table
7. **Create Payment** → Check `Payment` table
8. **Upload Content** → Check `Content` table
9. **Join Community** → Check `CommunityMember` table
10. **Send Message** → Check `Message` table

---

## ❌ **Step 5: Troubleshooting**

### **If a table is empty:**
1. Check the corresponding API route for errors
2. Verify the route is using correct authentication
3. Check server logs for error messages
4. Ensure database connection is working

### **If data looks wrong:**
1. Check foreign key relationships
2. Verify user IDs match between tables
3. Check if timestamps are reasonable
4. Look for duplicate or missing entries

### **Common Issues:**
- **Authentication errors** → Check NEXTAUTH_SECRET
- **Foreign key errors** → Check if referenced users exist
- **Unique constraint violations** → Check for duplicate entries
- **Missing data** → Check if API routes are actually called

---

## 📈 **Step 6: Success Indicators**

**Your system is fully functional when you see:**

✅ **User Management:**
- Users in `User` table with different roles
- Creator profiles in `CreatorProfile` table

✅ **Content System:**
- Posts in `Post` table
- Media in `PostMedia` table
- Content in `Content` table
- Courses in `Course` table

✅ **Social Features:**
- Likes in `Like` table
- Comments in `Comment` table
- Subscriptions in `Subscription` table
- Tips in `Tip` table

✅ **Communication:**
- Conversations in `Conversation` table
- Messages in `Message` table
- Communities in `Community` table
- Community members in `CommunityMember` table

✅ **Monetization:**
- Payments in `Payment` table
- Course access in `CourseAccess` table

✅ **Delivery:**
- OTP records in `OTPVerification` table
- Delivery records in `ContentDelivery` table

---

**Follow this guide step by step, and you'll be able to verify that every single functionality in your application is working correctly!** 