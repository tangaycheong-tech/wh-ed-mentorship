#!/bin/bash
# WH ED Mentorship - Database Setup Script
# Run this after creating the .env.local file

set -e

if [ ! -f .env.local ]; then
  echo "Error: .env.local not found. Copy .env.example to .env.local first."
  exit 1
fi

echo "Installing dependencies..."
npm install

echo ""
echo "Setting up database schema..."
# You need to run this manually in your Supabase SQL editor or via psql:
echo "  psql $DATABASE_URL -f db/schema.sql"
echo ""
echo "After the schema is created, restart the dev server:"
echo "  npm run dev"
