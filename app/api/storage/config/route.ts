import { NextResponse } from "next/server";

export async function GET() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;
  const cloudinary = cloudName && uploadPreset ? { cloudName, uploadPreset } : undefined;
  return NextResponse.json({ cloudinary });
}

