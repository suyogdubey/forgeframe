const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data, error } = await supabaseAdmin.rpc('get_policies', { table_name: 'user_profiles' });
  if (error) {
    // maybe run a raw query
    console.log("Error running rpc, trying raw query...", error);
  } else {
    console.log("Policies:", data);
  }
}
test();
