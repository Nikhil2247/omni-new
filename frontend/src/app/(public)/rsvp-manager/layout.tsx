import { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata(
  "Free RSVP Manager - Wedding Invitation Tracking & Response Collection",
  "Send beautiful digital invitations and track RSVPs in real-time. Collect meal preferences, plus-ones, and guest messages. Perfect for weddings, parties, and events.",
  {
    path: "/rsvp-manager",
    keywords: [
      "RSVP manager",
      "wedding RSVP tracking",
      "digital invitation",
      "RSVP collector",
      "wedding response tracker",
      "online RSVP",
      "event invitation manager",
      "guest response tracking",
      "wedding planning RSVP",
      "free RSVP tool",
    ],
  }
);

export default function RSVPManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
