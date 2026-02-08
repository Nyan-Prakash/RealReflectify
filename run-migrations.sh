#!/bin/bash

# Script to run Supabase migrations
# This applies all migrations in order to your Supabase database

echo "🚀 Running Reflectify database migrations..."
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL is not set"
  echo "Please make sure your .env.local file is configured correctly"
  exit 1
fi

# Source environment variables
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
fi

echo "📋 Migration 1: Initial Schema"
psql "$DATABASE_URL" -f supabase/migrations/0001_initial_schema.sql
if [ $? -eq 0 ]; then
  echo "✅ Migration 1 completed"
else
  echo "❌ Migration 1 failed"
  exit 1
fi

echo ""
echo "📋 Migration 2: pgvector & Search"
psql "$DATABASE_URL" -f supabase/migrations/0002_pgvector_and_search.sql
if [ $? -eq 0 ]; then
  echo "✅ Migration 2 completed"
else
  echo "❌ Migration 2 failed"
  exit 1
fi

echo ""
echo "📋 Migration 3: Row Level Security"
psql "$DATABASE_URL" -f supabase/migrations/0003_row_level_security.sql
if [ $? -eq 0 ]; then
  echo "✅ Migration 3 completed"
else
  echo "❌ Migration 3 failed"
  exit 1
fi

echo ""
echo "🎉 All migrations completed successfully!"
echo ""
echo "Next steps:"
echo "  1. Verify in Supabase dashboard: Table Editor"
echo "  2. Test connection: npx tsx test-db.ts"
