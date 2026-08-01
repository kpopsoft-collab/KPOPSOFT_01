import Image from "next/image";

import { Section } from "@/components/layout/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Star, Wave } from "@/components/shapes";
import { eduSectionId, vibedaysRoles } from "@/lib/education-content";
import { accentBg, accentText, type Accent } from "@/lib/site";
import { cn } from "@/lib/utils";

const roleAccents: Accent[] = ["mint", "blue", "coral"];

/**
 * SECTION 06 — VIBEDAYS CLUB (docs §11).
 *
 * The one section where the VIBEDAYS supporting identity gets to lead
 * (§3.2, §22 budget ~20%): three character cards, one per club role,
 * dressed as sticker-like club cards with a small handwritten-style intro
 * line rather than a generic feature grid — "친근하지만 유아적으로 보이지
 * 않게 구성" keeps it to flat color blocks + the existing shape vocabulary,
 * no gradients or bouncy illustration.
 */
export function VibedaysClub() {
  return (
    <Section id={eduSectionId.vibedays} className="relative overflow-hidden">
      <Star
        aria-hidden
        className="pointer-events-none absolute -top-6 right-[8%] hidden size-16 rotate-12 text-brand-yellow md:block"
      />

      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="max-w-2xl">
          <Eyebrow dotClassName="bg-brand-coral">VIBEDAYS CLUB</Eyebrow>
          <h2 className="text-section mt-6 text-ink">
            서로 다른 바이브가 만나,
            <br />
            배우고 만든 날들이 쌓입니다.
          </h2>
          <p className="mt-6 max-w-xl text-body-lg text-ink/70">
            VIBEDAYS CLUB은 서로 다른 경험과 수준을 가진 사람들이 배우고,
            만들고, 자신의 결과를 나누는 KPOPSOFT의 실습형 러닝 커뮤니티입니다.
          </p>
          <p className="mt-4 max-w-xl text-body-lg text-ink/70">
            처음 시작하는 사람도, 직접 만드는 사람도, 경험을 나누는 사람도 각자의
            방식으로 함께 성장합니다.
          </p>
        </div>

        <div className="relative w-full overflow-hidden rounded-3xl">
          <Image
            src="/vibedays_main_01.png"
            alt="VIBEDAYS CLUB 활동 이미지"
            width={822}
            height={500}
            className="h-auto w-full object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3 lg:mt-20">
        {vibedaysRoles.map((role, i) => {
          const accent = roleAccents[i % roleAccents.length];
          return (
            <article
              key={role.name}
              className="relative flex flex-col items-center overflow-hidden rounded-3xl bg-white p-7 text-center"
            >
              <div
                className={cn(
                  "relative flex size-32 items-center justify-center rounded-full",
                  accentBg[accent],
                )}
              >
                <Image
                  src={role.image}
                  alt={`${role.name} 캐릭터 일러스트`}
                  width={96}
                  height={96}
                  className="size-24"
                />
              </div>

              <span
                className={cn(
                  "text-eyebrow mt-6 rounded-full border px-3 py-1.5",
                  accentText[accent],
                  "border-current/30",
                )}
              >
                {role.name}
              </span>
              <p className="mt-4 text-lg font-extrabold text-ink">
                {role.title}
              </p>
              <p className="mt-2 text-sm text-ink/65">{role.description}</p>
            </article>
          );
        })}
      </div>

      <Wave
        aria-hidden
        className="pointer-events-none mx-auto mt-14 w-40 text-brand-mint/60 lg:mt-20"
      />
    </Section>
  );
}
