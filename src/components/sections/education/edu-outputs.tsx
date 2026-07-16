import { Section } from "@/components/layout/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { CoverVisual } from "@/components/ui/cover-visual";
import {
  ImageLightbox,
  ImageLightboxContent,
  ImageLightboxTrigger,
} from "@/components/ui/image-lightbox";
import { eduOutputs, eduSectionId, type EduOutput } from "@/lib/education-content";
import { cn } from "@/lib/utils";

/**
 * SECTION 05 — 교육 결과물 (docs §10).
 *
 * Asymmetric editorial grid on desktop: the first (featured) output takes a
 * tall left column, the remaining three stack in a narrower right column
 * (docs §10 layout diagram). Mobile recomposes to a single column, image
 * first (§29). Cards with a registered photo open an `ImageLightbox`
 * (Escape/outside-press/focus-trap via the base-ui Dialog primitive, §10);
 * cards still on the brand-shape Placeholder (§25) stay static since there's
 * nothing to zoom into yet — the structure is ready for real result photos
 * once they're uploaded through the admin.
 */
export function EduOutputs() {
  if (eduOutputs.length === 0) return null;

  const [featured, ...rest] = eduOutputs;

  return (
    <Section id={eduSectionId.outputs} className="bg-ivory">
      <div className="max-w-2xl">
        <Eyebrow dotClassName="bg-brand-red">LEARNING OUTPUTS</Eyebrow>
        <h2 className="text-section mt-6 text-ink">
          수강생이 직접 만든
          <br />
          작동하는 결과입니다.
        </h2>
        <p className="mt-6 max-w-xl text-body-lg text-ink/70">
          교육은 설명을 듣는 것으로 끝나지 않습니다. 자신의 업무와 아이디어를
          바탕으로 직접 사용할 수 있는 결과물을 완성합니다.
        </p>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-5 lg:mt-20 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <OutputCard output={featured} featured />
        </div>
        <div className="flex flex-col gap-5 lg:col-span-5">
          {rest.map((output) => (
            <OutputCard key={output.title} output={output} />
          ))}
        </div>
      </div>
    </Section>
  );
}

function OutputCard({
  output,
  featured = false,
}: {
  output: EduOutput;
  featured?: boolean;
}) {
  const body = (
    <>
      <CoverVisual
        accent={output.accent}
        imageUrl={output.image?.src}
        alt={output.image?.alt ?? ""}
        ratio={featured ? "4/3" : "16/9"}
        sizes={
          featured
            ? "(max-width: 1024px) 100vw, 58vw"
            : "(max-width: 1024px) 100vw, 42vw"
        }
        className="rounded-none [&_img]:transition-transform [&_img]:duration-300 group-hover:[&_img]:scale-[1.03]"
      />
      <div className="flex flex-col gap-1.5 p-6">
        <span className="text-eyebrow text-ink/50">{output.categoryLabel}</span>
        <h3 className="text-lg font-extrabold tracking-tight text-ink">
          {output.title}
        </h3>
        <p className="text-sm text-ink/70">{output.description}</p>
      </div>
    </>
  );

  const cardClass = cn(
    "group flex h-full flex-col overflow-hidden rounded-3xl bg-white text-left",
    featured && "lg:h-full",
  );

  if (!output.image) {
    return <article className={cardClass}>{body}</article>;
  }

  return (
    <ImageLightbox>
      <ImageLightboxTrigger
        className={cn(
          cardClass,
          "transition-transform duration-200 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory",
        )}
        aria-label={`${output.title} 이미지 확대 보기`}
      >
        {body}
      </ImageLightboxTrigger>
      <ImageLightboxContent
        src={output.image.src}
        alt={output.image.alt}
        caption={output.image.caption ?? output.caption}
      />
    </ImageLightbox>
  );
}
