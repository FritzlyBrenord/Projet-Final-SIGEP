// src/app/api/presence/heartbeat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, email, session_token } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email manquant' },
        { status: 400 }
      );
    }

    const ip_address = request.headers.get('x-forwarded-for') || 
                       request.headers.get('x-real-ip') || 
                       'unknown';
    const user_agent = request.headers.get('user-agent') || 'unknown';

    // ✅ UPDATE : Mettre à jour last_activity
    const { data, error } = await supabase
      .from('user_presence')
      .update({
        status: 'online',
        last_activity: new Date().toISOString(),
        ip_address,
        user_agent,
      })
      .eq('email', email)
      .select()
      .single();

    if (error) {
      console.error('Erreur heartbeat:', error);
      return NextResponse.json(
        { error: 'Erreur serveur' },
        { status: 500 }
      );
    }

    console.log(`💓 Heartbeat reçu: ${email}`);

    return NextResponse.json({ 
      success: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur heartbeat:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}