"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "How does Sewa-Setu work?",
    answer:
      "Simply search for hospitals, select a checkup package, complete the booking and secure payment online. Your family member visits the hospital, and you receive digital reports instantly.",
  },
  {
    question: "Is it safe to pay online?",
    answer:
      "Yes, we use Stripe, a trusted payment processor used by millions worldwide. Your payment information is encrypted and secure. We never store your card details.",
  },
  {
    question: "Can I book for multiple family members?",
    answer:
      "Yes! You can book multiple checkups for different family members. Simply create separate bookings for each person or contact our support team for bulk bookings.",
  },
  {
    question: "What if I need to reschedule?",
    answer:
      "You can reschedule appointments up to 48 hours before the scheduled date through your booking. For urgent changes, contact our support team immediately.",
  },
  {
    question: "How do I get my test reports?",
    answer:
      "Test reports are sent digitally to your registered email within 24-48 hours of the checkup. You can also access them through your account dashboard anytime.",
  },
  {
    question: "Which hospitals are available?",
    answer:
      "We're partnered with 50+ top-rated hospitals across Nepal including Kathmandu, Pokhara, and Lalitpur. Use the search to find hospitals in your preferred location.",
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-24 bg-white">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-[#0f1e38] mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-[#0f1e38]/70">
            Find answers to common questions about Sewa-Setu
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-[#f7f4ef] rounded-xl border border-[#0f1e38]/10 overflow-hidden hover:border-[#c8a96e] transition-all"
            >
              <button
                onClick={() =>
                  setOpenIndex(openIndex === index ? null : index)
                }
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[#c8a96e]/10 transition-colors"
              >
                <h3 className="font-semibold text-[#0f1e38] text-lg">
                  {faq.question}
                </h3>
                <ChevronDown
                  className={`h-5 w-5 text-[#c8a96e] flex-shrink-0 transition-transform duration-300 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>

              {openIndex === index && (
                <div className="px-6 py-4 border-t border-[#c8a96e]/20 bg-[#c8a96e]/10">
                  <p className="text-[#0f1e38]/80 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-[#0f1e38]/60 mb-4">Still have questions?</p>
          <a
            href="mailto:support@sewasetu.com"
            className="inline-flex items-center px-6 py-3 bg-[#0f1e38] text-[#c8a96e] font-semibold rounded-lg hover:bg-[#1a3059] transition-colors shadow-md"
          >
            Contact Support
          </a>
        </div>
      </div>
    </section>
  );
}
