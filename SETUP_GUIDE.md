# Database Connection Setup Guide

## Issue: Direct Connection Not Working

The hostname `db.yflpxnktiviftsmlsyrp.supabase.co` is not resolving. This is common with new Supabase projects.

## Solution: Use Connection Pooler (Recommended)

### Step 1: Get the Pooler URL

1. Go to: **https://app.supabase.com/project/yflpxnktiviftsmlsyrp/settings/database**

2. Scroll to **"Connection string"** section

3. You'll see multiple tabs:
   - **URI** (don't use this)
   - **Nodejs** (don't use this for now)
   - **Session mode** ← **USE THIS ONE**

4. **Click on "Session mode" tab**

5. The connection string will look like:
   ```
   postgresql://postgres.yflpxnktiviftsmlsyrp:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
   ```

6. **Replace `[YOUR-PASSWORD]` with your actual database password**

### Step 2: Update Your .env.local

Replace the current `DATABASE_URL` in your `.env.local` file with the pooler URL from above.

**Key differences:**
- ❌ Old: `db.yflpxnktiviftsmlsyrp.supabase.co:5432`
- ✅ New: `aws-0-us-west-1.pooler.supabase.com:6543`

### Step 3: Test Connection

After updating `.env.local`, run:

```bash
npx tsx test-connection-simple.ts
```

You should see:
```
✅ Connected! Server time: ...
✅ Found 13 tables
✅ pgvector enabled
✅ Users table accessible
```

---

## Why Use Connection Pooler?

1. **Works immediately** - No DNS propagation wait
2. **Better for serverless** - Reuses connections efficiently
3. **Recommended by Supabase** - For Next.js apps
4. **More reliable** - Better uptime and performance

---

## Alternative: Wait for Direct Connection

If you prefer to use the direct connection (`db.xxx.supabase.co`):

1. **Wait 15-30 minutes** for DNS to fully propagate
2. Your current `.env.local` should work then
3. Not recommended for production Next.js apps

---

## Need Help?

If you're still having issues:

1. **Verify your Supabase project is fully provisioned**:
   - Go to: https://app.supabase.com/project/yflpxnktiviftsmlsyrp
   - Check if all services show "Healthy" (green checkmarks)

2. **Check if migrations ran successfully**:
   - Go to: **SQL Editor**
   - Run: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
   - You should see 13 tables

3. **Verify your password is correct**:
   - The password in `DATABASE_URL` must match the one you set when creating the project
   - It should NOT contain `[YOUR-PASSWORD]` - replace it with the actual password

Let me know once you've updated the DATABASE_URL and I'll help you test! 🚀
