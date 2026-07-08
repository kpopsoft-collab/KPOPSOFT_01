/**
 * Signature KPOPSOFT call-to-action button (docs/디자인.md §Buttons).
 * - Height 48–54px, generous horizontal padding, fully rounded (pill).
 * - Primary = brand blue on white. Secondary = transparent w/ 1.25px ink border.
 * - Optional arrow nudges right on hover (no bounce), per the motion spec.
 * Renders as a Next <Link> when `href` is passed, otherwise a <button>.
 */
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const ctaVariants = cva(
  "group inline-flex h-13 items-center justify-center gap-2 rounded-full px-7 text-[0.95rem] font-semibold whitespace-nowrap transition-all outline-none focus-visible:ring-3 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-brand-blue text-white hover:bg-brand-navy",
        secondary:
          "border-[1.25px] border-ink/70 text-ink hover:bg-ink hover:text-ivory",
        ivory: "bg-ivory text-ink hover:bg-white",
      },
    },
    defaultVariants: { variant: "primary" },
  },
);

type CtaButtonProps = {
  href?: string;
  arrow?: boolean;
  className?: string;
  children: React.ReactNode;
} & VariantProps<typeof ctaVariants> &
  React.ButtonHTMLAttributes<HTMLButtonElement>;

export function CtaButton({
  href,
  variant,
  arrow = true,
  className,
  children,
  ...props
}: CtaButtonProps) {
  const content = (
    <>
      {children}
      {arrow && (
        <ArrowRight
          className="size-4 transition-transform duration-200 group-hover:translate-x-1"
          aria-hidden
        />
      )}
    </>
  );

  if (href) {
    const external = /^https?:\/\//.test(href);
    return (
      <Link
        href={href}
        className={cn(ctaVariants({ variant }), className)}
        {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      >
        {content}
      </Link>
    );
  }

  return (
    <button className={cn(ctaVariants({ variant }), className)} {...props}>
      {content}
    </button>
  );
}
