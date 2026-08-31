import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://oaqtglfngpvekyxhwyzx.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_95EPkKJt9ieo1p1GGfnxxw_ZatypR-a';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_95EPkKJt9ieo1p1GGfnxxw_ZatypR-a';

    // Verify token and fetch user details
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use admin client to safely retrieve user's generations (bypasses RLS issues if any)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: generations, error: genError } = await supabaseAdmin
      .from('generations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (genError) {
      console.error('Error fetching generations:', genError);
      return NextResponse.json({ error: 'Failed to fetch generations' }, { status: 500 });
    }

    return NextResponse.json({ generations });
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
