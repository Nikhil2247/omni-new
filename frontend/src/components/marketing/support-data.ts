/** Help-centre content shared by the support page and the contact form topics. */
export const SUPPORT_CATEGORIES = [
  {
    id: 'account',
    title: 'Account & Profile',
    description: 'Login issues, account settings, password reset, and profile management.',
  },
  {
    id: 'bookings',
    title: 'Bookings & Events',
    description: 'Help with event planning, bookings, cancellations, and scheduling.',
  },
  {
    id: 'vendors',
    title: 'For Vendors',
    description: 'Listing setup, portfolio management, payments, and vendor account help.',
  },
  {
    id: 'billing',
    title: 'Billing & Payments',
    description: 'Refunds, invoices, payment methods, and subscription queries.',
  },
] as const

export type SupportCategoryId = (typeof SUPPORT_CATEGORIES)[number]['id']

export const SUPPORT_FAQS: Array<{ id: string; category: SupportCategoryId; question: string; answer: string }> = [
  {
    id: 'password-reset',
    category: 'account',
    question: 'How do I reset my password?',
    answer:
      "Go to the login page and click 'Forgot Password'. Enter your registered email address and we'll send you a reset link. The link is valid for 30 minutes.",
  },
  {
    id: 'update-profile',
    category: 'account',
    question: 'How do I update my profile?',
    answer:
      'Log in and navigate to Settings → Profile. You can update your name, contact details, profile photo, and preferences from there.',
  },
  {
    id: 'delete-account',
    category: 'account',
    question: 'How do I delete my account?',
    answer:
      'Go to Settings → Account → Delete Account. Account deletion is permanent and cannot be undone. Your data will be removed within 30 days as per our Privacy Policy. If you have active bookings, please resolve them before deleting.',
  },
  {
    id: 'book-vendor',
    category: 'bookings',
    question: 'How do I book a vendor?',
    answer:
      "Browse vendors on the Discover page or search for a specific category. Open a vendor's profile, review their portfolio and pricing, then click 'Request Quote' or 'Book Now' to initiate contact.",
  },
  {
    id: 'cancel-booking',
    category: 'bookings',
    question: 'Can I cancel a booking?',
    answer:
      "Cancellation policies vary by vendor and are displayed on their listing. Go to My Events → select the booking → Cancel Booking. Refund eligibility will be shown based on the vendor's policy.",
  },
  {
    id: 'event-progress',
    category: 'bookings',
    question: 'How do I track my event progress?',
    answer:
      'Your event dashboard shows all tasks, vendor bookings, guest counts, and timelines in one place. Navigate to My Events and select your event to see the full planning overview.',
  },
  {
    id: 'list-business',
    category: 'vendors',
    question: 'How do I list my business on Omnicassion?',
    answer:
      "Visit our For Vendors page and click 'Get Started'. Complete your business profile, upload portfolio images, set your service categories and pricing, and submit for review. Approval typically takes 1–3 business days.",
  },
  {
    id: 'manage-portfolio',
    category: 'vendors',
    question: 'How do I manage my portfolio?',
    answer:
      'Log in to your vendor account and navigate to Portfolio. You can upload images, add captions, organise galleries, and highlight featured work. High-quality images improve your visibility in search results.',
  },
  {
    id: 'payments',
    category: 'vendors',
    question: 'When do I receive payments as a vendor?',
    answer:
      'Payments are released after successful event completion as confirmed by both parties. Standard payout is within 3–5 business days post-confirmation. Bank details can be added in Settings → Payouts.',
  },
  {
    id: 'refund',
    category: 'billing',
    question: 'How do I request a refund?',
    answer:
      "Refunds are subject to the vendor's cancellation policy. If you are eligible, request a refund through My Events → select the booking → Request Refund. For disputes, contact us at support@omnicassion.com.",
  },
  {
    id: 'payment-methods',
    category: 'billing',
    question: 'What payment methods are supported?',
    answer:
      'We support UPI, credit/debit cards (Visa, Mastercard, RuPay), net banking, and select wallet options. All payments are processed securely through our payment partners.',
  },
  {
    id: 'invoice',
    category: 'billing',
    question: 'Where can I find my invoice?',
    answer:
      'Invoices are available under Settings → Billing → Invoices. You can download PDF versions for any completed transaction. For GST invoices, ensure your GSTIN is entered in your account settings.',
  },
]
