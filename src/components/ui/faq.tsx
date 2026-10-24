import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FaqItem {
  /** Used as the React key and the accordion value; falls back to `item-<index>`. */
  id?: string;
  question: ReactNode;
  answer: ReactNode;
}

interface FaqProps extends Omit<
  ComponentProps<"section">,
  "title" | "defaultValue"
> {
  eyebrow?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  items?: FaqItem[];
  /** "split" puts the header on the left and the questions on the right on large screens. */
  layout?: "stacked" | "split";
  /** "single" keeps one answer open at a time; "multiple" lets several stay open. */
  type?: "single" | "multiple";
  /** Item value(s) open on first render: an item's `id`, or `item-<index>`. */
  defaultValue?: string | string[];
  /** Shown under the header, e.g. a link to contact. Pass `null` to hide. */
  footer?: ReactNode;
}

const DEFAULT_ITEMS: FaqItem[] = [
  {
    id: "setup",
    question: "How do I set up my Discord server?",
    answer:
      "Sign in with Discord and open the dashboard. Every server where you have Manage Server permission is listed there, and you can fill in its details and settings.",
  },
  {
    id: "erlc-api",
    question: "Do I need an ER:LC Server Key?",
    answer:
      "For live player counts, queue and join codes, you will need to paste your Emergency Response: Liberty County server API key into your server settings in the dashboard.",
  },
  {
    id: "support",
    question: "Where can I get help or report issues?",
    answer:
      "Join our official Discord community server anytime to speak with our developers, request custom features, or get setup assistance.",
  },
];

const DEFAULT_FOOTER = (
  <div className="text-zinc-400 text-sm">
    Still have questions?{" "}
    <a
      href="/docs"
      className="text-[#2ecc71] hover:underline font-medium outline-none"
    >
      Read the docs
    </a>
  </div>
);

function Faq({
  className,
  eyebrow = "FAQ",
  title = "Frequently asked questions",
  description = "Answers to common questions about configuring Mavely for your ER:LC community.",
  items = DEFAULT_ITEMS,
  layout = "split",
  type = "single",
  defaultValue,
  footer = DEFAULT_FOOTER,
  ...props
}: FaqProps) {
  const split = layout === "split";
  const hasHeader =
    eyebrow != null || title != null || description != null || footer != null;

  const entries = items.map((item, index) => (
    <AccordionItem
      key={item.id ?? index}
      value={item.id ?? `item-${index}`}
      data-slot="faq-item"
    >
      <AccordionTrigger data-slot="faq-question" className="text-base text-left font-medium">
        {item.question}
      </AccordionTrigger>
      <AccordionContent
        data-slot="faq-answer"
        className="text-zinc-400 text-sm leading-relaxed"
      >
        {item.answer}
      </AccordionContent>
    </AccordionItem>
  ));

  const listClassName = cn(
    "w-full",
    !split && "mx-auto max-w-3xl",
    !split && hasHeader && "mt-12",
  );

  return (
    <section
      data-slot="faq"
      data-layout={layout}
      className={cn("py-16 sm:py-24 border-t border-white/[0.06] bg-[#0b0c12] relative overflow-hidden", className)}
      {...props}
    >
      {/* Subtle ambient glow behind FAQ */}
      <div className="pointer-events-none absolute -bottom-24 right-1/4 w-[600px] h-[400px] bg-[radial-gradient(circle,rgba(46,204,113,0.05),transparent_70%)] blur-3xl z-0" />
      <div
        data-slot="faq-container"
        className={cn(
          "mx-auto w-full max-w-6xl px-4 sm:px-8 relative z-10",
          split && "grid gap-12 lg:grid-cols-[1fr_2fr]",
        )}
      >
        {hasHeader ? (
          <div
            data-slot="faq-header"
            className={cn("max-w-2xl", !split && "mx-auto text-center")}
          >
            {eyebrow != null ? (
              <p
                data-slot="faq-eyebrow"
                className="text-xs font-mono font-medium tracking-[0.25em] text-[#2ecc71] uppercase"
              >
                {eyebrow}
              </p>
            ) : null}
            {title != null ? (
              <h2
                data-slot="faq-title"
                className={cn(
                  "font-display text-3xl sm:text-4xl font-bold tracking-tight text-white",
                  eyebrow != null && "mt-2",
                )}
              >
                {title}
              </h2>
            ) : null}
            {description != null ? (
              <p
                data-slot="faq-description"
                className="text-zinc-400 mt-4 text-sm sm:text-base leading-relaxed"
              >
                {description}
              </p>
            ) : null}
            {footer != null ? (
              <div
                data-slot="faq-footer"
                className="mt-6"
              >
                {footer}
              </div>
            ) : null}
          </div>
        ) : null}
        {type === "multiple" ? (
          <Accordion
            type="multiple"
            data-slot="faq-list"
            className={listClassName}
            defaultValue={
              defaultValue === undefined
                ? undefined
                : Array.isArray(defaultValue)
                  ? defaultValue
                  : [defaultValue]
            }
          >
            {entries}
          </Accordion>
        ) : (
          <Accordion
            type="single"
            collapsible
            data-slot="faq-list"
            className={listClassName}
            defaultValue={
              Array.isArray(defaultValue) ? defaultValue[0] : defaultValue
            }
          >
            {entries}
          </Accordion>
        )}
      </div>
    </section>
  );
}

export { Faq, type FaqItem, type FaqProps };
export default Faq;
