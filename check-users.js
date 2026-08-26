const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();
  console.log("Auth users:", users.users.map(u => ({ id: u.id, email: u.email })));

  const { data: profiles, error: profileError } = await supabaseAdmin.from('user_profiles').select('*');
  console.log("Profiles:", profiles);
}
test();
