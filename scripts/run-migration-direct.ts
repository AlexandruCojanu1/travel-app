#!/usr/bin/env tsx
/**
 * Script to run SQL migrations directly in Supabase using Service Role Key
 * Usage: npx tsx scripts/run-migration-direct.ts <migration-file>
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const migrationFile = process.argv[2]
if (!migrationFile) {
  console.error('❌ Usage: npx tsx scripts/run-migration-direct.ts <migration-file>')
  process.exit(1)
}

async function runMigration() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase environment variables')
    process.exit(1)
  }

  // Create Supabase client with service role key (bypasses RLS)
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  try {
    // Read migration file
    const migrationPath = join(process.cwd(), migrationFile)
    const sql = readFileSync(migrationPath, 'utf-8')
    
    console.log(`📄 Reading migration: ${migrationFile}`)
    console.log(`📝 SQL length: ${sql.length} characters`)
    
    // Execute SQL using RPC (if available) or direct query
    // Note: Supabase JS client doesn't have direct SQL execution
    // We need to use the REST API or create a function
    
    // Try using REST API endpoint
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ sql }),
    })

    if (!response.ok) {
      // Fallback: Use Supabase Management API
      console.log('⚠️  RPC endpoint not available, trying alternative method...')
      throw new Error('RPC not available')
    }

    const result = await response.json()
    console.log('✅ Migration executed successfully')
    console.log('Result:', result)
    
  } catch (error: any) {
    console.error('❌ Error executing migration:', error.message)
    
    // Alternative: Use pg library directly (requires postgres connection string)
    console.log('\n💡 Alternative: Run migration manually in Supabase SQL Editor')
    console.log(`   File: ${migrationFile}`)
    console.log('\nOr use Supabase CLI:')
    console.log(`   supabase db push --file ${migrationFile}`)
    
    process.exit(1)
  }
}

runMigration()
