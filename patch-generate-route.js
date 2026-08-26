const fs = require('fs');
let code = fs.readFileSync('app/api/generate/route.ts', 'utf8');

code = code.replace(
`    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('credits')
      .eq('id', user.id)
      .single();
    
    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }`,
`    let { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('credits')
      .eq('id', user.id)
      .single();
      
    if (profileError && profileError.code === 'PGRST116') {
      const { data: newProfile, error: insertError } = await supabaseAdmin
        .from('user_profiles')
        .insert({ id: user.id, email: user.email, credits: 50, role: 'user' })
        .select('credits')
        .single();
      if (insertError) {
        return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
      }
      profile = newProfile;
    } else if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }`
);

fs.writeFileSync('app/api/generate/route.ts', code);
