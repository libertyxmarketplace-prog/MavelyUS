import React from "react";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const DEFAULT_ITEMS = [
  {
    id: "trial",
    question: "Is there a free trial?",
    answer:
      "Yes. Every paid plan starts with a 14-day trial with all features included. No card is needed to start.",
  },
  {
    id: "change-plan",
    question: "Can I change plans later?",
    answer:
      "You can upgrade or downgrade at any time from your account settings. Changes apply from the next billing period.",
  },
  {
    id: "team",
    question: "How do I invite my team?",
    answer:
      "Open the workspace settings and add people by Discord role or ID. They get instant access to your server dashboard.",
  },
  {
    id: "data",
    question: "Where is my data stored?",
    answer:
      "Your data and tokens are encrypted in transit and at rest, and backed up daily. You can export your bot configurations at any time.",
  },
  {
    id: "cancel",
    question: "What happens if I cancel?",
    answer:
      "Your workspace stays available until the end of the billing period. After that it switches to the free tier and nothing is deleted.",
  },
  {
    id: "support",
    question: "Do you offer support?",
    answer:
      "All plans include help via our official Discord community. Pro and Enterprise communities receive priority queueing.",
  },
];

const DEFAULT_FOOTER = (
  <>
    Still have questions?{" "}
    <a
      href="https://discord.gg/UCqXrvHFqh"
      target="_blank"
      rel="noreferrer"
      className="text-white focus-visible:ring-ring/50 rounded font-medium underline underline-offset-4 outline-none hover:text-emerald-400 focus-visible:ring-[3px]"
    >
      Contact us on Discord
    </a>
  </>
);

export function Faq({
  className = "",
  eyebrow = "FAQ",
  title = "Frequently asked questions",
  description = "Answers to the questions we hear most. Cannot find what you are looking for? Reach out.",
  items = DEFAULT_ITEMS,
  layout = "split",
  type = "single",
  defaultValue,
  footer = DEFAULT_FOOTER,
  ...props
}) {
  const split = layout === "split";
  const hasHeader =
    eyebrow != null || title != null || description != null || footer != null;

  const entries = items.map((item, index) => (
    <AccordionItem
      key={item.id ?? index}
      value={item.id ?? `item-${index}`}
      data-slot="faq-item"
    >
      <AccordionTrigger data-slot="faq-question" className="text-base text-zinc-200 hover:text-white">
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
      className={cn("py-16 sm:py-24", className)}
      {...props}
    >
      <div
        data-slot="faq-container"
        className={cn(
          "mx-auto w-full max-w-6xl px-4 sm:px-6",
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
                className="text-zinc-400 text-sm font-semibold tracking-wider uppercase"
              >
                {eyebrow}
              </p>
            ) : null}
            {title != null ? (
              <h2
                data-slot="faq-title"
                className={cn(
                  "text-3xl font-bold tracking-tight text-white sm:text-4xl",
                  eyebrow != null && "mt-2",
                )}
              >
                {title}
              </h2>
            ) : null}
            {description != null ? (
              <p
                data-slot="faq-description"
                className="text-zinc-400 mt-4 text-base leading-relaxed"
              >
                {description}
              </p>
            ) : null}
            {footer != null ? (
              <p
                data-slot="faq-footer"
                className="text-zinc-400 mt-6 text-sm"
              >
                {footer}
              </p>
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

export default Faq;
