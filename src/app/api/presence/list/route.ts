// src/app/api/presence/list/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Récupérer tous les utilisateurs avec activité récente (< 2 minutes)
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('user_presence')
      .select('user_id, email, status, ip_address, last_activity')
      .eq('status', 'online')
      .gte('last_activity', twoMinutesAgo)
      .order('last_activity', { ascending: false });

    if (error) {
      console.error('Erreur liste:', error);
      return NextResponse.json(
        { error: 'Erreur serveur' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      users: data || [],
      count: data?.length || 0
    });

  } catch (error) {
    console.error('Erreur liste:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}