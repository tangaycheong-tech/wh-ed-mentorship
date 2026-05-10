#!/bin/bash
# ============================================================
# scripts/render-init.sh — Run once on first deploy to set up DB schema
# ============================================================
# Called automatically by Render on first deploy (startCommand).
# Guards against re-running if schema already applied.
# ============================================================

set -e

SCHEMA_FILE="/app/db/schema.sql"
FLAG_FILE="/var/data/.schema_initialized"
DB="$DATABASE_URL"

echo "🚀 Render init: checking if schema needs setup..."

# Skip if already initialized
if [ -f "$FLAG_FILE" ]; then
  echo "✅ Schema already initialized (flag file exists). Skipping."
  exit 0
fi

# Ensure schema file exists
if [ ! -f "$SCHEMA_FILE" ]; then
  echo "⚠️  Schema file not found at $SCHEMA_FILE. Skipping DB init."
  exit 0
fi

# Wait briefly for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Apply schema
echo "📦 Applying database schema..."
PGPASSWORD="" psql "$DB" -f "$SCHEMA_FILE"
RESULT=$?

if [ $RESULT -eq 0 ]; then
  echo "✅ Schema applied successfully."
  mkdir -p "$(dirname "$FLAG_FILE")"
  touch "$FLAG_FILE"
  echo "✅ Init flag saved."
else
  echo "❌ Schema apply failed. Will retry on next deploy."
  exit 1
fi