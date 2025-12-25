'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import Link from 'next/link'

export default function FAQsTwo() {
    const faqItems = [
        {
            id: 'item-1',
            question: 'Does Sona send emails automatically?',
            answer: 'No. Sona follows a "Human-in-the-loop" approach. It creates drafts in your inbox. You always review and hit send, ensuring customers never get a bad AI reply.',
        },
        {
            id: 'item-2',
            question: 'How does the AI know about my products and policies?',
            answer: 'Sona syncs securely with your webshop. It reads your product catalog and policy pages to understand your specific shipping times, return rules, and inventory.',
        },
        {
            id: 'item-3',
            question: 'Do I need technical skills to set it up?',
            answer: 'Not at all. Setup takes less than 2 minutes. Just sign in, connect your webshop, and link your support email (Gmail or Outlook).',
        },
        {
            id: 'item-4',
            question: 'What languages does Sona support?',
            answer: 'Sona is multilingual. It automatically detects the language of the customer\'s email (e.g., Danish, German, French) and drafts the reply in the matching language.',
        },
        {
            id: 'item-5',
            question: 'Is my data safe?',
            answer: 'Yes. We use enterprise-grade encryption. We do not use your customer data to train public AI models. Your data stays yours.',
        },
    ]

  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-balance text-slate-300">
            Discover quick and comprehensive answers to common questions about our platform,
            services, and features.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-xl">
          <Accordion type="single" collapsible className="w-full space-y-3">
            {faqItems.map((item) => (
              <AccordionItem
                key={item.id}
                value={item.id}
                className="rounded-2xl border border-white/10 bg-slate-900/70 px-6 shadow-sm backdrop-blur"
              >
                <AccordionTrigger className="cursor-pointer text-base text-white hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-base text-slate-300">{item.answer}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <p className="mt-6 px-2 text-sm text-slate-400">
            Can't find what you're looking for? Contact our{" "}
            <Link href="#" className="text-cyan-300 font-medium hover:text-cyan-200">
              customer support team
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
