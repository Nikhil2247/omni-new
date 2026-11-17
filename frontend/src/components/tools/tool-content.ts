import type { ToolKey } from '@/components/home/content'

export interface ToolContent {
  name: string
  tagline: string
  description: string
  /** Short label shown on the "More tools" cards. */
  badge: string
  features: Array<{ title: string; text: string }>
  steps: Array<{ title: string; text: string }>
  faqs: Array<{ question: string; answer: string }>
}

/** Doodle icon paths used for the four feature cards on every tool page (48x48 box). */
export const FEATURE_ICONS = [
  '<path d="M24 6l5.5 11.5L42 19l-9 8.8 2.2 12.7L24 34.6 12.8 40.5 15 27.8 6 19l12.5-1.5z"/>',
  '<path d="M6 40V8M6 40h36M12 32l9-9 7 6 12-15"/>',
  '<path d="M6 10h36v24H22l-9 8v-8H6z"/>',
  '<rect x="14" y="4" width="20" height="40" rx="4"/><path d="M22 38h4"/>',
]

/** Copy for each planning tool page: hero, features, steps and FAQs. */
export const TOOL_CONTENT: Record<ToolKey, ToolContent> = {
  "budget": {
    "name": "Event Budget Calculator",
    "tagline": "Track every rupee with confidence",
    "description": "Plan smarter with our free budget calculator. Set spending limits, track payments by category, and stay on top of your finances.",
    "badge": "Track spending",
    "features": [
      {
        "title": "Category Breakdown",
        "text": "Organize expenses by venue, catering, decor, photography and more with visual charts."
      },
      {
        "title": "Real-time Tracking",
        "text": "Track every payment as it happens. See remaining balances instantly."
      },
      {
        "title": "Progress Dashboard",
        "text": "Visual progress bars show budget utilization across all categories."
      },
      {
        "title": "Cost Estimation",
        "text": "Get smart suggestions based on your event type and guest count."
      }
    ],
    "steps": [
      {
        "title": "Set Your Budget",
        "text": "Enter your total event budget and allocate funds across categories."
      },
      {
        "title": "Add Expenses",
        "text": "Track vendor quotes, deposits, and payments in one place."
      },
      {
        "title": "Monitor Spending",
        "text": "Watch your budget in real-time and adjust as needed."
      }
    ],
    "faqs": [
      {
        "question": "Is the budget calculator free?",
        "answer": "Yes, our budget calculator is completely free. Create an account to save your budgets and access them anytime."
      },
      {
        "question": "Can I use this for any event?",
        "answer": "Absolutely! While we have templates for weddings, our calculator works for corporate events, parties, and more."
      },
      {
        "question": "How do I share my budget?",
        "answer": "Create a free account and invite your partner or planner to collaborate in real-time."
      },
      {
        "question": "Can I export my budget?",
        "answer": "Yes, download your budget as PDF or Excel for easy sharing with vendors."
      }
    ]
  },
  "checklist": {
    "name": "Event Checklist Tool",
    "tagline": "Never miss a planning task",
    "description": "Stay organized with our smart event checklist. Get pre-built templates, automatic scheduling based on your event date, deadline reminders, and collaborative task management.",
    "badge": "Stay organized",
    "features": [
      {
        "title": "Smart Scheduling",
        "text": "Tasks automatically adjust based on your event date. See what needs to be done this week."
      },
      {
        "title": "Pre-built Templates",
        "text": "Start with expert-designed templates for weddings, corporate events, or parties."
      },
      {
        "title": "Progress Tracking",
        "text": "Visualize your planning progress with beautiful dashboards and completion metrics."
      },
      {
        "title": "Task Assignment",
        "text": "Delegate tasks to your partner, family, or wedding party with clear deadlines."
      }
    ],
    "steps": [
      {
        "title": "Choose Your Template",
        "text": "Select from wedding, engagement, or corporate event templates with expert-recommended tasks."
      },
      {
        "title": "Set Your Event Date",
        "text": "Enter your event date and watch tasks automatically schedule themselves."
      },
      {
        "title": "Customize Your List",
        "text": "Add, remove, or modify tasks. Assign to team members and set priorities."
      },
      {
        "title": "Track & Complete",
        "text": "Check off tasks as you complete them. Get reminders and celebrate milestones."
      }
    ],
    "faqs": [
      {
        "question": "Is the event checklist tool free?",
        "answer": "Yes, our checklist tool is free with unlimited tasks. Premium features like task assignments and file attachments are available with a free Omnicassion account."
      },
      {
        "question": "What templates are available?",
        "answer": "We offer templates for weddings (12-month, 6-month, 3-month timelines), engagements, corporate events, birthday parties, baby showers, and more."
      },
      {
        "question": "Can I share the checklist with my partner?",
        "answer": "Absolutely! Invite your partner, family members, or wedding party to collaborate and check off completed items."
      },
      {
        "question": "How do deadline reminders work?",
        "answer": "Set reminders for any task — one week before, three days before, or on the due date. Receive notifications via email or push notification."
      },
      {
        "question": "Does it sync with my calendar?",
        "answer": "You can export tasks to Google Calendar, Apple Calendar, or Outlook. Important deadlines appear alongside your regular schedule."
      }
    ]
  },
  "timeline": {
    "name": "Event Timeline Generator",
    "tagline": "Keep your big day running smoothly",
    "description": "Create detailed day-of schedules for your wedding or event. Organize every moment, share with vendors, and ensure everyone knows exactly where to be and when.",
    "badge": "Minute by minute",
    "features": [
      {
        "title": "Visual Timeline",
        "text": "Drag and drop events into place. See your entire day at a glance with intuitive visual scheduling."
      },
      {
        "title": "Multiple Events",
        "text": "Create parallel timelines for wedding party, vendors, and guests to keep everyone coordinated."
      },
      {
        "title": "Share with Vendors",
        "text": "Send timeline links to photographers, caterers, and coordinators with relevant portions visible."
      },
      {
        "title": "Mobile Access",
        "text": "Access your timeline from any device on the big day. Update in real-time from your phone."
      }
    ],
    "steps": [
      {
        "title": "Start with a Template",
        "text": "Choose from wedding ceremony, reception, sangeet, or custom event templates."
      },
      {
        "title": "Add Your Events",
        "text": "Add events with start times, durations, and descriptions for each moment."
      },
      {
        "title": "Assign to Groups",
        "text": "Specify who needs to be where - bride's side, groom's side, vendors."
      },
      {
        "title": "Share & Execute",
        "text": "Share the timeline with everyone and track progress on the big day."
      }
    ],
    "faqs": [
      {
        "question": "Is the timeline generator free?",
        "answer": "Yes, our basic timeline generator is completely free. Premium features like multiple tracks and mobile notifications are available with a free Omnicassion account."
      },
      {
        "question": "Can I create timelines for multiple events?",
        "answer": "Absolutely! Create separate timelines for your sangeet, mehendi, wedding ceremony, reception, or any combination of events."
      },
      {
        "question": "How do I share the timeline with my vendors?",
        "answer": "Generate a unique link for each vendor showing only the portions relevant to them. The photographer sees photo moments, the caterer sees meal times."
      },
      {
        "question": "Can vendors update the timeline?",
        "answer": "You control who can edit. Share view-only links with most vendors, but give edit access to your coordinator if needed."
      },
      {
        "question": "What if timing changes on the day?",
        "answer": "Update the timeline in real-time from your phone. Everyone with access sees the changes instantly."
      }
    ]
  },
  "guests": {
    "name": "Wedding Guest List Manager",
    "tagline": "Organize guests, track RSVPs, stress less",
    "description": "The easiest way to manage your wedding guest list. Track RSVPs, collect dietary preferences, plan seating arrangements, and keep everyone informed.",
    "badge": "Track RSVPs",
    "features": [
      {
        "title": "RSVP Tracking",
        "text": "Send digital invitations and track responses in real-time. Know exactly who's coming."
      },
      {
        "title": "Guest Groups",
        "text": "Organize guests by family, friends, colleagues, or custom groups for easy management."
      },
      {
        "title": "Dietary Preferences",
        "text": "Collect and organize dietary requirements, allergies, and meal preferences."
      },
      {
        "title": "Seating Charts",
        "text": "Create beautiful seating arrangements with drag-and-drop simplicity."
      }
    ],
    "steps": [
      {
        "title": "Import or Add Guests",
        "text": "Start fresh or import from a spreadsheet. Organize guests into groups."
      },
      {
        "title": "Send Invitations",
        "text": "Create beautiful digital invitations and track opens automatically."
      },
      {
        "title": "Track RSVPs",
        "text": "Watch responses roll in with dietary requirements and plus-ones."
      },
      {
        "title": "Plan Seating",
        "text": "Use our visual seating chart tool to arrange tables perfectly."
      }
    ],
    "faqs": [
      {
        "question": "Is the guest list manager free?",
        "answer": "Yes, our basic guest list manager is free with unlimited guests. Premium features like digital invitations and seating charts are available with a free Omnicassion account."
      },
      {
        "question": "Can guests RSVP without creating an account?",
        "answer": "Absolutely! Guests receive a unique link to RSVP. They can confirm attendance, add dietary preferences, and include plus-ones without signing up."
      },
      {
        "question": "How do I import my existing guest list?",
        "answer": "You can import guests from Excel, Google Sheets, or CSV files. Our system will automatically map columns and help you organize guests."
      },
      {
        "question": "Can multiple people manage the guest list?",
        "answer": "Yes! Invite your partner, family members, or wedding planner to collaborate in real-time."
      },
      {
        "question": "Does it work for events other than weddings?",
        "answer": "Definitely! Our guest list manager works great for any event — corporate gatherings, parties, reunions, and more."
      }
    ]
  },
  "rsvp": {
    "name": "RSVP Manager",
    "tagline": "Track every response, effortlessly",
    "description": "Send beautiful digital invitations and collect RSVPs in real-time. Track responses, manage plus-ones, collect dietary preferences, and send automatic reminders.",
    "badge": "Real-time replies",
    "features": [
      {
        "title": "Digital Invitations",
        "text": "Send beautiful digital invites via email, WhatsApp, or SMS. Track opens and delivery status."
      },
      {
        "title": "One-Click RSVP",
        "text": "Guests respond with a single click. No accounts needed - just confirm or decline instantly."
      },
      {
        "title": "Auto Reminders",
        "text": "Send friendly reminders to guests who haven't responded. Schedule them automatically."
      },
      {
        "title": "Real-time Tracking",
        "text": "Watch RSVPs roll in with live dashboards. Track dietary requirements and preferences too."
      }
    ],
    "steps": [
      {
        "title": "Create Your Invitation",
        "text": "Choose from beautiful templates or design your own. Add event details and photos."
      },
      {
        "title": "Add Your Guests",
        "text": "Import your guest list or add names manually. Group guests by family or friends."
      },
      {
        "title": "Send Invitations",
        "text": "Send via email, WhatsApp, or generate QR codes. Each guest gets a unique RSVP link."
      },
      {
        "title": "Track Responses",
        "text": "Watch RSVPs come in real-time. Send reminders and export reports when needed."
      }
    ],
    "faqs": [
      {
        "question": "Is the RSVP manager free?",
        "answer": "Yes, our RSVP manager is free for up to 50 guests. Unlimited guests and premium features like WhatsApp integration are available with a paid plan."
      },
      {
        "question": "Do guests need to create an account to RSVP?",
        "answer": "No! Guests receive a unique link and can RSVP with a single click. They can add dietary preferences, plus-ones, and messages without signing up."
      },
      {
        "question": "Can I customize the invitation design?",
        "answer": "Absolutely! Choose from dozens of beautiful templates, customize colors, add photos, and personalize the text to match your event theme."
      },
      {
        "question": "How do automatic reminders work?",
        "answer": "Set reminders to go out automatically to guests who haven't responded. Choose how many days before your deadline and customize the message."
      },
      {
        "question": "Can I send invitations via WhatsApp?",
        "answer": "Yes! Generate shareable links or QR codes that guests can access via WhatsApp, SMS, or any messaging app."
      }
    ]
  },
  "invite": {
    "name": "Digital Invite Generator",
    "tagline": "Create stunning invitations in minutes",
    "description": "Design beautiful digital invitations for your wedding, engagement, or any celebration. Choose from stunning templates, customize every detail, and share instantly.",
    "badge": "Share anywhere",
    "features": [
      {
        "title": "Beautiful Templates",
        "text": "Choose from hundreds of stunning templates for weddings, engagements, and parties."
      },
      {
        "title": "Easy Customization",
        "text": "Change colors, fonts, photos, and text with simple click-and-edit tools."
      },
      {
        "title": "Photo Integration",
        "text": "Add your engagement photos or venue images. Create personalized invitations."
      },
      {
        "title": "Instant Sharing",
        "text": "Share via WhatsApp, email, SMS, or social media. Generate QR codes too."
      }
    ],
    "steps": [
      {
        "title": "Choose Your Template",
        "text": "Browse our library of beautiful templates. Filter by event type or color scheme."
      },
      {
        "title": "Customize Your Design",
        "text": "Add your names, event details, and photos. Adjust colors and fonts to match your style."
      },
      {
        "title": "Preview & Perfect",
        "text": "See exactly how your invitation will look on different devices before sharing."
      },
      {
        "title": "Share with Guests",
        "text": "Send directly via WhatsApp or email, or download to share however you like."
      }
    ],
    "faqs": [
      {
        "question": "Is the digital invite generator free?",
        "answer": "Yes, you can create and share basic invitations for free. Premium templates and watermark-free downloads are available with a free Omnicassion account."
      },
      {
        "question": "Can I create invitations in multiple languages?",
        "answer": "Absolutely! Our templates support multiple Indian languages including Hindi, Tamil, Telugu, Marathi, Bengali, and more."
      },
      {
        "question": "How do I share the invitation on WhatsApp?",
        "answer": "Generate a shareable link or download as an image. Both work perfectly on WhatsApp. You can also create QR codes for easy scanning."
      },
      {
        "question": "Can I add music or animation to my invite?",
        "answer": "Yes! Premium invitations can include background music, animated elements, and interactive features to make your invitation memorable."
      },
      {
        "question": "Do you offer matching save-the-dates?",
        "answer": "Yes! Each template collection includes matching save-the-dates, invitations, RSVP cards, and thank you notes for a cohesive look."
      }
    ]
  }
}
