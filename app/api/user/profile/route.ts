export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://oaqtglfngpvekyxhwyzx.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_95EPkKJt9ieo1p1GGfnxxw_ZatypR-a';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_95EPkKJt9ieo1p1GGfnxxw_ZatypR-a';
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const token = authHeader.replace('Bearer ', '');

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    let { data, error } = await supabaseAdmin
      .from('user_profiles')
      .select('credits')
      .eq('id', user.id)
      .single();

    if (error && error.code === 'PGRST116') {
      const { data: newProfile, error: insertError } = await supabaseAdmin
        .from('user_profiles')
        .insert({ id: user.id, email: user.email, credits: 50, role: 'user' })
        .select('credits')
        .single();
      
      if (insertError) throw insertError;
      data = newProfile;
    } else if (error) {
      throw error;
    }
    
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
