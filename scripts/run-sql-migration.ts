#!/usr/bin/env tsx
/**
 * Run SQL migration directly in Supabase using Management API
 */

import { readFileSync } from 'fs'
import { join } from 'path'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://accisrnendkywetmlqhn.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjY2lzcm5lbmRreXdldG1scWhuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjMyNjIzMCwiZXhwIjoyMDgxOTAyMjMwfQ.mzz13_QAdYaLr_Upe6kJoRDbiHXXPW6kCQ5_GfTr9Yo'

const migrationFile = process.argv[2] || 'supabase/migrations/20260125_fix_trip_collaborators_rls.sql'

async function runMigration() {
  try {
    // Read migration file
    const migrationPath = join(process.cwd(), migrationFile)
    const sql = readFileSync(migrationPath, 'utf-8')
    
    console.log(`📄 Reading migration: ${migrationFile}`)
    console.log(`📝 SQL length: ${sql.length} characters\n`)
    
    // Use Supabase Management API to execute SQL
    // Note: This requires the project's API to have a SQL execution endpoint
    // Alternative: Use Supabase REST API with RPC function
    
    // Try using the REST API with a custom RPC function
    // For now, we'll use a direct PostgreSQL connection approach via API
    
    const projectRef = SUPABASE_URL.split('//')[1].split('.')[0]
    console.log(`🔗 Project Ref: ${projectRef}`)
    
    // Use Supabase Management API (requires different endpoint)
    // Or use the database REST API with a custom function
    
    // Since direct SQL execution isn't available via REST API,
    // we'll output the SQL for manual execution or use Supabase CLI
    
    console.log('⚠️  Direct SQL execution via API is not available.')
    console.log('📋 SQL to execute:\n')
    console.log('─'.repeat(60))
    console.log(sql)
    console.log('─'.repeat(60))
    console.log('\n💡 Options:')
    console.log('1. Copy SQL above and run in Supabase Dashboard → SQL Editor')
    console.log('2. Use Supabase CLI: supabase db push')
    console.log('3. Use the admin API endpoint (if configured)')
    
    // Try to use admin API if available
    try {
      const adminResponse = await fetch('http://localhost:3000/api/admin/execute-sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql }),
      })
      
      if (adminResponse.ok) {
        const result = await adminResponse.json()
        console.log('\n✅ Executed via admin API:', result)
        return
      }
    } catch (e) {
      // Admin API not available, continue with manual instructions
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

runMigration()
