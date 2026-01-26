#!/bin/bash
# Script to run SQL migration via Supabase REST API
# Requires: exec_sql function to be created first in Supabase

set -e

MIGRATION_FILE="${1:-supabase/migrations/20260125_fix_trip_collaborators_rls.sql}"
SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-https://accisrnendkywetmlqhn.supabase.co}"
SUPABASE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"

if [ -z "$SUPABASE_KEY" ]; then
    echo "❌ Error: SUPABASE_SERVICE_ROLE_KEY not set"
    echo "   Set it in .env.local or export it"
    exit 1
fi

if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Error: Migration file not found: $MIGRATION_FILE"
    exit 1
fi

echo "📄 Reading migration: $MIGRATION_FILE"
SQL=$(cat "$MIGRATION_FILE")

echo "🚀 Executing migration via Supabase API..."
echo ""

# First, try to create exec_sql function if it doesn't exist
CREATE_FUNCTION_SQL=$(cat <<'EOF'
CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
BEGIN
    EXECUTE query;
    RETURN jsonb_build_object('success', true, 'message', 'Query executed successfully');
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM, 'sqlstate', SQLSTATE);
END;
$$;
GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;
EOF
)

echo "📝 Step 1: Creating exec_sql function..."
# Note: This requires direct database access or Supabase Dashboard

echo ""
echo "⚠️  Direct SQL execution via REST API requires the exec_sql function."
echo "   Please run this SQL in Supabase Dashboard → SQL Editor first:"
echo ""
echo "─────────────────────────────────────────────────────────────"
echo "$CREATE_FUNCTION_SQL"
echo "─────────────────────────────────────────────────────────────"
echo ""
echo "Then run the migration:"
echo ""
echo "─────────────────────────────────────────────────────────────"
echo "$SQL"
echo "─────────────────────────────────────────────────────────────"
echo ""
echo "Or use Supabase CLI:"
echo "  supabase db push --file $MIGRATION_FILE"
