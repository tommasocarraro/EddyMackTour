import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";
import { slugify } from "@/lib/slugify";
import { saveThumbnail, isUploadedFile } from "@/lib/uploads";

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get("category");

  const projects = await prisma.project.findMany({
    where: category ? { categories: { some: { name: category } } } : undefined,
    include: { categories: true },
    orderBy: [{ order: "asc" }, { year: "desc" }],
  });

  return NextResponse.json(projects);
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await request.formData();
  const title = String(form.get("title") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const youtubeUrl = String(form.get("youtubeUrl") ?? "").trim();
  const client = String(form.get("client") ?? "").trim() || null;
  const role = String(form.get("role") ?? "").trim() || null;
  const year = Number(form.get("year"));
  const categoryNames = form.getAll("categories").map(String).filter(Boolean);
  const thumbnailFile = form.get("thumbnail");

  if (!title || !description || !youtubeUrl || !year || categoryNames.length === 0) {
    return NextResponse.json(
      { error: "Title, description, YouTube link, year and at least one category are required." },
      { status: 400 }
    );
  }
  if (!isUploadedFile(thumbnailFile) || thumbnailFile.size === 0) {
    return NextResponse.json({ error: "A thumbnail image is required." }, { status: 400 });
  }

  const thumbnail = await saveThumbnail(thumbnailFile);

  const baseSlug = slugify(title);
  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.project.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${++suffix}`;
  }

  const project = await prisma.project.create({
    data: {
      title,
      slug,
      description,
      youtubeUrl,
      thumbnail,
      client,
      role,
      year,
      categories: {
        connectOrCreate: categoryNames.map((name) => ({
          where: { name },
          create: { name },
        })),
      },
    },
    include: { categories: true },
  });

  return NextResponse.json(project, { status: 201 });
}
