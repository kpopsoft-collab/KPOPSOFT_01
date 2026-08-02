import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Section } from "@/components/layout/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { type FaqItem, eduSectionId } from "@/lib/education-content";

/**
 * SECTION 08 — FAQ (docs/KPOPSOFT_Education_Page_ver3.md §08).
 *
 * ver3에서 개인/기업 카테고리 분리를 없애고 단일 목록 4문항으로 압축했다.
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
export function Faq({ faqs }: { faqs: FaqItem[] }) {
  if (faqs.length === 0) return null;

  return (
    <Section id={eduSectionId.faq} className="bg-ivory">
      <div className="mx-auto max-w-[60rem]">
        <Eyebrow dotClassName="bg-brand-blue">자주 묻는 질문</Eyebrow>
        <h2 className="text-section mt-6 text-ink">자주 묻는 질문</h2>
        <p className="mt-6 max-w-xl text-body-lg text-ink/70">
          궁금한 점이 있으신가요?
        </p>

        <Accordion className="mt-14 border-t border-ink/10 lg:mt-20">
          {faqs.map((faq) => (
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
    </Section>
  );
}
