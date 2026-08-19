import type { ReactNode } from "react";
import { FaqSection, type FaqItem } from "@/components/seo/faq-section";

export function ToolSeoContent({
  aboutTitle,
  about,
  howToTitle,
  howTo,
  faqItems,
}: {
  aboutTitle: string;
  about: ReactNode;
  howToTitle: string;
  howTo: ReactNode;
  faqItems: FaqItem[];
}) {
  return (
    <section className="flex flex-col gap-8 border-t pt-6">
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">{aboutTitle}</h2>
        <div className="flex flex-col gap-3 text-sm text-muted-foreground [&_a]:underline [&_a]:underline-offset-2 [&_strong]:font-medium [&_strong]:text-foreground">
          {about}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">{howToTitle}</h2>
        <div className="flex flex-col gap-3 text-sm text-muted-foreground">{howTo}</div>
      </div>
      <FaqSection title="Frequently asked questions" items={faqItems} />
    </section>
  );
}
