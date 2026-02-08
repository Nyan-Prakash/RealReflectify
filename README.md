# Reflectify

An AI-powered journaling application that transforms your text entries into structured knowledge. Reflectify extracts events, entities (people, places, organizations), and creates relationship graphs over time, making your past reflections searchable and actionable.

## 🚀 Tech Stack

- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **Database**: Supabase (PostgreSQL + pgvector)
- **Authentication**: Supabase Auth
- **AI**: OpenAI GPT-4o
- **Jobs**: Inngest
- **ORM**: Drizzle
- **State**: TanStack Query (React Query)

## 📋 Prerequisites

- Node.js 18+ and npm
- A Supabase account
- An OpenAI API key
- An Inngest account (for background jobs)

## 🔑 Getting Your API Keys

### 1. Supabase Setup

Supabase provides both your database and authentication in one service.

**Step-by-step:**

1. **Create a Supabase Account**
   - Go to [supabase.com](https://supabase.com)
   - Click "Start your project"
   - Sign up with GitHub, Google, or email

2. **Create a New Project**
   - Click "New Project"
   - Choose your organization
   - Fill in:
     - **Project name**: `reflectify` (or your choice)
     - **Database Password**: Generate a strong password and **save it securely**
     - **Region**: Choose the closest to your users
     - **Pricing Plan**: Free tier works for development
   - Click "Create new project"
   - Wait ~2 minutes for provisioning

3. **Get Your Supabase Keys**

   Once your project is created:

   - Go to **Project Settings** (gear icon in sidebar)
   - Navigate to **API** section
   - You'll see:
     - **Project URL**: `https://xxxxx.supabase.co` → This is your `NEXT_PUBLIC_SUPABASE_URL`
     - **Project API keys**:
       - **anon / public**: Starts with `eyJhbGc...` → This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
       - **service_role**: Click "Reveal" → This is your `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **Keep this secret!**

4. **Get Your Database URL**

   - Still in **Project Settings**
   - Navigate to **Database** section
   - Scroll to **Connection string**
   - Select **Nodejs** tab
   - Copy the connection string
   - Replace `[YOUR-PASSWORD]` with the password you created in step 2
   - This is your `DATABASE_URL`

   Example format:
   ```
   postgresql://postgres:your-password@db.xxxxx.supabase.co:5432/postgres
   ```

### 2. OpenAI API Key

1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign in or create an account
3. Navigate to **API keys** (left sidebar)
4. Click **"+ Create new secret key"**
5. Name it `reflectify` (optional)
6. Copy the key immediately (starts with `sk-...`) → This is your `OPENAI_API_KEY`
7. **Important**: You won't be able to see it again, so save it securely

**Pricing**: Pay-as-you-go. Typical usage: ~$0.01-0.05 per journal entry processed.

### 3. Inngest Setup (Background Jobs)

1. Go to [inngest.com](https://inngest.com)
2. Sign up (free tier available)
3. Create a new app
4. Get your keys from the dashboard:
   - **Event Key**: `INNGEST_EVENT_KEY`
   - **Signing Key**: `INNGEST_SIGNING_KEY`

**Note**: You can skip Inngest initially and add it later when implementing background jobs (Phase 5).

## 🛠️ Installation

### 1. Clone and Install Dependencies

```bash
cd /Users/nyanprakash/Desktop/Reflect/three
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in your actual keys:

```env
# Supabase (Database + Authentication)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
DATABASE_URL=postgresql://postgres:your-password@db.xxxxx.supabase.co:5432/postgres

# OpenAI
OPENAI_API_KEY=sk-...

# Inngest (can leave empty for now)
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 3. Run Database Migrations

Apply the database schema to your Supabase project:

**Option A: Using Supabase Dashboard (Recommended for beginners)**

1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the sidebar
3. Create a new query
4. Copy the contents of each migration file and run them **in order**:
   - First: `supabase/migrations/0001_initial_schema.sql`
   - Second: `supabase/migrations/0002_pgvector_and_search.sql`
   - Third: `supabase/migrations/0003_row_level_security.sql`

**Option B: Using Supabase CLI** (Advanced)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
npx supabase login

# Link to your project
npx supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
npx supabase db push
```

### 4. Verify Database Setup

In the Supabase dashboard:

1. Go to **Table Editor**
2. You should see all tables: `users`, `entries`, `events`, `entities`, etc.
3. Go to **Database** → **Extensions**
4. Verify that `vector` extension is enabled

### 5. Enable Email Authentication

In your Supabase dashboard:

1. Go to **Authentication** → **Providers**
2. **Email** should be enabled by default
3. Configure email templates (optional):
   - Go to **Authentication** → **Email Templates**
   - Customize the sign-up confirmation email

**Optional Providers**: You can also enable Google, GitHub, etc. for social login.

## 🚀 Running the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
/Users/nyanprakash/Desktop/Reflect/three/
├── app/                    # Next.js App Router pages
├── lib/
│   ├── auth/              # Supabase auth utilities
│   │   ├── supabase-server.ts  # Server-side auth
│   │   └── supabase-client.ts  # Client-side auth
│   ├── db/                # Database
│   │   ├── schema.ts      # Drizzle schema (TypeScript)
│   │   └── client.ts      # Database client
│   ├── config/            # Environment config
│   └── ai/                # AI extraction pipeline (coming soon)
├── supabase/
│   └── migrations/        # SQL migration files
│       ├── 0001_initial_schema.sql
│       ├── 0002_pgvector_and_search.sql
│       └── 0003_row_level_security.sql
├── components/            # React components (coming soon)
├── .env.example          # Environment template
└── .env.local            # Your actual keys (DO NOT COMMIT)
```

## 🔒 Security Notes

### ⚠️ Never Commit These to Git:

- `.env.local`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `INNGEST_SIGNING_KEY`

The `.gitignore` is already configured to exclude `.env.local`.

### Row-Level Security (RLS)

All database tables have RLS policies enabled, ensuring:

- Users can **only see their own data**
- No user can access another user's entries, entities, or events
- Authentication is enforced at the database level

## 🧪 Testing Database Connection

Create a test file to verify your setup:

```typescript
// test-db.ts
import { db } from "./lib/db/client";
import { users } from "./lib/db/schema";

async function testConnection() {
  try {
    const result = await db.select().from(users).limit(1);
    console.log("✅ Database connected successfully!");
    console.log("Users:", result);
  } catch (error) {
    console.error("❌ Database connection failed:", error);
  }
  process.exit(0);
}

testConnection();
```

Run it:

```bash
npx tsx test-db.ts
```

## 📚 Next Steps

Now that your foundation is set up:

1. ✅ **Phase 1 Complete**: Database + Auth configured
2. 🔜 **Phase 2**: Build entry creation UI
3. 🔜 **Phase 3**: Implement AI extraction pipeline
4. 🔜 **Phase 4**: Entity resolution and deduplication
5. 🔜 **Phase 5**: Background job processing with Inngest

## 🐛 Troubleshooting

### "Database connection failed"

- Check your `DATABASE_URL` has the correct password
- Verify your IP is allowed in Supabase (Project Settings → Database → Connection Pooling)
- Ensure migrations have been run

### "Auth not working"

- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
- Check that email auth is enabled in Supabase dashboard
- Make sure middleware.ts is in the root directory

### "Module not found" errors

```bash
rm -rf node_modules package-lock.json
npm install
```

## 📖 Documentation

- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [OpenAI API Reference](https://platform.openai.com/docs)
- [Drizzle ORM](https://orm.drizzle.team/docs/overview)

## 📝 License

MIT

## 🤝 Contributing

This is a personal project, but suggestions and feedback are welcome!

---

**Built with ❤️ using Next.js, Supabase, and OpenAI**
