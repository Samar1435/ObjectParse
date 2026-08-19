import { ChevronDown } from "lucide-react";

export interface FaqItem {
  question: string;
  answer: string;
}

export function FaqSection({ title, items }: { title: string; items: FaqItem[] }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <div className="flex flex-col divide-y rounded-lg border">
        {items.map((item) => (
          <details key={item.question} className="group p-4 open:bg-muted/30">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 font-medium marker:content-none">
              {item.question}
              <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-2 text-sm text-muted-foreground">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
