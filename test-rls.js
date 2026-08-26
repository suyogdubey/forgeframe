const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  // Try to login as the user
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'suyogdubey10@gmail.com',
    password: 'password' // I don't know the password
  });
  console.log("Auth:", authData.user?.id, authError?.message);
}
test();
