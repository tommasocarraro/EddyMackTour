import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

type UploadedFile = { name: string; size: number; arrayBuffer(): Promise<ArrayBuffer> };

export function isUploadedFile(value: FormDataEntryValue | null): value is File & UploadedFile {
  return (
    typeof value === "object" &&
    value !== null &&
    "arrayBuffer" in value &&
    typeof (value as UploadedFile).arrayBuffer === "function"
  );
}

export async function saveThumbnail(file: UploadedFile): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());

  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "eddy-mack-tour/thumbnails" },
      (error, uploadResult) => {
        if (error || !uploadResult) return reject(error ?? new Error("Cloudinary upload failed"));
        resolve(uploadResult);
      }
    );
    stream.end(buffer);
  });

  return result.secure_url;
}
