import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";
import { saveThumbnail, isUploadedFile } from "@/lib/uploads";
import { getYoutubeThumbnail } from "@/lib/youtube";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await request.formData();
  const title = form.get("title");
  const description = form.get("description");
  const youtubeUrl = form.get("youtubeUrl");
  const client = form.get("client");
  const role = form.get("role");
  const year = form.get("year");
  const categoryNames = form.getAll("categories").map(String).filter(Boolean);
  const thumbnailFile = form.get("thumbnail");

  const current = await prisma.project.findUnique({ where: { id: params.id } });
  if (!current) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (title) data.title = String(title).trim();
  if (description) data.description = String(description).trim();
  if (youtubeUrl) data.youtubeUrl = String(youtubeUrl).trim();
  if (client !== null) data.client = String(client).trim() || null;
  if (role !== null) data.role = String(role).trim() || null;
  if (year) data.year = Number(year);
  if (isUploadedFile(thumbnailFile) && thumbnailFile.size > 0) {
    data.thumbnail = await saveThumbnail(thumbnailFile);
  } else if (youtubeUrl && String(youtubeUrl).trim() !== current.youtubeUrl) {
    const autoThumbnail = getYoutubeThumbnail(String(youtubeUrl).trim());
    if (autoThumbnail) data.thumbnail = autoThumbnail;
  }
  if (categoryNames.length > 0) {
    data.categories = {
      set: [],
      connectOrCreate: categoryNames.map((name) => ({
        where: { name },
        create: { name },
      })),
    };
  }

  const project = await prisma.project.update({
    where: { id: params.id },
    data,
    include: { categories: true },
  });

  return NextResponse.json(project);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.project.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
