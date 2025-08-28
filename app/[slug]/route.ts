import { NextRequest, NextResponse } from 'next/server';
import { getLinkFromSlug, recordLinkClick } from '@/lib/supabase/helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise <{ slug: string }> }
) {
  try {
    const { slug } =  await params;
    
    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    // Query the database for the link with this slug
    const link = await getLinkFromSlug(slug);
    
    if (!link || !link.destination_url) {
      // If no link found or no destination URL, return 404
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    // Record the click in analytics
    await recordLinkClick(link.id);

    // Redirect to the destination URL
    return NextResponse.redirect(link.destination_url);
    
  } catch (error) {
    console.error('Error in slug route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
