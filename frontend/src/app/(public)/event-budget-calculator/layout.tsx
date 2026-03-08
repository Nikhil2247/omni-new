import { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata(
  "Free Event Budget Calculator - Track Wedding & Party Expenses",
  "Plan your event budget with our free online calculator. Track expenses by category, manage payments, set spending limits, and stay on top of your wedding or party budget.",
  {
    path: "/event-budget-calculator",
    keywords: [
      "event budget calculator",
      "wedding budget planner",
      "party budget tracker",
      "event expense tracker",
      "wedding cost calculator",
      "event planning budget",
      "free budget tool",
      "wedding planning costs",
      "event budget template",
      "budget management tool",
    ],
  }
);

export default function EventBudgetCalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
