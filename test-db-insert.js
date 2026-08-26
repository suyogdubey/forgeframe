const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabase.from('generations').insert({ user_id: '86202484-82ea-42e1-a08c-9a4f4949bd51', prompt: 'test', video_url: 'pending' }).select();
  console.log(data, error);
}
run();
