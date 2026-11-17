import { Card, PageHeader } from '@/components/ui';
import { FAQ_ITEMS } from '@/data/faq';

export default function HelpPage() {
  return (
    <>
      <PageHeader eyebrow="Help" title="How Clipit works" description="Short answers to the questions people ask most." />
      <div className="grid gap-3">
        {FAQ_ITEMS.map(([q, a]) => (
          <Card key={q} className="p-0">
            <details className="group p-5">
              <summary className="cursor-pointer list-none rounded text-sm font-medium text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50">{q}</summary>
              <p className="mt-3 text-sm text-zinc-400">{a}</p>
            </details>
          </Card>
        ))}
      </div>
    </>
  );
}
