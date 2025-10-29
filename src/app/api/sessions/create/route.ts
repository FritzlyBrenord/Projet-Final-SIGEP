import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  }
);

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    console.log("📩 Données reçues :", data);

    const { email, session_token, device_info, ip_address, login_time, last_activity } = data;

    const { error } = await supabaseAdmin
      .from("sessions_actives")
      .insert([{ email, session_token, device_info, ip_address, login_time, last_activity }]);

    if (error) {
      console.error("❌ Erreur insert session:", error);
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    console.log("✅ Session insérée avec succès !");
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("💥 Erreur POST session:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Erreur interne" },
      { status: 500 }
    );
  }
}
