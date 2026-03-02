// Test login with the created user
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://192.168.0.193:54321';
const supabaseAnonKey = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  console.log('Testing login with test@example.com...');
  console.log('URL:', supabaseUrl);
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'password123',
  });

  if (error) {
    console.error('❌ Login failed:', error);
    return;
  }

  console.log('✅ Login successful!');
  console.log('User ID:', data.user.id);
  console.log('Email:', data.user.email);
  console.log('Session:', data.session ? 'Active' : 'None');
}

testLogin().catch(console.error);
