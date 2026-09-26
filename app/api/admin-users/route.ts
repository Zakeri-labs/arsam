import { NextResponse } from 'next/server';
import { requireSuperadmin } from '@/lib/auth-check';
import {
  AccountError,
  createStaffAccount,
  deleteStaffAccount,
  listBuiltInAccounts,
  listStaffAccounts,
  updateStaffAccount,
} from '@/lib/admin-users';

// Access management — general manager only. Staff accounts live in
// public.admin_users; built-in accounts are listed read-only.

function failure(error: unknown, fallback: string) {
  if (error instanceof AccountError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  console.error(fallback, error);
  return NextResponse.json({ error: fallback }, { status: 500 });
}

export async function GET() {
  const { denied } = await requireSuperadmin();
  if (denied) return denied;
  try {
    return NextResponse.json({ builtIn: listBuiltInAccounts(), staff: await listStaffAccounts() });
  } catch (error) {
    return failure(error, 'خطا در دریافت لیست کاربران');
  }
}

export async function POST(request: Request) {
  const { denied, user } = await requireSuperadmin();
  if (denied) return denied;
  try {
    const body = await request.json();
    const account = await createStaffAccount(
      { email: body.email, name: body.name, password: body.password, allowedScreens: body.allowedScreens },
      user!.email
    );
    return NextResponse.json({ success: true, account });
  } catch (error) {
    return failure(error, 'خطا در ایجاد کاربر');
  }
}

export async function PATCH(request: Request) {
  const { denied } = await requireSuperadmin();
  if (denied) return denied;
  try {
    const body = await request.json();
    if (typeof body.id !== 'string' || !body.id) {
      return NextResponse.json({ error: 'شناسه کاربر الزامی است' }, { status: 400 });
    }
    const account = await updateStaffAccount(body.id, {
      name: body.name,
      allowedScreens: body.allowedScreens,
      isActive: body.isActive,
      password: body.password,
    });
    return NextResponse.json({ success: true, account });
  } catch (error) {
    return failure(error, 'خطا در ویرایش کاربر');
  }
}

export async function DELETE(request: Request) {
  const { denied } = await requireSuperadmin();
  if (denied) return denied;
  try {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'شناسه کاربر الزامی است' }, { status: 400 });
    await deleteStaffAccount(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return failure(error, 'خطا در حذف کاربر');
  }
}
