import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const storageClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aikpzlzcqqwtlqfxlcer.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_vhhr6-GY43cX64B9WnWYUQ_X67z87tG'
);

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split('Bearer ')[1] : null;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const assignmentId = formData.get('assignmentId') as string;
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: "No file selected" }, { status: 400 });
    }

    const filePath = `${user.id}/${Date.now()}-${file.name}`;

    // Upload file to Supabase storage
    const { error: uploadError } = await storageClient.storage
      .from('assignment-files')
      .upload(filePath, file);

    if (uploadError) {
      console.log("UPLOAD ERROR:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/assignment-files/${filePath}`;

    // Insert or update submission
    const { error: insertError } = await storageClient
      .from('assignment_submissions')
      .upsert(
        {
          assignment_id: assignmentId,
          student_id: user.id,
          file_url: fileUrl,
        },
        {
          onConflict: 'assignment_id,student_id',
        }
      );

    if (insertError) {
      console.log("INSERT ERROR:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Assignment submitted successfully",
    });

  } catch (error) {
    console.log("SERVER ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}