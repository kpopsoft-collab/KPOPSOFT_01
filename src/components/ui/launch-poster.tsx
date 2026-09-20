import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * 출시 소식 밴드가 쓰는 액자형 포스터 카드.
 *
 * 채널·스토어에 올린 홍보 카드 원본을 흰 프레임에 넣어 노란 띠(팝터디)와
 * 잉크 띠(다해잡) 어디에 놓아도 같은 무게로 읽히게 한다. 두 밴드가 같은
 * 마크업을 복사해 갖고 있으면 한쪽만 고쳐 어긋나기 쉬워 여기로 모았다.
 *
 * 포스터 제목은 이미지 안에 이미 박혀 있다. 그래서 캡션은 제목을 되풀이하지
 * 않고 이미지에서 확인되는 맥락을 덧붙인다(docs/04-디자인-시스템/10-이미지-방향.md).
 */
const RATIO = {
  /** 1:1 채널 카드 (Instagram·Threads 등). */
  square: { className: "aspect-square", width: 1024, height: 1024 },
  /** 2:3 스토어 소개 포스터. */
  portrait: { className: "aspect-[2/3]", width: 1024, height: 1536 },
} as const;

export type LaunchPosterRatio = keyof typeof RATIO;

export function LaunchPoster({
  src,
  alt,
  label,
  labelClassName,
  caption,
  ratio = "square",
  sizes,
  priority = false,
  className,
}: {
  src: string;
  alt: string;
  /** 학습·기능 갈래 이름. 색은 밴드마다 액센트를 골라 넘긴다. */
  label: string;
  labelClassName?: string;
  caption: string;
  ratio?: LaunchPosterRatio;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  const { className: ratioClass, width, height } = RATIO[ratio];

  return (
    <figure
      className={cn(
        "h-full rounded-2xl border border-ink/15 bg-white p-2.5",
        className,
      )}
    >
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        className={cn("w-full rounded-xl object-cover", ratioClass)}
        priority={priority}
      />
      <figcaption className="px-1.5 pt-3 pb-1">
        <p className={cn("text-xs font-bold tracking-wider", labelClassName)}>
          {label}
        </p>
        <p className="mt-1 text-sm leading-snug font-semibold text-ink">
          {caption}
        </p>
      </figcaption>
    </figure>
  );
}
