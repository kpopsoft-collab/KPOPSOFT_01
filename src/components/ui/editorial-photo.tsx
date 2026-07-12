import Image from "next/image";

import type { PhotographyAsset } from "@/lib/photography";
import { cn } from "@/lib/utils";

type EditorialPhotoProps = {
  asset: PhotographyAsset;
  sizes: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
};

export function EditorialPhoto({
  asset,
  sizes,
  className,
  imageClassName,
  priority = false,
}: EditorialPhotoProps) {
  return (
    <figure
      className={cn(
        "relative overflow-hidden rounded-3xl bg-ink/5",
        className,
      )}
    >
      <Image
        src={asset.src}
        alt={asset.alt}
        fill
        sizes={sizes}
        preload={priority}
        className={cn("object-cover", imageClassName)}
        style={{ objectPosition: asset.position ?? "center" }}
      />
    </figure>
  );
}
