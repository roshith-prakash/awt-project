import { useEffect } from "react";

const faqs = [
  {
    question: "What is Quizzer AI?",
    answer:
      "Quizzer AI is a smart quiz creation platform that lets you quickly generate flashcards, MCQs, and factual questions—powered by AI to make learning fast, fun, and effective.",
  },
  {
    question: "Who can use it?",
    answer:
      "Quizzer AI is perfect for students, teachers, lifelong learners, or anyone who enjoys structured and gamified learning experiences.",
  },
  {
    question: "How does the AI work?",
    answer:
      "Quizzer AI uses advanced models like Gemini AI to instantly generate high-quality questions, flashcards, and summaries—tailored to your input and learning style.",
  },
  {
    question: "What kinds of quizzes can I create?",
    answer:
      "You can create flashcards, multiple-choice questions (MCQs), and direct-answer factual quizzes from topics, notes, or documents.",
  },
  {
    question: "Is it mobile-friendly?",
    answer:
      "Absolutely. Quizzer AI is fully responsive and works smoothly on phones, tablets, and desktops.",
  },
  {
    question: "Is it free to use?",
    answer:
      "Yes! Quizzer AI is currently free, with generous daily credits to get you started.",
  },
  {
    question: "Any future plans?",
    answer:
      "There's a few interesting things in the works. Keep using Quizzer AI to know more.",
  },
];

const FaqSection = () => {
  // Set window title.
  useEffect(() => {
    document.title = `FAQ | Quizzer AI`;
  }, []);

  return (
    <section className="max-w-4xl mx-auto px-4 py-10">
      <h2 className="text-3xl font-bold text-center mb-8">
        Frequently Asked Questions
      </h2>
      <div className="space-y-6">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="bg-white dark:bg-white/5 shadow-md rounded-2xl p-6"
          >
            <h3 className="text-xl font-semibold mb-2">{faq.question}</h3>
            <p>{faq.answer}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FaqSection;
