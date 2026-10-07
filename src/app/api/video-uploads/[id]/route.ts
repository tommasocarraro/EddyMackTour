import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";
import { deleteBunnyVideo } from "@/lib/bunny";

// Discards an upload the admin abandoned (cancelled, or replaced before saving).
// A video a project is using is only removed along with that project.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!/^[0-9a-f-]{36}$/i.test(params.id)) {
    return NextResponse.json({ error: "Video not found." }, { status: 404 });
  }

  const inUse = await prisma.project.findFirst({ where: { youtubeUrl: { contains: params.id } } });
  if (inUse) {
    return NextResponse.json({ error: "A project is using this video." }, { status: 409 });
  }

  await deleteBunnyVideo(params.id);
  return NextResponse.json({ ok: true });
}
