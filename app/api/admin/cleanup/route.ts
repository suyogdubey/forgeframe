import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Find all generations older than 7 days
    const { data: oldGens, error: fetchError } = await supabaseAdmin
      .from('generations')
      .select('id, video_url')
      .lt('created_at', sevenDaysAgo.toISOString());

    if (fetchError) throw fetchError;
    if (!oldGens || oldGens.length === 0) {
      return NextResponse.json({ deletedCount: 0 });
    }

    // Extract file paths from URLs
    // Typical public URL: https://[project].supabase.co/storage/v1/object/public/videos/[userId]/[timestamp].mp4
    const filePaths = oldGens
      .map(gen => {
        const urlParts = gen.video_url.split('/videos/');
        return urlParts.length > 1 ? urlParts[1] : null;
      })
      .filter(Boolean) as string[];

    // Delete files from storage
    if (filePaths.length > 0) {
      const { error: storageError } = await supabaseAdmin
        .storage
        .from('videos')
        .remove(filePaths);
        
      if (storageError) {
         console.error('Storage cleanup error:', storageError);
         // Continue to delete from DB anyway? Or throw? Let's continue.
      }
    }

    const idsToDelete = oldGens.map(gen => gen.id);

    // Delete rows from generations table
    const { error: dbError } = await supabaseAdmin
      .from('generations')
      .delete()
      .in('id', idsToDelete);

    if (dbError) throw dbError;

    return NextResponse.json({ deletedCount: idsToDelete.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
