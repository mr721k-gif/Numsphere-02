import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient as createSSRClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const supabaseUser = createSSRClient();
    const {
      data: { user },
      error: authError,
    } = await supabaseUser.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const admin = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
    );

    // Ensure bucket exists (public)
    await admin.storage.createBucket("contacts", { public: true }).catch(() => {
      // ignore if exists
    });

    const safeName = file.name.replace(/[^A-Za-z0-9._-]/g, "_");
    const path = `${user.id}/${Date.now()}_${safeName}`;

    const { error: uploadError } = await admin.storage
      .from("contacts")
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const {
      data: { publicUrl },
    } = admin.storage.from("contacts").getPublicUrl(path);

    return NextResponse.json({ url: publicUrl }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Upload failed" },
      { status: 500 },
    );
  }
}
