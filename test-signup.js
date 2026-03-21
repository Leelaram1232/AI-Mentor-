// Quick diagnostic test for Supabase signup
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('=== SUPABASE DIAGNOSTIC ===');
console.log('URL:', url);
console.log('Key (first 20):', key?.substring(0, 20) + '...');

const supabase = createClient(url, key);

async function main() {
  const email = `fix_test_${Date.now()}@example.com`;
  console.log('\n--- Test 1: Signup ---');
  console.log('Email:', email);
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password: 'TestPassword123!',
    options: { data: { full_name: 'Fix Test' } }
  });

  if (error) {
    console.log('ERROR STATUS:', error.status);
    console.log('ERROR MESSAGE:', error.message);
    console.log('ERROR NAME:', error.name);
    console.log('FULL ERROR:', JSON.stringify(error, null, 2));
    
    if (error.status === 429) {
      console.log('\n⚠️  FIX: Go to Supabase Dashboard > Authentication > Providers > Email');
      console.log('    Toggle OFF "Confirm email" and click Save.');
      console.log('    This removes the 3-email-per-hour rate limit for testing.');
    }
  } else {
    console.log('SUCCESS! User ID:', data.user?.id);
    console.log('Session exists:', !!data.session);
    console.log('Email confirmed:', data.user?.email_confirmed_at ? 'YES' : 'NO (needs confirmation)');
    
    if (!data.session) {
      console.log('\n⚠️  User created but NO SESSION returned.');
      console.log('    This means email confirmation IS still required.');
      console.log('    FIX: Go to Supabase Dashboard > Authentication > Providers > Email');
      console.log('    Toggle OFF "Confirm email" and click Save.');
    }
    
    // Test 2: Try to read profiles table
    console.log('\n--- Test 2: Profiles Table ---');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (profileError) {
      console.log('PROFILES TABLE ERROR:', profileError.message);
      console.log('⚠️  FIX: Run the supabase-schema.sql in the SQL Editor first!');
    } else {
      console.log('Profiles table OK. Rows found:', profileData?.length);
    }
  }
}

main().catch(e => console.error('FATAL:', e));
