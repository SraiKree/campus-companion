import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getSupabase() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

async function authenticateUser(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  const supabase = getSupabase();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

// GET - Fetch student details
export async function GET(request: Request) {
  try {
    const user = await authenticateUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('student_details')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: 'Failed to fetch details' }, { status: 500 });
    }

    return NextResponse.json({ details: data || null });
  } catch (error) {
    console.error('Error in GET /api/student/details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create or update student details
export async function POST(request: Request) {
  try {
    const user = await authenticateUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const supabase = getSupabase();

    const record = {
      user_id: user.id,
      full_name: body.full_name,
      gender: body.gender,
      department: body.department,
      nature_of_work: body.nature_of_work,
      designation: body.designation,
      date_of_birth: body.date_of_birth,
      father_name: body.father_name,
      mother_name: body.mother_name,
      religion: body.religion,
      caste: body.caste,
      category: body.category,
      category_telangana: body.category_telangana,
      special_category: body.special_category,
      permanent_address: body.permanent_address,
      communication_address: body.communication_address,
      mobile_no: body.mobile_no,
      email_address: body.email_address,
      pan_no: body.pan_no,
      aadhar_no: body.aadhar_no,
      apaar_id: body.apaar_id || null,
      abha_no: body.abha_no,
      updated_at: new Date().toISOString(),
    };

    // Check if record exists
    const { data: existing } = await supabase
      .from('student_details')
      .select('id')
      .eq('user_id', user.id)
      .single();

    let result;
    if (existing) {
      const { data, error } = await supabase
        .from('student_details')
        .update(record)
        .eq('user_id', user.id)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase
        .from('student_details')
        .insert(record)
        .select()
        .single();
      if (error) throw error;
      result = data;
    }

    return NextResponse.json({ details: result }, { status: existing ? 200 : 201 });
  } catch (error) {
    console.error('Error in POST /api/student/details:', error);
    return NextResponse.json({ error: 'Failed to save details' }, { status: 500 });
  }
}
