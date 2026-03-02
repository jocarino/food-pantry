// Create test user properly using Supabase Admin API
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'; // Default local service role key

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createUser() {
  console.log('Creating test user using Admin API...');
  
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'test@example.com',
    password: 'password123',
    email_confirm: true, // Auto-confirm the email
    user_metadata: {
      display_name: 'Test User'
    }
  });

  if (error) {
    console.error('Error creating user:', error);
    return;
  }

  console.log('✅ User created successfully!');
  console.log('User ID:', data.user.id);
  console.log('Email:', data.user.email);
  
  return data.user.id;
}

createUser().catch(console.error);
