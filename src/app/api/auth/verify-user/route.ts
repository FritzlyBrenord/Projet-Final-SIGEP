import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId requis' },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur existe dans auth.users
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (error || !data.user) {
      return NextResponse.json(
        { success: false, exists: false, error: error?.message || 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      exists: true,
      user: data.user 
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, exists: false, error: error.message },
      { status: 500 }
    );
  }
}