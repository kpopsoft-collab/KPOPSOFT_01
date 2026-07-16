import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Section } from "@/components/layout/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { eduFaqs, eduSectionId, type FaqCategory } from "@/lib/education-content";

const categories: FaqCategory[] = ["개인 프로그램", "기업 교육"];

/**
 * SECTION 13 — FAQ (docs §18).
 *
 * Built on the same `@base-ui/react/accordion` primitive the shared
 * `ui/accordion.tsx` wraps — `aria-expanded`/`aria-controls` and Enter/Space
 * toggling come for free from the primitive (§18 접근성, §31). The accordion
 * value is an array by design, so multiple questions can stay open at once
 * without extra wiring (§18 "한 번에 여러 항목 펼침 가능"). Styling here goes
 * beyond the compact shared wrapper defaults to match §18's explicit spec:
 * wide spacing, a large section title, one-line questions, a hairline
 * divider, and a generously sized full-row trigger for the 44px touch target
 * (§31).
 */
export function Faq() {
  if (eduFaqs.length === 0) return null;

  return (
    <Section id={eduSectionId.faq} className="bg-ivory">
      <div className="mx-auto max-w-[60rem]">
        <Eyebrow dotClassName="bg-brand-blue">FAQ</Eyebrow>
        <h2 className="text-section mt-6 text-ink">자주 묻는 질문</h2>
        <p className="mt-6 max-w-xl text-body-lg text-ink/70">
          교육 신청과 기업 맞춤형 과정에 대해 많이 문의하시는 내용을
          정리했습니다.
        </p>

        <div className="mt-14 flex flex-col gap-12 lg:mt-20">
          {categories.map((category) => {
            const items = eduFaqs.filter((faq) => faq.category === category);
            if (items.length === 0) return null;

            return (
              <div key={category}>
                <h3 className="text-eyebrow text-ink/50">{category}</h3>
                <Accordion className="mt-4 border-t border-ink/10">
                  {items.map((faq) => (
                    <AccordionItem
                      key={faq.id}
                      value={faq.id}
                      className="border-b border-ink/10"
                    >
                      <AccordionTrigger className="group/faq gap-6 rounded-none border-none py-6 text-left no-underline hover:no-underline focus-visible:ring-3 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory md:py-7">
                        <span className="text-lg font-bold text-ink md:text-xl">
                          {faq.question}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-7 text-base leading-relaxed text-ink/70 md:text-lg">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
