import { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata(
  "Free Wedding Guest List Manager - RSVP Tracking & Seating Charts",
  "Organize your wedding guests effortlessly. Track RSVPs, manage dietary preferences, create seating arrangements, and send digital invites — all in one powerful tool.",
  {
    path: "/wedding-guest-list-manager",
    keywords: [
      "wedding guest list",
      "guest list manager",
      "RSVP tracking",
      "wedding planning tool",
      "seating chart maker",
      "guest management",
      "wedding invitation tracker",
      "dietary preferences tracker",
      "wedding guest organizer",
      "free guest list tool",
    ],
  }
);

export default function WeddingGuestListManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
