require('dotenv').config({path: '.env.example'});
const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  let { data, error } = await supabaseAdmin
      .from('user_profiles')
      .select('credits')
      .eq('id', '6fa6ccca-6fbe-402a-87cf-f528cb826810')
      .single();
  console.log("Admin fetch:", data, error);
}
test();
