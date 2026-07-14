import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { head } from "@vercel/blob";
import { NextResponse } from "next/server";

import { requireAdminAction } from "@/lib/admin/auth";
import { getDb } from "@/lib/db";
import { mediaAssets } from "@/lib/db/schema";
import {
  IMAGE_CONTENT_TYPES,
  isAllowedImagePathname,
  MAX_IMAGE_BYTES,
  validateImageUpload,
} from "@/lib/media/blob";

type UploadTokenPayload = { uploadedBy: string };

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;
  let uploadedBy: string | null = null;

  // Token issuance is an administrator action. The completion webhook is
  // authenticated by handleUpload's signed Blob callback token instead.
  if (body.type === "blob.generate-client-token") {
    uploadedBy = (await requireAdminAction()).id;
  }

  const result = await handleUpload({
    request,
    body,
    onBeforeGenerateToken: async (pathname) => {
      if (!uploadedBy || !isAllowedImagePathname(pathname)) {
        throw new Error("Invalid upload request");
      }
      return {
        allowedContentTypes: [...IMAGE_CONTENT_TYPES],
        maximumSizeInBytes: MAX_IMAGE_BYTES,
        addRandomSuffix: false,
        allowOverwrite: false,
        tokenPayload: JSON.stringify({ uploadedBy } satisfies UploadTokenPayload),
      };
    },
    onUploadCompleted: async ({ blob, tokenPayload }) => {
      const payload = JSON.parse(tokenPayload ?? "null") as UploadTokenPayload | null;
      if (!payload?.uploadedBy || !isAllowedImagePathname(blob.pathname)) {
        throw new Error("Invalid upload callback");
      }

      const metadata = await head(blob.url);
      const validation = validateImageUpload({
        contentType: metadata.contentType,
        size: metadata.size,
      });
      if (!validation.ok) throw new Error("Invalid uploaded image");

      await getDb()
        .insert(mediaAssets)
        .values({
          blobUrl: blob.url,
          pathname: blob.pathname,
          contentType: metadata.contentType,
          sizeBytes: metadata.size,
          uploadedBy: payload.uploadedBy,
        })
        .onConflictDoNothing({ target: mediaAssets.blobUrl });
    },
  });

  return NextResponse.json(result);
}
