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
    id: "erlc-link",
    question: "How do I connect my ER:LC Private Server to CivLink?",
    answer:
      "Join your Roblox ER:LC private server, open Server Settings from the main menu, and copy your Server-Key. Paste this key into the CivLink Dashboard settings under Roblox Integration. The bot will instantly link to your server's live PRC API telemetry.",
  },
  {
    id: "whitelabel",
    question: "Is this bot fully whitelabel with my community branding?",
    answer:
      "Yes, 100%. CivLink runs your own dedicated Discord bot application token. Your community members will see your server's custom bot name, custom avatar, and custom Rich Presence status.",
  },
  {
    id: "tickets",
    question: "How do support ticket panels and transcripts work?",
    answer:
      "You can design custom embed panels with buttons or category menus (e.g., General Support, Internal Affairs, Staff Inquiries). When clicked, CivLink generates a private ticket channel with role pings, button controls, and exports automatic HTML transcripts upon closing.",
  },
  {
    id: "shifts",
    question: "Can CivLink track staff patrol shifts and radio voice channels?",
    answer:
      "Yes. Staff can clock in using slash commands or Discord message buttons. CivLink monitors on-duty durations, links to live dispatch voice radio channels, and logs patrol statistics for server administration reviews.",
  },
  {
    id: "hosting",
    question: "Is the bot hosted 24/7 or do I need to keep my computer on?",
    answer:
      "CivLink operates a 24/7 cloud runtime with automatic gateway reconnection. Once configured, your bot stays continuously online even when your PC is turned off.",
  },
  {
    id: "support",
    question: "Where can I get help or report bugs?",
    answer:
      "Join our official Discord community for live assistance, feature requests, and server configuration guides from our engineering team.",
  },
];

const DEFAULT_FOOTER = (
  <>
    Still have questions?{" "}
    <a
      href="https://discord.gg/UCqXrvHFqh"
      target="_blank"
      rel="noreferrer"
      className="text-white hover:text-[#2E90FA] font-medium underline underline-offset-4 transition-colors"
    >
      Join our Discord Support
    </a>
  </>
);

export function Faq({
  className = "",
  eyebrow = "FREQUENTLY ASKED QUESTIONS",
  title = "Everything you need to know about CivLink.",
  description = "Common questions regarding Roblox ER:LC server integration, ticket panels, bot tokens, and shift telemetry.",
  items = DEFAULT_ITEMS,
  layout = "stacked",
  type = "single",
  defaultValue = "erlc-link",
  footer = DEFAULT_FOOTER,
  ...props
}) {
  const entries = items.map((item, index) => (
    <AccordionItem
      key={item.id ?? index}
      value={item.id ?? `item-${index}`}
      data-slot="faq-item"
      className="border-b border-white/[0.08]"
    >
      <AccordionTrigger data-slot="faq-question" className="text-sm font-semibold text-zinc-200 hover:text-white py-4.5">
        {item.question}
      </AccordionTrigger>
      <AccordionContent
        data-slot="faq-answer"
        className="text-zinc-400 text-xs sm:text-sm leading-relaxed pb-4"
      >
        {item.answer}
      </AccordionContent>
    </AccordionItem>
  ));

  return (
    <section
      data-slot="faq"
      className={cn("py-16 sm:py-24 px-6 sm:px-12", className)}
      {...props}
    >
      <div className="mx-auto w-full max-w-4xl">
        <div className="text-center mb-12">
          {eyebrow && (
            <p className="text-[#2E90FA] text-xs font-mono font-bold tracking-[0.2em] uppercase mb-2">
              {eyebrow}
            </p>
          )}
          {title && (
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-zinc-400 mt-3 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
              {description}
            </p>
          )}
        </div>

        <Accordion
          type="single"
          collapsible
          className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 sm:p-8"
          defaultValue={defaultValue}
        >
          {entries}
        </Accordion>

        {footer && (
          <div className="text-center text-xs text-zinc-400 mt-8">
            {footer}
          </div>
        )}
      </div>
    </section>
  );
}

export default Faq;
