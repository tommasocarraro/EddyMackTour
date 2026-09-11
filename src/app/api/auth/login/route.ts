import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  const validEmail = process.env.ADMIN_EMAIL;
  const validHashBase64 = process.env.ADMIN_PASSWORD_HASH_BASE64;
  const validHash = validHashBase64
    ? Buffer.from(validHashBase64, "base64").toString("utf8")
    : undefined;

  if (!validEmail || !validHash) {
    return NextResponse.json(
      { error: "Admin account is not configured." },
      { status: 500 }
    );
  }

  if (email !== validEmail || !(await bcrypt.compare(password, validHash))) {
    return NextResponse.json(
      { error: "Incorrect email or password." },
      { status: 401 }
    );
  }

  await createSession();
  return NextResponse.json({ ok: true });
}
