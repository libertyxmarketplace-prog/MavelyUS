import React from "react";
import { cn } from "../../lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./accordion";

const DEFAULT_ITEMS = [
  {
    id: "bot-hosting",
    question: "Do I need to keep my computer on to run my bot?",
    answer:
      "No. CivLink hosts your Discord bot 24/7 on dedicated cloud instances. Once you start your bot from the dashboard, it stays online continuously without requiring any desktop software.",
  },
  {
    id: "erlc-key",
    question: "Where do I get my ER:LC Server Key?",
    answer:
      "Inside your Roblox Emergency Response: Liberty County private server, open the Server Settings menu, navigate to 'Remote Server API', and generate a key. Paste it into your CivLink Settings to instantly sync live players, queues, and command relays.",
  },
  {
    id: "custom-branding",
    question: "Can I give the bot my own server's name and custom avatar?",
    answer:
      "Yes. Your bot is 100% your own Discord application. You choose its username, profile avatar, banner, and activity status in the Discord Developer Portal or directly through the Bot Builder.",
  },
  {
    id: "security",
    question: "How are my bot tokens and server keys protected?",
    answer:
      "All sensitive credentials (including Discord bot tokens and PRC API server keys) are encrypted at rest using AES-256-GCM authenticated encryption. We never expose your private keys.",
  },
  {
    id: "melonly-coexist",
    question: "Does CivLink replace Melonly or can I use both?",
    answer:
      "CivLink is designed to bridge with Melonly. You can use your custom CivLink bot for custom server embeds, tickets, and live SSU announcements while continuing to use Melonly for CAD/MDT shifts.",
  },
  {
    id: "slash-commands",
    question: "How fast do slash commands update when I edit them?",
    answer:
      "Slash commands sync directly to your Discord server in real time via Discord REST API v10 as soon as you toggle or edit them in the Command Manager.",
  },
];

export function Faq({
  className,
  eyebrow = "FREQUENTLY ASKED QUESTIONS",
  title = "Everything you need to know about CivLink",
  description = "Common questions regarding bot hosting, ER:LC API keys, and custom Discord commands.",
  items = DEFAULT_ITEMS,
  layout = "split",
  type = "single",
  defaultValue = "bot-hosting",
  footer = null,
  ...props
}) {
  const split = layout === "split";
  const hasHeader = eyebrow != null || title != null || description != null || footer != null;

  const entries = items.map((item, index) => (
    <AccordionItem
      key={item.id ?? index}
      value={item.id ?? `item-${index}`}
    >
      <AccordionTrigger className="text-[15px] font-semibold py-4 text-[#f1f5f9] hover:text-[#38bdf8]">
        {item.question}
      </AccordionTrigger>
      <AccordionContent className="text-[#94a3b8] text-[14px] leading-relaxed pb-4">
        {item.answer}
      </AccordionContent>
    </AccordionItem>
  ));

  const listClassName = cn("w-full", !split && "mx-auto max-w-3xl", !split && hasHeader && "mt-10");

  return (
    <section className={cn("py-20", className)} {...props}>
      <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6", split && "grid gap-12 lg:grid-cols-[1fr_1.8fr]")}>
        {hasHeader && (
          <div className={cn("max-w-xl", !split && "mx-auto text-center")}>
            {eyebrow && (
              <p className="font-mono text-xs font-semibold tracking-wider text-[#38bdf8] uppercase">
                {eyebrow}
              </p>
            )}
            {title && (
              <h2 className="text-3xl font-bold tracking-tight text-white mt-3 sm:text-4xl">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-4 text-[15px] text-[#94a3b8] leading-relaxed">
                {description}
              </p>
            )}
            {footer && (
              <div className="mt-6 text-sm text-[#64748b]">
                {footer}
              </div>
            )}
          </div>
        )}

        <Accordion
          type={type}
          collapsible
          className={listClassName}
          defaultValue={defaultValue}
        >
          {entries}
        </Accordion>
      </div>
    </section>
  );
}

export default Faq;
