"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

const testimonials = [
  {
    name: "Rajesh Sharma",
    location: "USA",
    image: "👨‍💼",
    text: "I was worried about my parents' health while working abroad. Sewa-Setu made it so easy to book their checkups. They got priority service and I received the report within hours!",
    rating: 5,
  },
  {
    name: "Priya Poudel",
    location: "UK",
    image: "👩‍💼",
    text: "The entire process was so smooth. From searching hospitals to payment and receiving reports - everything was transparent and secure. Highly recommended!",
    rating: 5,
  },
  {
    name: "Amit Yadav",
    location: "Australia",
    image: "👨‍⚕️",
    text: "Best service for healthcare needs back home. The hospital staff was professional and the digital reports were comprehensive. My family is very satisfied.",
    rating: 5,
  },
];

export function TestimonialsSection() {
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((current + 1) % testimonials.length);
  const prev = () => setCurrent((current - 1 + testimonials.length) % testimonials.length);

  const testimonial = testimonials[current];

  return (
    <section className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            What Families Say
          </h2>
          <p className="text-lg text-slate-600">
            Real stories from people who trust Sewa-Setu for their family's health
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 md:p-12 mb-8">
            <div className="flex gap-1 mb-6">
              {[...Array(testimonial.rating)].map((_, i) => (
                <Star
                  key={i}
                  className="h-5 w-5 fill-yellow-400 text-yellow-400"
                />
              ))}
            </div>

            <p className="text-lg md:text-xl text-slate-700 mb-8 leading-relaxed italic">
              "{testimonial.text}"
            </p>

            <div className="flex items-center gap-4">
              <div className="text-4xl">{testimonial.image}</div>
              <div>
                <p className="font-semibold text-slate-900 text-lg">
                  {testimonial.name}
                </p>
                <p className="text-slate-600">{testimonial.location}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={prev}
              className="p-2 rounded-full bg-slate-100 hover:bg-blue-600 hover:text-white transition-all"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-2 w-2 rounded-full transition-all ${
                    i === current ? "bg-blue-600 w-8" : "bg-slate-300"
                  }`}
                  aria-label={`Go to testimonial ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={next}
              className="p-2 rounded-full bg-slate-100 hover:bg-blue-600 hover:text-white transition-all"
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
