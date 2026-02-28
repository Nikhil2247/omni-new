/**
 * Omnicassion Internal Blog Content Generator
 * Generates comprehensive "How to Use Omnicassion" guide blogs
 * covering every user-facing feature of the platform
 *
 * Usage:
 *   npx ts-node scripts/generate-internal-blogs.ts generate-all <authorId> [--save]
 *   npx ts-node scripts/generate-internal-blogs.ts generate <type> <authorId> [--save]
 *   npx ts-node scripts/generate-internal-blogs.ts list
 */

import 'dotenv/config';
import { PrismaClient, BlogStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// ============================================================================
// PRISMA CLIENT FACTORY
// ============================================================================

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL or DIRECT_DATABASE_URL environment variable is required');
  }
  const isAccelerate = connectionString.startsWith('prisma://');
  if (isAccelerate) {
    return new PrismaClient({ log: ['warn', 'error'] });
  }
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter, log: ['warn', 'error'] });
}

// ============================================================================
// INTERFACES
// ============================================================================

interface InternalBlogPost {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  keywords: string[];
  featuredImageAlt: string;
  status: BlogStatus;
  readingTime: number;
  authorId: string;
  categorySlug: string;
  tagSlugs: string[];
}

// ============================================================================
// UTILITIES
// ============================================================================

function calculateReadingTime(content: string): number {
  const text = content.replace(/<[^>]*>/g, ' ');
  const words = text.split(/\s+/).filter(w => w.length > 0).length;
  return Math.ceil(words / 200);
}

function truncate(str: string, max: number): string {
  return str.length <= max ? str : str.substring(0, max - 3) + '...';
}

function sanitize(post: InternalBlogPost): InternalBlogPost {
  return {
    ...post,
    title: truncate(post.title, 200),
    slug: truncate(post.slug, 250),
    excerpt: truncate(post.excerpt, 300),
    metaTitle: truncate(post.metaTitle, 70),
    metaDescription: truncate(post.metaDescription, 160),
    focusKeyword: truncate(post.focusKeyword, 100),
    featuredImageAlt: truncate(post.featuredImageAlt, 125),
  };
}

// ============================================================================
// BLOG 1 — GETTING STARTED WITH OMNICASSION
// ============================================================================

function generateGettingStarted(authorId: string): InternalBlogPost {
  const content = `
<h1>Getting Started with Omnicassion: Your Complete Guide to India's Smartest Event Planning Platform</h1>

<p>Planning a wedding, birthday party, or corporate event in Chandigarh, Mohali, or Panchkula? Omnicassion is the all-in-one event planning platform purpose-built for the Tricity region. From discovering verified vendors to tracking your budget and managing your guest list — everything lives in one place. This guide will walk you through everything you need to know to hit the ground running.</p>

<h2>What is Omnicassion?</h2>
<p>Omnicassion is a hyperlocal event planning ecosystem that connects planners with trusted vendors — photographers, decorators, caterers, venues, makeup artists, DJs, and more — across Chandigarh, Mohali, and Panchkula. Unlike generic directories, Omnicassion gives you a complete suite of planning tools: a smart checklist, budget tracker, guest list manager, event timeline, memories album, AI assistant, and a messaging system — all built for the way real events get planned in India.</p>

<h2>Step 1: Create Your Free Account</h2>
<p>Getting started takes under a minute. Head to <strong>omnicassion.com</strong> and click <strong>Get Started</strong>. You can register with your email or use fast social login. Once registered you will be prompted to complete a quick onboarding flow that personalises the platform for you.</p>
<ul>
  <li>Choose your role: <strong>Event Planner</strong> (for couples, families, corporates)</li>
  <li>Tell us about your upcoming event type — wedding, birthday, corporate, or other</li>
  <li>Set your approximate event date and location within the Tricity</li>
</ul>
<p>After onboarding you land on your personalised <strong>Dashboard</strong> — your command centre for everything that follows.</p>

<h2>Step 2: Explore the Dashboard</h2>
<p>The dashboard gives you a real-time snapshot of your planning progress:</p>
<ul>
  <li><strong>Upcoming Events</strong> — countdown cards for each event you have created</li>
  <li><strong>Recent Inquiries</strong> — replies from vendors you have contacted</li>
  <li><strong>Wishlist Summary</strong> — vendors you have saved for later</li>
  <li><strong>Quick Actions</strong> — shortcuts to discover vendors, add an event, or open messages</li>
</ul>

<h2>Step 3: Create Your First Event</h2>
<p>Click <strong>New Event</strong> from the dashboard or the top navigation. Fill in the event name, type, date, and venue location. Once created, your event becomes the hub that connects your checklist, budget, guestlist, timeline, and memories — all in one place.</p>

<h2>Step 4: Discover Vendors</h2>
<p>Use the <strong>Discover</strong> page to browse the best vendors across the Tricity. Filter by category, location, budget range, and ratings. Every vendor profile shows real portfolio images, verified reviews, service packages, and pricing. When you find someone great, save them to a Wishlist or send an inquiry directly from their profile.</p>

<h2>Step 5: Use Your Planning Tools</h2>
<p>Once your event is set up, five powerful tools unlock automatically:</p>
<ul>
  <li><strong>Checklist</strong> — Smart task manager with pre-built templates for weddings and events</li>
  <li><strong>Budget</strong> — Track every rupee against your total budget with category breakdowns</li>
  <li><strong>Guest List</strong> — Manage RSVPs, dietary preferences, and seating</li>
  <li><strong>Timeline</strong> — Schedule every moment of your event day</li>
  <li><strong>Memories</strong> — Upload and organise photos from your event</li>
</ul>

<h2>Step 6: Communicate with Vendors</h2>
<p>Use <strong>Messages</strong> to chat in real time with vendors, ask questions, negotiate packages, and confirm bookings — all without leaving Omnicassion. Every conversation is saved so you never lose track of what was agreed.</p>

<h2>Step 7: Get Help from the AI Assistant</h2>
<p>Stuck on something? Open the <strong>AI Assistant</strong> from any page (look for the chat icon at the bottom right). Ask it anything — "What's the average cost of wedding decoration in Mohali?", "Give me a 6-month wedding checklist", or "Help me plan a guest list of 200 people". It's available 24/7 and trained specifically for event planning in the Tricity region.</p>

<h2>Frequently Asked Questions</h2>
<h3>Is Omnicassion free to use?</h3>
<p>Yes. Creating an account, discovering vendors, managing events, and using all planning tools is completely free for event planners. Vendors have their own packages — see our <strong>Pricing</strong> page for details.</p>

<h3>Can I plan multiple events at once?</h3>
<p>Absolutely. You can create as many events as you need, each with its own independent checklist, budget, guests, timeline, and memories.</p>

<h3>Is my data secure?</h3>
<p>Yes. Omnicassion uses enterprise-grade encryption and never shares your personal data with vendors without your permission.</p>

<h2>Ready to Start Planning?</h2>
<p>Creating your free account takes less than 60 seconds. Join thousands of couples and families across Chandigarh, Mohali, and Panchkula who are planning smarter with Omnicassion.</p>
`;

  const post: InternalBlogPost = {
    title: 'Getting Started with Omnicassion: Your Complete Platform Guide',
    slug: 'getting-started-with-omnicassion-complete-guide',
    excerpt: 'New to Omnicassion? This complete beginner\'s guide walks you through creating your account, building your event, discovering vendors, and using every planning tool — all in one place.',
    content: content.trim(),
    metaTitle: 'Getting Started with Omnicassion | Complete Platform Guide 2026',
    metaDescription: 'Learn how to use Omnicassion — India\'s smartest event planning platform for Chandigarh, Mohali & Panchkula. Step-by-step guide for new users.',
    focusKeyword: 'how to use Omnicassion',
    keywords: ['omnicassion guide', 'event planning platform india', 'chandigarh wedding planner app', 'how to plan an event online', 'omnicassion tutorial'],
    featuredImageAlt: 'Omnicassion event planning platform dashboard getting started guide',
    status: BlogStatus.PUBLISHED,
    readingTime: 0,
    authorId,
    categorySlug: 'platform-guides',
    tagSlugs: ['getting-started', 'how-to', 'omnicassion', 'platform-guide'],
  };

  post.readingTime = calculateReadingTime(post.content);
  return sanitize(post);
}

// ============================================================================
// BLOG 2 — HOW TO FIND & BOOK VENDORS
// ============================================================================

function generateFindBookVendors(authorId: string): InternalBlogPost {
  const content = `
<h1>How to Find and Book Vendors on Omnicassion: A Step-by-Step Guide</h1>

<p>Finding the right vendor for your event can feel overwhelming — hundreds of photographers, decorators, caterers, and venues competing for your attention. Omnicassion simplifies this completely with a powerful discovery engine, detailed vendor profiles, and a direct messaging system built for the Chandigarh, Mohali, and Panchkula market. Here is exactly how to find, evaluate, and book the perfect vendor for your event.</p>

<h2>Step 1: Open the Discover Page</h2>
<p>Click <strong>Discover</strong> in the left navigation sidebar. This is the main vendor marketplace showing hundreds of verified vendors across the Tricity region. By default, vendors are ranked by relevance, ratings, and activity level so you always see the best options first.</p>

<h2>Step 2: Search and Filter</h2>
<p>Use the search bar at the top to type what you are looking for — <em>"wedding photographer Mohali"</em>, <em>"outdoor venue Chandigarh"</em>, or just <em>"mehendi artist Panchkula"</em>. You can also filter by:</p>
<ul>
  <li><strong>Category</strong> — Photography, Decoration, Catering, Venue, Music, Makeup, Mehendi, Invitations, Transport, and more</li>
  <li><strong>Location</strong> — Chandigarh Sector, Mohali Phase, Panchkula Sector</li>
  <li><strong>Budget Range</strong> — Set a minimum and maximum price so only relevant vendors appear</li>
  <li><strong>Rating</strong> — Filter to show only 4-star or 5-star rated vendors</li>
</ul>

<h2>Step 3: Browse Vendor Profiles</h2>
<p>Click any vendor card to open their full profile. A great vendor profile on Omnicassion includes:</p>
<ul>
  <li><strong>Portfolio Gallery</strong> — Real photos from real events they have worked</li>
  <li><strong>Services & Packages</strong> — Detailed listing of what is included and at what price</li>
  <li><strong>Verified Reviews</strong> — Feedback from real couples and event planners</li>
  <li><strong>About Section</strong> — Their story, experience, and specialisations</li>
  <li><strong>Team Size & Availability</strong> — Whether they are available for your event date</li>
</ul>
<p>Spend time on the portfolio — it tells you more than any description. Look for consistency in style, quality of lighting, and variety of events covered.</p>

<h2>Step 4: Save Vendors to Your Wishlist</h2>
<p>Not ready to commit? Click the <strong>heart icon</strong> on any vendor profile or card to save them to your Wishlist. You can create multiple wishlists — for example, one for "Shortlisted Photographers" and another for "Potential Venues". This lets you compare vendors side by side before making a decision.</p>

<h2>Step 5: Send an Inquiry</h2>
<p>When you are serious about a vendor, click <strong>Send Inquiry</strong> or <strong>Get Quote</strong> on their profile. A quick form appears where you describe your event — date, type, approximate guest count, and any special requirements. Your inquiry is sent directly to the vendor and you receive replies in your <strong>Messages</strong> inbox.</p>

<blockquote>
  <strong>Pro Tip:</strong> Be specific in your inquiry. Vendors who get clear briefs give faster, more accurate quotes. Mention your event date, guest count, venue name (if confirmed), and your rough budget range.
</blockquote>

<h2>Step 6: Chat and Negotiate in Messages</h2>
<p>Once a vendor responds, the conversation moves to <strong>Messages</strong>. This is a real-time chat where you can:</p>
<ul>
  <li>Ask follow-up questions about packages and availability</li>
  <li>Request a custom quote tailored to your event</li>
  <li>Negotiate pricing or inclusions</li>
  <li>Share reference images or mood boards</li>
  <li>Confirm booking details before making payment</li>
</ul>

<h2>Step 7: Confirm Your Booking</h2>
<p>Once you've agreed on a package and price, confirm the booking details over messages and proceed with the vendor's preferred payment or advance method. Keep all agreements documented in the chat thread so you have a reference trail.</p>

<h2>Tips for Choosing the Right Vendor</h2>
<ul>
  <li>Always check the most recent portfolio work — styles evolve and quality can change</li>
  <li>Read at least 5–10 reviews, paying attention to comments about punctuality and communication</li>
  <li>Ask for references from weddings or events similar in size to yours</li>
  <li>Compare at least 3 vendors in the same category before deciding</li>
  <li>Confirm cancellation and rescheduling policies before paying any advance</li>
</ul>

<h2>Categories Available on Omnicassion</h2>
<p>Omnicassion covers every vendor category you need for a complete event:</p>
<ul>
  <li>Wedding & Event Venues</li>
  <li>Photography & Videography</li>
  <li>Catering & Food</li>
  <li>Decoration & Floral Design</li>
  <li>Makeup & Hair Styling</li>
  <li>Mehendi Artists</li>
  <li>Music, DJs & Entertainment</li>
  <li>Invitation & Stationery</li>
  <li>Bridal Wear & Groom Attire</li>
  <li>Transport & Car Rentals</li>
  <li>Event Management & Coordination</li>
  <li>Honeymoon & Travel Planning</li>
</ul>

<h2>Frequently Asked Questions</h2>
<h3>Are all vendors on Omnicassion verified?</h3>
<p>Yes. Every vendor goes through an onboarding review and KYC verification process before their profile becomes visible to planners.</p>

<h3>Can I book a vendor directly without messaging?</h3>
<p>Most vendors prefer initial contact through the inquiry / messaging system so they can provide an accurate quote for your specific event. Some vendors offer instant booking — look for the "Book Now" button on their profile.</p>

<h3>What if a vendor doesn't reply?</h3>
<p>Vendors who do not respond within reasonable time are flagged in our system. You can also use the <strong>response rate</strong> indicator on each vendor profile to gauge how active they are before sending an inquiry.</p>
`;

  const post: InternalBlogPost = {
    title: 'How to Find and Book Vendors on Omnicassion',
    slug: 'how-to-find-book-vendors-omnicassion',
    excerpt: 'Discover, shortlist, and book the perfect vendors for your event using Omnicassion\'s powerful marketplace. Step-by-step guide covering search, wishlists, inquiries, and messaging.',
    content: content.trim(),
    metaTitle: 'How to Find & Book Vendors on Omnicassion | Step-by-Step Guide',
    metaDescription: 'Learn how to discover, compare, and book top event vendors in Chandigarh, Mohali & Panchkula using Omnicassion\'s vendor marketplace.',
    focusKeyword: 'how to find vendors on omnicassion',
    keywords: ['book event vendors chandigarh', 'omnicassion vendors', 'find wedding vendors mohali', 'event vendor booking india'],
    featuredImageAlt: 'Omnicassion vendor discovery page showing wedding vendors in Chandigarh',
    status: BlogStatus.PUBLISHED,
    readingTime: 0,
    authorId,
    categorySlug: 'platform-guides',
    tagSlugs: ['vendors', 'booking', 'how-to', 'discovery', 'wishlists'],
  };

  post.readingTime = calculateReadingTime(post.content);
  return sanitize(post);
}

// ============================================================================
// BLOG 3 — HOW TO CREATE AND MANAGE EVENTS
// ============================================================================

function generateManageEvents(authorId: string): InternalBlogPost {
  const content = `
<h1>How to Create and Manage Your Event on Omnicassion</h1>

<p>Your event is the heart of everything on Omnicassion. Once you create it, all your planning tools — checklist, budget, guest list, timeline, and memories — connect to it automatically. This guide shows you how to create, customise, and manage your event from start to finish.</p>

<h2>Why Create an Event First?</h2>
<p>On Omnicassion, an <strong>Event</strong> is more than just a name and date. It's the container that organises your entire planning journey. Every task you complete, every rupee you track, every guest you add, and every memory you upload belongs to a specific event. This keeps your planning organised even if you have multiple events happening at the same time.</p>

<h2>Step 1: Create a New Event</h2>
<p>From your Dashboard, click the <strong>+ New Event</strong> button, or navigate to <strong>Events</strong> in the sidebar and click <strong>Create Event</strong>. You will be prompted to fill in:</p>
<ul>
  <li><strong>Event Name</strong> — For example: "Priya & Rahul's Wedding" or "Singh Family Birthday 2026"</li>
  <li><strong>Event Type</strong> — Wedding, Engagement, Birthday, Corporate, etc.</li>
  <li><strong>Event Date</strong> — The main day of your event</li>
  <li><strong>Venue / Location</strong> — City or specific venue name within the Tricity</li>
  <li><strong>Expected Guest Count</strong> — Approximate number of attendees</li>
  <li><strong>Total Budget</strong> — Your overall spending limit (you can adjust this anytime)</li>
</ul>

<h2>Step 2: Navigate Your Event Hub</h2>
<p>After creating your event, click on it to open the <strong>Event Hub</strong> — a central page showing all associated planning tools. From here you can jump to:</p>
<ul>
  <li>📋 <strong>Checklist</strong> — Task management for every pre-event to-do</li>
  <li>💰 <strong>Budget</strong> — Full budget tracker with category spending</li>
  <li>👥 <strong>Guest List</strong> — Complete attendee management</li>
  <li>🕐 <strong>Timeline</strong> — Hour-by-hour event day schedule</li>
  <li>📸 <strong>Memories</strong> — Photo album for the event</li>
  <li>🏪 <strong>Vendors</strong> — Vendors associated with this specific event</li>
</ul>

<h2>Step 3: Managing Multiple Events</h2>
<p>If you are planning more than one event — common for families managing a wedding, an engagement, and a sangeet separately — you can create each as its own event. Navigate to <strong>Events</strong> in the sidebar to see all your events as cards, each showing a countdown to the event date, latest checklist progress, and budget status at a glance.</p>

<h2>Step 4: Edit Event Details</h2>
<p>Plans change — your venue might switch, or the date might shift. Open your event and click <strong>Edit Event</strong> (the settings icon near the event name). Every field is editable at any time without affecting your planning data.</p>

<h2>Step 5: Setting Up Event Settings</h2>
<p>Inside each event you will find a <strong>Settings</strong> section where you can:</p>
<ul>
  <li>Change the event cover photo</li>
  <li>Update the event visibility (private by default)</li>
  <li>Invite co-planners — family members or coordinators can be added as collaborators</li>
  <li>Archive or delete the event once it has concluded</li>
</ul>

<h2>Step 6: The Event Countdown</h2>
<p>One of the most motivating features of Omnicassion is the real-time countdown on each event card. Seeing "87 days to your wedding" every time you log in creates a healthy urgency that keeps planning on track.</p>

<h2>Tips for Effective Event Management</h2>
<ul>
  <li>Create your event as early as possible — at least 6–12 months before a wedding, 2–3 months before a birthday</li>
  <li>Set your total budget conservatively — Indian events inevitably run 10–20% over initial estimates</li>
  <li>If you have multiple functions (Mehendi, Sangeet, Wedding, Reception), create each as a separate event so planning stays clean and organised</li>
  <li>Use the guest count field accurately — it drives recommendations in your checklist and budget templates</li>
</ul>

<h2>Frequently Asked Questions</h2>
<h3>How many events can I create?</h3>
<p>There is no limit. Create as many events as you need — past events are automatically archived after the event date passes.</p>

<h3>Can I share my event with a family member or coordinator?</h3>
<p>Yes — use the co-planner invitation feature inside event settings. They will get access to your checklist, budget, and guest list.</p>

<h3>Can I delete an event?</h3>
<p>Yes. Deleting an event removes all associated planning data. Consider archiving instead if you just want to tidy up your dashboard while keeping records.</p>
`;

  const post: InternalBlogPost = {
    title: 'How to Create and Manage Your Event on Omnicassion',
    slug: 'how-to-create-manage-event-omnicassion',
    excerpt: 'Learn how to create your event on Omnicassion and unlock all the planning tools — checklist, budget, guest list, timeline, memories — in one connected hub.',
    content: content.trim(),
    metaTitle: 'How to Create & Manage Your Event on Omnicassion | Full Guide',
    metaDescription: 'Step-by-step guide to creating and managing events on Omnicassion. Connect your checklist, budget, guest list, timeline, and memories to one hub.',
    focusKeyword: 'create event on omnicassion',
    keywords: ['omnicassion event management', 'plan wedding online chandigarh', 'event planning app india', 'create wedding event'],
    featuredImageAlt: 'Omnicassion event hub showing planning tools for a wedding event',
    status: BlogStatus.PUBLISHED,
    readingTime: 0,
    authorId,
    categorySlug: 'platform-guides',
    tagSlugs: ['events', 'event-management', 'how-to', 'planning'],
  };

  post.readingTime = calculateReadingTime(post.content);
  return sanitize(post);
}

// ============================================================================
// BLOG 4 — EVENT CHECKLIST
// ============================================================================

function generateChecklistGuide(authorId: string): InternalBlogPost {
  const content = `
<h1>How to Use the Omnicassion Event Checklist: Never Miss a Single Task</h1>

<p>A wedding or major event has hundreds of moving parts — venue booking, vendor confirmations, trousseau shopping, invitation dispatch, catering finalization, and hundreds of smaller tasks in between. Omnicassion's smart checklist keeps everything organised, prioritised, and trackable from months out to the day itself.</p>

<h2>What is the Omnicassion Checklist?</h2>
<p>The <strong>Checklist</strong> is a dynamic task manager tied directly to your event. It supports pre-built templates for different event types, custom tasks you add yourself, due dates, categories, and completion tracking. It's designed to function like the checklist a professional event coordinator uses — adapted for real Indian weddings and events in the Tricity region.</p>

<h2>Step 1: Open the Checklist</h2>
<p>Navigate to <strong>Checklist</strong> in the sidebar. If you have one event, you'll be taken directly to that event's checklist. If you have multiple events, you'll see a list of your events — click the one you want to manage. You can also access the checklist directly from inside your event hub.</p>

<h2>Step 2: Understanding Checklist Categories</h2>
<p>Tasks are organised into logical categories:</p>
<ul>
  <li><strong>Venue & Logistics</strong> — Venue booking, permits, parking, accommodation</li>
  <li><strong>Vendors</strong> — Photography, catering, decoration, music, mehendi, makeup confirmations</li>
  <li><strong>Invitations & Communication</strong> — Design, printing, dispatch, RSVP tracking</li>
  <li><strong>Attire</strong> — Bridal lehenga, groom sherwani, family outfits, fittings</li>
  <li><strong>Beauty & Wellness</strong> — Pre-wedding skincare, trial makeup, mehendi appointments</li>
  <li><strong>Day-Of</strong> — Final confirmations, payments, on-the-day checklists</li>
  <li><strong>Post-Event</strong> — Thank you notes, payments cleared, album collection</li>
</ul>

<h2>Step 3: Adding Tasks</h2>
<p>Click <strong>+ Add Task</strong> to create a new checklist item. Each task includes:</p>
<ul>
  <li><strong>Task Name</strong> — A clear, action-oriented description</li>
  <li><strong>Category</strong> — Assign it to the appropriate group</li>
  <li><strong>Due Date</strong> — When it needs to be completed by</li>
  <li><strong>Priority</strong> — High, medium, or low</li>
  <li><strong>Notes</strong> — Any additional context, vendor contacts, or reminders</li>
  <li><strong>Assigned To</strong> — Tag a co-planner or family member responsible</li>
</ul>

<h2>Step 4: Tracking Progress</h2>
<p>Mark tasks as complete using the checkbox next to each item. The progress bar at the top of the checklist shows your overall completion percentage. Color-coded indicators show:</p>
<ul>
  <li><strong>Green</strong> — Completed on time</li>
  <li><strong>Orange</strong> — Due soon (within 7 days)</li>
  <li><strong>Red</strong> — Overdue tasks that need urgent attention</li>
</ul>

<h2>Step 5: Filtering and Sorting</h2>
<p>Use the filter options to view:</p>
<ul>
  <li>Tasks due this week</li>
  <li>Incomplete high-priority tasks only</li>
  <li>Tasks by specific category</li>
  <li>Tasks assigned to a specific person</li>
</ul>

<h2>Step 6: Using Templates</h2>
<p>For first-time planners, Omnicassion provides curated templates — a complete 12-month wedding checklist with 100+ tasks is pre-loaded when you create a wedding event. You can delete tasks you don't need, and add custom ones that are specific to your event. Templates are a great starting point to ensure nothing gets overlooked.</p>

<h2>Pro Tips for Using the Checklist Effectively</h2>
<ul>
  <li>Review your checklist every Sunday — it takes 10 minutes and keeps you ahead of deadlines</li>
  <li>Add vendor booking confirmations as tasks with the confirmation date as the due date</li>
  <li>Create a separate "Day Of" section with tasks you or a coordinator will execute on the event day itself</li>
  <li>Use the Notes field to store vendor phone numbers, contract details, and references</li>
  <li>Break large tasks (like "Book caterer") into smaller sub-tasks ("Shortlist 3 caterers", "Tasting session", "Finalise menu", "Sign contract")</li>
</ul>

<h2>Sample 6-Month Wedding Checklist</h2>
<table>
  <thead><tr><th>Timeframe</th><th>Key Tasks</th></tr></thead>
  <tbody>
    <tr><td>6 Months Out</td><td>Set budget, book venue, hire photographer, select caterer</td></tr>
    <tr><td>4 Months Out</td><td>Book decoration, music, confirm guest list, order bridal outfit</td></tr>
    <tr><td>2 Months Out</td><td>Send invitations, confirm all vendors, book honeymoon</td></tr>
    <tr><td>1 Month Out</td><td>Final fittings, confirm seating, create timeline, brief vendors</td></tr>
    <tr><td>1 Week Out</td><td>Final payments, confirm guest count, brief on-day coordinator</td></tr>
    <tr><td>Day Of</td><td>Vendor check-ins, bride/groom prep schedule, ceremony flow</td></tr>
  </tbody>
</table>

<h2>Frequently Asked Questions</h2>
<h3>Can I use the checklist on mobile?</h3>
<p>Yes. Omnicassion is fully responsive and works beautifully on smartphones. Tick off tasks on the go from rehearsal dinners, shopping trips, or vendor meetings.</p>

<h3>Can I share the checklist with my partner or family?</h3>
<p>Yes — invite co-planners from your event settings. They will see the same checklist and can check off tasks assigned to them.</p>
`;

  const post: InternalBlogPost = {
    title: 'How to Use the Omnicassion Event Checklist: Never Miss a Task',
    slug: 'how-to-use-omnicassion-event-checklist',
    excerpt: 'Master the Omnicassion checklist to manage every wedding or event task — from venue booking to day-of logistics. Complete guide with tips and a sample 6-month timeline.',
    content: content.trim(),
    metaTitle: 'How to Use the Omnicassion Checklist | Event Planning Guide',
    metaDescription: 'Never miss an event planning task. Learn how to use Omnicassion\'s smart checklist with templates, due dates, progress tracking & co-planner sharing.',
    focusKeyword: 'omnicassion event checklist',
    keywords: ['wedding checklist app india', 'event planning checklist chandigarh', 'omnicassion checklist guide', 'wedding task manager'],
    featuredImageAlt: 'Omnicassion event checklist showing wedding planning tasks with progress tracking',
    status: BlogStatus.PUBLISHED,
    readingTime: 0,
    authorId,
    categorySlug: 'platform-guides',
    tagSlugs: ['checklist', 'task-management', 'how-to', 'wedding-planning'],
  };

  post.readingTime = calculateReadingTime(post.content);
  return sanitize(post);
}

// ============================================================================
// BLOG 5 — BUDGET TRACKER
// ============================================================================

function generateBudgetGuide(authorId: string): InternalBlogPost {
  const content = `
<h1>How to Track Your Event Budget on Omnicassion: A Complete Guide</h1>

<p>Budget overruns are the single biggest source of stress in event planning. On Omnicassion, the built-in Budget Tracker gives you real-time visibility over every rupee — from the initial estimate to final payments — so you always know exactly where you stand financially.</p>

<h2>Why You Need a Dedicated Event Budget Tracker</h2>
<p>Most families try to manage event budgets in spreadsheets or paper notebooks. The problem: costs are spread across vendors, family contributions, advance payments, and last-minute additions — it's almost impossible to keep a mental tally. Omnicassion's budget tool centralises everything, shows you category-by-category breakdowns, and alerts you before you exceed limits.</p>

<h2>Step 1: Set Your Total Budget</h2>
<p>When you create an event, you set a <strong>Total Budget</strong>. This is the overall maximum you plan to spend. You can update this anytime from your event settings. Setting a realistic total budget is the foundation of the entire tracking system.</p>
<p>For a Tricity wedding in 2026, typical budget ranges are:</p>
<ul>
  <li><strong>Intimate (50–100 guests):</strong> ₹5–₹15 lakhs</li>
  <li><strong>Medium (150–300 guests):</strong> ₹15–₹50 lakhs</li>
  <li><strong>Grand (300–600 guests):</strong> ₹50 lakhs – ₹2 crores</li>
</ul>

<h2>Step 2: Navigate to Budget</h2>
<p>From your event hub, click <strong>Budget</strong>. You'll see the main budget dashboard showing:</p>
<ul>
  <li><strong>Total Budget</strong> — Your set ceiling</li>
  <li><strong>Total Spent</strong> — Amount committed and paid to date</li>
  <li><strong>Remaining</strong> — What's left to allocate</li>
  <li><strong>Budget Utilization %</strong> — Visual progress bar</li>
  <li><strong>Category Breakdown</strong> — Spending by vendor category</li>
</ul>

<h2>Step 3: Add Budget Items</h2>
<p>Click <strong>+ Add Expense</strong> to log a new budget item. Each item includes:</p>
<ul>
  <li><strong>Category</strong> — Venue, Photography, Catering, Decoration, Attire, Beauty, Music, Invitations, Miscellaneous</li>
  <li><strong>Vendor Name</strong> — Optional link to a vendor from your inquiry list</li>
  <li><strong>Estimated Cost</strong> — What you expect to pay</li>
  <li><strong>Amount Paid</strong> — Advance or full payment already made</li>
  <li><strong>Balance Due</strong> — Auto-calculated remaining amount</li>
  <li><strong>Due Date</strong> — When the balance needs to be cleared</li>
  <li><strong>Notes</strong> — Contract reference numbers, payment methods, etc.</li>
</ul>

<h2>Step 4: Understanding the Category Breakdown</h2>
<p>The pie chart and bar chart on the budget page show how your spending is distributed across categories. Industry benchmarks for a mid-sized Indian wedding:</p>
<table>
  <thead><tr><th>Category</th><th>Typical % of Budget</th></tr></thead>
  <tbody>
    <tr><td>Venue</td><td>25–35%</td></tr>
    <tr><td>Catering & Food</td><td>25–30%</td></tr>
    <tr><td>Decoration & Flowers</td><td>10–15%</td></tr>
    <tr><td>Photography & Video</td><td>8–12%</td></tr>
    <tr><td>Attire & Jewellery</td><td>8–12%</td></tr>
    <tr><td>Music & Entertainment</td><td>3–5%</td></tr>
    <tr><td>Invitations</td><td>2–3%</td></tr>
    <tr><td>Makeup & Beauty</td><td>2–3%</td></tr>
    <tr><td>Miscellaneous</td><td>5–10%</td></tr>
  </tbody>
</table>

<h2>Step 5: Tracking Paid vs. Pending</h2>
<p>The budget tracker differentiates between <strong>estimated costs</strong>, <strong>amounts paid</strong>, and <strong>balances due</strong>. This gives you a cash flow view of upcoming payment commitments. You'll never be caught off guard by a ₹2 lakh venue balance due the week before your wedding.</p>

<h2>Step 6: Budget Alerts</h2>
<p>Omnicassion automatically highlights budget items in <strong>red</strong> when:</p>
<ul>
  <li>Your total committed costs exceed 90% of your budget</li>
  <li>A payment due date is approaching (within 7 days)</li>
  <li>A single category significantly exceeds its typical allocation</li>
</ul>

<h2>Pro Tips for Budget Management</h2>
<ul>
  <li>Always set aside 10–15% of your budget as a <strong>contingency buffer</strong> — unexpected costs always appear</li>
  <li>Enter estimates before booking, so you can see projected totals before committing</li>
  <li>Update amounts paid immediately after every transaction — delays create reconciliation headaches</li>
  <li>Track all contributions from family separately so you know the full picture</li>
  <li>Use the Notes field to record cheque numbers, transaction IDs, and payment receipts</li>
</ul>

<h2>Frequently Asked Questions</h2>
<h3>Can multiple people update the budget?</h3>
<p>Yes. Co-planners you invite have access to add and update budget items, making it easy for both partners or different family decision-makers to contribute.</p>

<h3>Does Omnicassion process payments?</h3>
<p>No — Omnicassion tracks your budget and expenses. Actual payments happen directly between you and the vendor through your preferred method.</p>

<h3>Can I export my budget?</h3>
<p>Budget reports can be exported from inside your event — useful for sharing summaries with family or keeping records for tax purposes.</p>
`;

  const post: InternalBlogPost = {
    title: 'How to Track Your Event Budget on Omnicassion',
    slug: 'how-to-track-event-budget-omnicassion',
    excerpt: 'Stop losing track of event expenses. Omnicassion\'s budget tracker gives you real-time visibility over every rupee — by category, vendor, and payment status.',
    content: content.trim(),
    metaTitle: 'How to Use Omnicassion Budget Tracker | Wedding Budget Guide',
    metaDescription: 'Track your wedding or event budget with Omnicassion. Log expenses by category, monitor paid vs pending, and never overspend again.',
    focusKeyword: 'omnicassion budget tracker',
    keywords: ['wedding budget tracker india', 'event expense tracking app', 'chandigarh wedding budget', 'omnicassion budget guide'],
    featuredImageAlt: 'Omnicassion budget tracker dashboard showing wedding expense categories and spending breakdown',
    status: BlogStatus.PUBLISHED,
    readingTime: 0,
    authorId,
    categorySlug: 'platform-guides',
    tagSlugs: ['budget', 'expense-tracking', 'how-to', 'financial-planning'],
  };

  post.readingTime = calculateReadingTime(post.content);
  return sanitize(post);
}

// ============================================================================
// BLOG 6 — GUEST LIST MANAGER
// ============================================================================

function generateGuestlistGuide(authorId: string): InternalBlogPost {
  const content = `
<h1>How to Manage Your Guest List on Omnicassion</h1>

<p>Managing 300 guests from three different family sides, tracking RSVPs, dietary preferences, seating arrangements, and invitation dispatch is genuinely hard. Omnicassion's Guest List Manager brings all of this into a single, clean interface so you never lose track of a single guest.</p>

<h2>What the Guest List Manager Does</h2>
<p>The Guest List tool is a full-featured attendee management system that tracks every person attending your event. It handles RSVPs, meal preferences, plus-ones, group assignments, and more — without needing a separate spreadsheet.</p>

<h2>Step 1: Access Your Guest List</h2>
<p>From your Event Hub, click <strong>Guest List</strong>. You'll see the main guest list dashboard with a summary of total invited, confirmed, and pending RSVPs, along with a breakdown by side (e.g., Bride's Family, Groom's Family, Friends).</p>

<h2>Step 2: Adding Guests</h2>
<p>Click <strong>+ Add Guest</strong> to add a new person. Each guest record includes:</p>
<ul>
  <li><strong>Full Name</strong></li>
  <li><strong>Phone Number</strong> — For WhatsApp invitation delivery</li>
  <li><strong>Email</strong> — Optional for digital invitations</li>
  <li><strong>Guest Group / Side</strong> — Bride, Groom, Friends, Corporate, etc.</li>
  <li><strong>RSVP Status</strong> — Invited, Confirmed, Declined, Waitlisted</li>
  <li><strong>Meal Preference</strong> — Veg, Non-Veg, Jain, etc.</li>
  <li><strong>Plus Ones</strong> — How many additional guests they are bringing</li>
  <li><strong>Table / Seating</strong> — Assign a seating group or table number</li>
  <li><strong>Notes</strong> — VIP status, special requirements, relationship notes</li>
</ul>

<h2>Step 3: Import Guests in Bulk</h2>
<p>Have a long list already in Excel or WhatsApp? Use the <strong>Import</strong> feature to upload a CSV file with guest names and contact details. This saves hours of manual entry for large guest lists.</p>

<h2>Step 4: Tracking RSVPs</h2>
<p>As you contact guests and receive responses, update their RSVP status. The dashboard shows live counts:</p>
<ul>
  <li><strong>Total Invited</strong></li>
  <li><strong>Confirmed Attending</strong></li>
  <li><strong>Declined</strong></li>
  <li><strong>Awaiting Response</strong></li>
  <li><strong>Confirmed Guest Count</strong> (including plus-ones)</li>
</ul>
<p>These live numbers feed directly into your <strong>Budget</strong> tool — catering estimates automatically update when your confirmed guest count changes.</p>

<h2>Step 5: Filtering and Searching</h2>
<p>For large guest lists, use filters to view:</p>
<ul>
  <li>Guests by group (Bride's side, Groom's side)</li>
  <li>Unconfirmed RSVPs only (great for follow-up calls)</li>
  <li>Guests with special dietary needs</li>
  <li>VIP guests who need special attention</li>
</ul>

<h2>Step 6: Seating and Table Management</h2>
<p>Assign guests to tables or seating zones using the seating field. You can create named table groups (Head Table, Family Table A, Friends Zone) and assign guests to them. This simplifies coordination with your venue and caterer.</p>

<h2>Tips for Guest List Management</h2>
<ul>
  <li>Start your guest list at least 4–6 months before the wedding so you have time for RSVPs</li>
  <li>Set a firm RSVP deadline — typically 4 weeks before the event — and follow up with non-responders personally</li>
  <li>Track dietary preferences accurately — Indian weddings often have 40–60% vegetarian guests</li>
  <li>Keep a small buffer of 5–10% over your confirmed number when giving the caterer a final count</li>
  <li>Use guest notes to track relationship context — "cousin of bride", "colleague of groom's father" — helpful for family members managing the event</li>
</ul>

<h2>Frequently Asked Questions</h2>
<h3>How many guests can I add?</h3>
<p>There is no hard limit on the number of guests. The tool is designed for lists of hundreds.</p>

<h3>Can guests confirm their RSVP themselves?</h3>
<p>Omnicassion's RSVP self-service feature is coming soon. Currently RSVP status is managed by the planner based on responses received.</p>

<h3>Can I print the guest list?</h3>
<p>Yes — export your guest list to CSV or PDF for sharing with coordinators, venue managers, or family members handling a function.</p>
`;

  const post: InternalBlogPost = {
    title: 'How to Manage Your Guest List on Omnicassion',
    slug: 'how-to-manage-guest-list-omnicassion',
    excerpt: 'Manage RSVPs, seating, dietary preferences, and guest groups for 300+ guests without a spreadsheet. Complete guide to Omnicassion\'s Guest List Manager.',
    content: content.trim(),
    metaTitle: 'How to Manage Event Guest List on Omnicassion | RSVP Guide',
    metaDescription: 'Track RSVPs, dietary preferences, seating, and guest groups for your wedding or event using Omnicassion\'s built-in guest list manager.',
    focusKeyword: 'omnicassion guest list manager',
    keywords: ['wedding guest list app india', 'event rsvp tracker', 'guest list management chandigarh', 'wedding attendee management'],
    featuredImageAlt: 'Omnicassion guest list manager showing RSVP tracking for a wedding event',
    status: BlogStatus.PUBLISHED,
    readingTime: 0,
    authorId,
    categorySlug: 'platform-guides',
    tagSlugs: ['guest-list', 'rsvp', 'how-to', 'event-management'],
  };

  post.readingTime = calculateReadingTime(post.content);
  return sanitize(post);
}

// ============================================================================
// BLOG 7 — EVENT TIMELINE
// ============================================================================

function generateTimelineGuide(authorId: string): InternalBlogPost {
  const content = `
<h1>How to Build Your Event Timeline on Omnicassion</h1>

<p>The event timeline is your hour-by-hour master schedule for the big day. Without one, even the best-planned events descend into chaos — pheras running late, caterers waiting, guests confused about what's happening next. Omnicassion's Timeline Builder helps you create a detailed, shareable schedule that keeps everyone — vendors, family, and coordinators — on exactly the same page.</p>

<h2>What is the Event Timeline?</h2>
<p>The Timeline is a structured, time-based schedule for your event day (or days). Unlike a checklist which tracks pre-event tasks, the timeline focuses on what happens and when on the actual event day — from venue setup at 6 AM to the last dance at midnight.</p>

<h2>Step 1: Open the Timeline</h2>
<p>From your Event Hub, click <strong>Timeline</strong>. If you have only one event, you'll arrive directly at the timeline builder. For multiple events, select the relevant one from the event list.</p>

<h2>Step 2: Add Timeline Items</h2>
<p>Click <strong>+ Add Item</strong> to create a new timeline entry. Each item includes:</p>
<ul>
  <li><strong>Time</strong> — Exact start time (e.g., 10:30 AM)</li>
  <li><strong>Duration</strong> — How long this segment runs</li>
  <li><strong>Title</strong> — Name of the event block (e.g., "Baraat Arrival")</li>
  <li><strong>Description</strong> — What happens, who is involved, what is needed</li>
  <li><strong>Location</strong> — Specific area within the venue (e.g., Main Lawn, Mandap, Lobby)</li>
  <li><strong>Assigned Vendor/Person</strong> — Who is responsible for this segment</li>
  <li><strong>Notes</strong> — Special instructions, confirmations needed, cues</li>
</ul>

<h2>Step 3: Build a Complete Wedding Day Timeline</h2>
<p>Here is a sample timeline for a typical North Indian wedding in the Tricity region:</p>
<table>
  <thead><tr><th>Time</th><th>Event Block</th><th>Location</th></tr></thead>
  <tbody>
    <tr><td>06:00 AM</td><td>Venue Setup Begins (Decoration Team)</td><td>Full Venue</td></tr>
    <tr><td>08:00 AM</td><td>Bride & Groom Makeup & Dressing</td><td>Bridal Suite</td></tr>
    <tr><td>10:00 AM</td><td>Pre-Wedding Photography</td><td>Garden Area</td></tr>
    <tr><td>11:30 AM</td><td>Milni (Family Welcome Ceremony)</td><td>Main Entrance</td></tr>
    <tr><td>12:00 PM</td><td>Baraat Procession & Arrival</td><td>Main Gate</td></tr>
    <tr><td>01:00 PM</td><td>Jaimala / Varmala Ceremony</td><td>Stage</td></tr>
    <tr><td>01:30 PM</td><td>Lunch for Baraat & Guests</td><td>Dining Hall</td></tr>
    <tr><td>03:00 PM</td><td>Pheras / Wedding Ceremony</td><td>Mandap</td></tr>
    <tr><td>05:00 PM</td><td>Vidaai</td><td>Main Entrance</td></tr>
    <tr><td>07:00 PM</td><td>Reception Doors Open</td><td>Grand Ballroom</td></tr>
    <tr><td>07:30 PM</td><td>Couple Entry & Stage Ceremony</td><td>Stage</td></tr>
    <tr><td>08:00 PM</td><td>Dinner Service Opens</td><td>Buffet Area</td></tr>
    <tr><td>09:00 PM</td><td>DJ/Live Music</td><td>Dance Floor</td></tr>
    <tr><td>11:30 PM</td><td>Event Wrap-Up</td><td>All Areas</td></tr>
  </tbody>
</table>

<h2>Step 4: Colour-Code and Categorise</h2>
<p>Omnicassion lets you colour-code timeline items by type: <em>Ceremony</em>, <em>Photography</em>, <em>Catering</em>, <em>Entertainment</em>, <em>Logistics</em>. This makes the timeline much easier to scan at a glance — especially when you share it with vendors and coordinators.</p>

<h2>Step 5: Share the Timeline</h2>
<p>Export the timeline as a PDF to share with:</p>
<ul>
  <li>Your photographer / videographer — so they know every shot moment</li>
  <li>The venue coordinator — to align setup and service timing</li>
  <li>Your caterer — so food service aligns with ceremony breaks</li>
  <li>Family members running specific ceremonies</li>
  <li>Your DJ or live music team — for cue-based sets</li>
</ul>

<h2>Timeline Building Tips</h2>
<ul>
  <li><strong>Build in buffer time</strong> — Indian events run 30–60 minutes late on average. Add 15-minute buffers before critical moments</li>
  <li>Start your timeline from venue setup, not from when guests arrive — vendor setup time is often forgotten</li>
  <li>Share the timeline with your main vendors at least 2 weeks before the event for feedback and adjustments</li>
  <li>Keep a printed copy with your on-day coordinator, not just digital</li>
  <li>Mark "hard start" items in red — things that cannot be moved (e.g., muhurat time for pheras)</li>
</ul>

<h2>Frequently Asked Questions</h2>
<h3>Can I create timelines for multi-day events?</h3>
<p>Yes. Create one event per day (Sangeet, Wedding, Reception) and build a separate timeline for each. This keeps each day's schedule clean and manageable.</p>

<h3>Can vendors see my timeline?</h3>
<p>You choose what to share. Export and send the timeline PDF to specific vendors — it is not automatically visible to them on the platform.</p>
`;

  const post: InternalBlogPost = {
    title: 'How to Build Your Event Timeline on Omnicassion',
    slug: 'how-to-build-event-timeline-omnicassion',
    excerpt: 'Build a detailed hour-by-hour event day schedule on Omnicassion. Keep vendors, family, and coordinators aligned with a shareable timeline for your wedding or event.',
    content: content.trim(),
    metaTitle: 'How to Build an Event Timeline on Omnicassion | Day-Of Guide',
    metaDescription: 'Create a detailed wedding or event day timeline on Omnicassion. Schedule every moment, assign vendors, and share with coordinators — all in one tool.',
    focusKeyword: 'omnicassion event timeline',
    keywords: ['wedding timeline builder india', 'event day schedule app', 'chandigarh wedding day timeline', 'omnicassion timeline guide'],
    featuredImageAlt: 'Omnicassion event timeline showing hour-by-hour wedding day schedule',
    status: BlogStatus.PUBLISHED,
    readingTime: 0,
    authorId,
    categorySlug: 'platform-guides',
    tagSlugs: ['timeline', 'event-day', 'how-to', 'wedding-planning'],
  };

  post.readingTime = calculateReadingTime(post.content);
  return sanitize(post);
}

// ============================================================================
// BLOG 8 — WISHLISTS
// ============================================================================

function generateWishlistGuide(authorId: string): InternalBlogPost {
  const content = `
<h1>How to Use Wishlists on Omnicassion to Save and Compare Vendors</h1>

<p>Finding the perfect vendor for your event often takes time — you browse dozens of profiles, mentally compare options, and then forget which photographers you liked by the time you're ready to decide. Omnicassion's Wishlist feature solves this completely. Save vendors as you browse, organise them by category, and compare your shortlisted options before sending inquiries.</p>

<h2>What is the Wishlist?</h2>
<p>A Wishlist is a curated collection of vendor profiles you have saved while browsing Omnicassion. Think of it like a shopping cart for event vendors — you bookmark the ones you love, come back later, compare them, and decide. You can create multiple wishlists for different vendor categories or different events.</p>

<h2>Step 1: Save a Vendor to a Wishlist</h2>
<p>Two ways to save a vendor:</p>
<ul>
  <li><strong>From vendor cards</strong> — Click the <strong>heart icon</strong> (♥) on any vendor card in the Discover page or search results</li>
  <li><strong>From vendor profiles</strong> — Click the <strong>Save to Wishlist</strong> button inside a vendor's full profile page</li>
</ul>
<p>A quick popup appears letting you choose which wishlist to add the vendor to, or create a new one on the spot.</p>

<h2>Step 2: Create Multiple Wishlists</h2>
<p>Organise your saved vendors by creating separate lists for each category. Examples:</p>
<ul>
  <li>"Wedding Photographers — Shortlist"</li>
  <li>"Venue Options — Mohali"</li>
  <li>"Caterers for Reception"</li>
  <li>"Mehendi Artists"</li>
  <li>"My Dream Board" — aspirational vendors you love but may not book</li>
</ul>
<p>Create as many wishlists as you need. Go to <strong>Wishlists</strong> in the sidebar → click <strong>+ New Wishlist</strong> → give it a name and description.</p>

<h2>Step 3: View and Manage Your Wishlist</h2>
<p>Open any wishlist to see all your saved vendors in card format. Each card shows:</p>
<ul>
  <li>Vendor name, category, and location</li>
  <li>Average rating and review count</li>
  <li>Starting price from their service packages</li>
  <li>Quick action buttons: <strong>View Profile</strong>, <strong>Send Inquiry</strong>, <strong>Remove</strong></li>
</ul>

<h2>Step 4: Compare Vendors Side by Side</h2>
<p>Within a wishlist, select 2–3 vendors and click <strong>Compare</strong>. A comparison table appears showing:</p>
<ul>
  <li>Pricing tiers</li>
  <li>Services included</li>
  <li>Rating and reviews</li>
  <li>Location and travel availability</li>
</ul>
<p>This is especially powerful when deciding between two similarly-priced photographers or caterers.</p>

<h2>Step 5: Move to Inquiry When Ready</h2>
<p>When you've narrowed down your wishlist and are ready to engage with a vendor, click <strong>Send Inquiry</strong> directly from the wishlist card. This opens the inquiry form pre-filled with your event details, saving you time.</p>

<h2>Tips for Using Wishlists Well</h2>
<ul>
  <li>Save generously early on — add anyone who catches your eye even if you're unsure. It's free and easy to remove later</li>
  <li>Use one wishlist per vendor category for cleaner organisation</li>
  <li>Share wishlists with your partner or family members for input before making decisions</li>
  <li>Revisit saved wishlists 1–2 months after saving — sometimes vendors improve their profiles, add new portfolio work, or run promotions</li>
  <li>Don't confuse saving to a wishlist with sending an inquiry — saving is just bookmarking. Only the inquiry starts the booking conversation</li>
</ul>

<h2>Wishlists for Group Decisions</h2>
<p>Planning a wedding is rarely a solo decision. Share a wishlist link with your partner, in-laws, or family members so they can browse your saved vendors and give input — without needing their own Omnicassion account. This is especially useful for decisions like venue selection where multiple family stakeholders are involved.</p>

<h2>Frequently Asked Questions</h2>
<h3>Can I share a wishlist with someone who doesn't have an account?</h3>
<p>Wishlist sharing is available to other logged-in Omnicassion users. Guest view links for external sharing are on the roadmap.</p>

<h3>How many vendors can I save to a wishlist?</h3>
<p>There is no limit. Save as many vendors as you like across as many wishlists as you need.</p>

<h3>Can vendors see if I've added them to a wishlist?</h3>
<p>No. Wishlists are private. Vendors are only notified when you actively send them an inquiry.</p>
`;

  const post: InternalBlogPost = {
    title: 'How to Use Omnicassion Wishlists to Save and Compare Vendors',
    slug: 'how-to-use-omnicassion-wishlists',
    excerpt: 'Save your favourite vendors, organise them by category, and compare side-by-side before booking. Complete guide to Omnicassion\'s wishlist feature.',
    content: content.trim(),
    metaTitle: 'How to Use Omnicassion Wishlists | Save & Compare Vendors Guide',
    metaDescription: 'Never lose track of a great vendor again. Learn how to save, organise, and compare vendors using Omnicassion\'s wishlist feature.',
    focusKeyword: 'omnicassion wishlist',
    keywords: ['save vendors for wedding india', 'omnicassion wishlists guide', 'compare wedding vendors chandigarh', 'event vendor shortlist'],
    featuredImageAlt: 'Omnicassion wishlist page showing saved wedding photographers and venues',
    status: BlogStatus.PUBLISHED,
    readingTime: 0,
    authorId,
    categorySlug: 'platform-guides',
    tagSlugs: ['wishlists', 'vendor-comparison', 'how-to', 'planning'],
  };

  post.readingTime = calculateReadingTime(post.content);
  return sanitize(post);
}

// ============================================================================
// BLOG 9 — MESSAGING & INQUIRIES
// ============================================================================

function generateMessagingGuide(authorId: string): InternalBlogPost {
  const content = `
<h1>How to Message Vendors and Manage Inquiries on Omnicassion</h1>

<p>Connecting with a vendor used to mean cold calls, WhatsApp forwards to unknown numbers, and Instagram DMs that get buried in hundreds of other messages. Omnicassion's built-in Messaging and Inquiry system gives you a professional, organised space to contact every vendor, receive quotes, negotiate packages, and confirm bookings — all tracked in one place.</p>

<h2>Understanding Inquiries vs. Messages</h2>
<p>On Omnicassion there are two related but distinct concepts:</p>
<ul>
  <li><strong>Inquiry</strong> — A formal introduction to a vendor that triggers the conversation. It carries your event details, date, and specific request. Think of it as a structured first-contact form.</li>
  <li><strong>Message</strong> — The ongoing chat thread that happens after an inquiry is sent. All subsequent back-and-forth lives here.</li>
</ul>
<p>Every inquiry automatically creates a message thread, so the entire conversation — from first contact to booking confirmation — is in one place.</p>

<h2>Step 1: Send an Inquiry</h2>
<p>Find a vendor you're interested in on the Discover page or through a Wishlist. On their profile, click <strong>Send Inquiry</strong> or <strong>Get a Quote</strong>. The inquiry form prompts you to fill in:</p>
<ul>
  <li><strong>Event Type</strong> (Wedding, Birthday, Corporate)</li>
  <li><strong>Event Date</strong></li>
  <li><strong>Venue / Location</strong></li>
  <li><strong>Approximate Guest Count</strong></li>
  <li><strong>Specific Service Required</strong></li>
  <li><strong>Budget Range</strong></li>
  <li><strong>Your Message</strong> — A personalized note to the vendor</li>
</ul>
<p>Click <strong>Send</strong>. The vendor receives an instant notification and your conversation thread is created in Messages.</p>

<h2>Step 2: Access Your Messages</h2>
<p>Click <strong>Messages</strong> in the sidebar. The messaging workspace shows:</p>
<ul>
  <li><strong>Conversation List</strong> — Left panel showing all vendor threads with latest message preview and timestamp</li>
  <li><strong>Active Chat</strong> — Right panel showing the full conversation with the selected vendor</li>
  <li><strong>Inquiry Details</strong> — Each thread shows the original inquiry details at the top for context</li>
</ul>

<h2>Step 3: Communicating Effectively with Vendors</h2>
<p>Once a vendor responds, use the chat to:</p>
<ul>
  <li>Ask detailed questions about their package inclusions</li>
  <li>Request a customised quote for your specific event size and requirements</li>
  <li>Share reference images — mood boards, decoration styles, photography examples</li>
  <li>Negotiate — vendors often have flexibility on pricing, especially for larger bookings or off-peak dates</li>
  <li>Confirm availability and hold dates</li>
  <li>Get details of advance payment and contract terms</li>
</ul>

<h2>Step 4: Managing Multiple Conversations</h2>
<p>It's normal to be talking to 3–5 vendors in the same category simultaneously while you compare options. The conversation list keeps everything organised. Use the <strong>search bar</strong> at the top of the messages panel to quickly find a specific vendor thread by name.</p>

<h2>Step 5: Status Tracking for Inquiries</h2>
<p>Each conversation has a status tag:</p>
<ul>
  <li><strong>New</strong> — Sent, awaiting vendor response</li>
  <li><strong>Active</strong> — In conversation with the vendor</li>
  <li><strong>Negotiating</strong> — Quote received, discussing details</li>
  <li><strong>Booked</strong> — Mark this when you confirm the booking</li>
  <li><strong>Declined</strong> — You or the vendor have passed on this booking</li>
</ul>
<p>Update status manually to keep your inbox clean — especially as you narrow down from 10 conversations to the few vendors you actually book.</p>

<h2>Tips for Getting the Best Vendor Responses</h2>
<ul>
  <li><strong>Be specific</strong> — "I need a wedding photographer for a 300-person reception in Mohali on 15 March" gets much faster and more relevant responses than generic inquiries</li>
  <li><strong>Include your budget range</strong> — Vendors can tailor quotes appropriately and you avoid wasting time on proposals outside your range</li>
  <li><strong>Respond promptly</strong> — Top vendors in the Tricity get multiple inquiries daily. Quick responses signal you're serious and help you secure dates</li>
  <li><strong>Ask about availability first</strong> — Before going deep into package negotiation, confirm the vendor is free on your date</li>
</ul>

<h2>Business Owners: Managing Inquiries</h2>
<p>If you're a vendor on Omnicassion, your own messaging inbox is at <strong>/business-messages</strong>. Here you see all incoming planner inquiries, can respond promptly, manage multiple conversations simultaneously, and update lead statuses. A high response rate and fast reply time are key factors in your vendor ranking on the platform.</p>

<h2>Frequently Asked Questions</h2>
<h3>Are my messages private?</h3>
<p>Yes. Messages are strictly between you and the vendor. Omnicassion staff do not read your conversations.</p>

<h3>What if a vendor is unresponsive?</h3>
<p>If a vendor doesn't respond within 48 hours, try sending a polite follow-up message. If they remain unresponsive, report this via the vendor profile so our team can follow up. Move on to other vendors in the meantime.</p>

<h3>Can I attach files or images in messages?</h3>
<p>Yes. You can send images, PDFs, and reference files directly in the chat — ideal for sharing venue layouts, decoration mood boards, or photography style references.</p>
`;

  const post: InternalBlogPost = {
    title: 'How to Message Vendors and Manage Inquiries on Omnicassion',
    slug: 'how-to-message-vendors-manage-inquiries-omnicassion',
    excerpt: 'Send inquiries, receive vendor quotes, negotiate packages, and confirm bookings — all in Omnicassion\'s built-in messaging system. Full guide for planners and vendors.',
    content: content.trim(),
    metaTitle: 'How to Message Vendors on Omnicassion | Inquiry & Chat Guide',
    metaDescription: 'Learn how to send inquiries, chat with vendors, and manage all your booking conversations in one place using Omnicassion\'s messaging system.',
    focusKeyword: 'omnicassion messaging vendors',
    keywords: ['contact vendors online india', 'omnicassion inquiry system', 'event vendor communication app', 'book vendor chandigarh online'],
    featuredImageAlt: 'Omnicassion messaging workspace showing vendor inquiry conversation threads',
    status: BlogStatus.PUBLISHED,
    readingTime: 0,
    authorId,
    categorySlug: 'platform-guides',
    tagSlugs: ['messaging', 'inquiries', 'how-to', 'vendor-booking'],
  };

  post.readingTime = calculateReadingTime(post.content);
  return sanitize(post);
}

// ============================================================================
// BLOG 10 — AI ASSISTANT
// ============================================================================

function generateAIAssistantGuide(authorId: string): InternalBlogPost {
  const content = `
<h1>How to Use the Omnicassion AI Assistant for Event Planning</h1>

<p>What if you had a knowledgeable event planning advisor available 24 hours a day — someone who knows the Chandigarh, Mohali, and Panchkula vendor market inside out, can generate checklists on demand, estimate budgets instantly, and help you through every decision? That's the Omnicassion AI Assistant. Here's how to get the most out of it.</p>

<h2>What is the Omnicassion AI Assistant?</h2>
<p>The AI Assistant is a conversational AI built specifically for event planning in the Tricity region. It can answer questions about planning timelines, suggest vendors based on your requirements, help you write vendor inquiry messages, generate budget estimates, build checklists, advise on traditions and ceremonies, and much more — all in natural language, in English or Hindi.</p>

<h2>How to Access the AI Assistant</h2>
<p>There are two ways to open the AI Assistant:</p>
<ul>
  <li><strong>Floating button</strong> — Look for the sparkle or chat icon at the bottom-right corner of any page. Click it to open a chat bubble without leaving your current page</li>
  <li><strong>Assistant page</strong> — Navigate to <strong>/assistant</strong> for a full-screen dedicated AI chat experience with conversation history</li>
</ul>

<h2>What You Can Ask the AI Assistant</h2>
<p>The assistant is trained for event planning in India. Here are the kinds of questions it handles best:</p>

<h3>Budget Questions</h3>
<ul>
  <li>"What's a realistic budget for a 200-person wedding reception in Chandigarh?"</li>
  <li>"How much should I budget for outdoor decoration in Mohali?"</li>
  <li>"What's the average catering cost per plate at Tricity wedding venues?"</li>
  <li>"How do I split my ₹30 lakh wedding budget across categories?"</li>
</ul>

<h3>Checklist & Timeline Help</h3>
<ul>
  <li>"Give me a complete 6-month wedding planning checklist"</li>
  <li>"What tasks should I complete 2 months before my wedding?"</li>
  <li>"Create a timeline for a traditional Punjabi wedding reception"</li>
  <li>"What do I need to do in the week before my event?"</li>
</ul>

<h3>Vendor Advice</h3>
<ul>
  <li>"What questions should I ask a wedding photographer before booking?"</li>
  <li>"What should be included in a catering contract?"</li>
  <li>"How do I compare two decoration vendors?"</li>
  <li>"What's the difference between candid and traditional wedding photography?"</li>
</ul>

<h3>Ceremony and Tradition Guides</h3>
<ul>
  <li>"Explain the order of ceremonies in a Punjabi wedding"</li>
  <li>"What is the significance of the Anand Karaj ceremony?"</li>
  <li>"What rituals happen during a Sikh wedding reception?"</li>
  <li>"Create a programme for a Hindu wedding ceremony"</li>
</ul>

<h3>Venue and Location Help</h3>
<ul>
  <li>"What are the best wedding venues in Mohali Phase 3?"</li>
  <li>"What factors should I consider when choosing a banquet hall in Chandigarh?"</li>
  <li>"Is January or February better for outdoor weddings in the Tricity?"</li>
</ul>

<h2>Step-by-Step: Getting a Budget Estimate</h2>
<ol>
  <li>Open the AI Assistant from any page</li>
  <li>Type: <em>"I'm planning a 250-guest wedding reception in Panchkula in December 2026. My total budget is ₹40 lakhs. How should I distribute it across categories?"</em></li>
  <li>The assistant returns a detailed category-by-category breakdown with approximate amounts and percentages</li>
  <li>Follow up with: <em>"How much should I keep as a contingency buffer?"</em> or <em>"Which category has the most flexibility for cutting costs?"</em></li>
</ol>

<h2>Tips for Getting the Best Answers</h2>
<ul>
  <li><strong>Be specific</strong> — The more context you give (event type, guest count, date, budget, location), the more accurate and useful the response</li>
  <li><strong>Follow up</strong> — Ask follow-up questions to drill deeper. The assistant remembers the full context of your conversation</li>
  <li><strong>Use it proactively</strong> — Don't wait until you're stuck. Start conversations early to help structure your thinking before you've even created your event</li>
  <li><strong>Ask it to write for you</strong> — Need a vendor inquiry message? Say "Write me a professional inquiry message to a Chandigarh wedding photographer for a March 2026 wedding with 300 guests and a photography budget of ₹1.5 lakhs"</li>
</ul>

<h2>What the AI Assistant Cannot Do</h2>
<p>The AI Assistant is very capable, but has some limitations to be aware of:</p>
<ul>
  <li>It cannot directly book vendors on your behalf — that requires using the inquiry/messaging system</li>
  <li>It cannot access real-time vendor availability or current pricing (use vendor profiles for live data)</li>
  <li>It cannot legally advise on contracts or disputes</li>
  <li>It does not have access to your personal account data unless you share it in the conversation</li>
</ul>

<h2>Using the AI with Your Omnicassion Tools</h2>
<p>The AI Assistant works best as a <em>companion</em> to your other Omnicassion tools:</p>
<ul>
  <li>Ask the AI to generate a checklist → then add the tasks to your actual <strong>Checklist</strong> tool</li>
  <li>Ask the AI for a budget breakdown → then enter the amounts into your <strong>Budget</strong> tracker</li>
  <li>Ask the AI what to look for in a vendor → then go to <strong>Discover</strong> and apply those criteria</li>
  <li>Ask the AI to write an inquiry message → copy it into <strong>Messages</strong> when you send your inquiry</li>
</ul>
<p>This workflow makes you dramatically more effective than using either the AI or the tools alone.</p>

<h2>Frequently Asked Questions</h2>
<h3>Is the AI Assistant available 24/7?</h3>
<p>Yes. The AI Assistant is available any time of day or night, at no cost to planners.</p>

<h3>Can I use the AI in Hindi?</h3>
<p>Yes. The assistant understands both English and Hindi and can respond in either language depending on your preference.</p>

<h3>Are my conversations with the AI private?</h3>
<p>Yes. Your AI conversations are private and are not shared with vendors or other users on the platform.</p>

<h3>How accurate is the budget advice?</h3>
<p>The AI provides estimates based on Tricity regional market data. Always verify specific vendor pricing through actual quotes — costs vary significantly based on the specific vendor, season, and package details.</p>
`;

  const post: InternalBlogPost = {
    title: 'How to Use the Omnicassion AI Assistant for Event Planning',
    slug: 'how-to-use-omnicassion-ai-assistant',
    excerpt: 'Omnicassion\'s AI Assistant is available 24/7 to answer budget questions, generate checklists, advise on vendors, write inquiry messages, and guide you through every event planning decision.',
    content: content.trim(),
    metaTitle: 'How to Use Omnicassion AI Assistant | Event Planning AI Guide',
    metaDescription: 'Get instant event planning help with Omnicassion\'s AI Assistant. Ask budget questions, generate checklists, get vendor advice, and more — 24/7.',
    focusKeyword: 'omnicassion AI assistant event planning',
    keywords: ['AI event planning assistant india', 'chatbot wedding planner chandigarh', 'omnicassion AI guide', 'event planning AI tool'],
    featuredImageAlt: 'Omnicassion AI assistant chat interface answering wedding planning questions',
    status: BlogStatus.PUBLISHED,
    readingTime: 0,
    authorId,
    categorySlug: 'platform-guides',
    tagSlugs: ['ai-assistant', 'chatbot', 'how-to', 'event-planning'],
  };

  post.readingTime = calculateReadingTime(post.content);
  return sanitize(post);
}

// ============================================================================
// TEMPLATE REGISTRY
// ============================================================================

type BlogGenerator = (authorId: string) => InternalBlogPost;

const internalBlogTemplates: Record<string, { label: string; fn: BlogGenerator }> = {
  'getting-started':    { label: 'Getting Started with Omnicassion',          fn: generateGettingStarted },
  'find-book-vendors':  { label: 'How to Find and Book Vendors',               fn: generateFindBookVendors },
  'manage-events':      { label: 'How to Create and Manage Your Event',        fn: generateManageEvents },
  'checklist-guide':    { label: 'How to Use the Event Checklist',             fn: generateChecklistGuide },
  'budget-guide':       { label: 'How to Track Your Event Budget',             fn: generateBudgetGuide },
  'guestlist-guide':    { label: 'How to Manage Your Guest List',              fn: generateGuestlistGuide },
  'timeline-guide':     { label: 'How to Build Your Event Timeline',           fn: generateTimelineGuide },
  'wishlist-guide':     { label: 'How to Use Wishlists',                       fn: generateWishlistGuide },
  'messaging-guide':    { label: 'How to Message Vendors & Manage Inquiries',  fn: generateMessagingGuide },
  'ai-assistant-guide': { label: 'How to Use the AI Assistant',                fn: generateAIAssistantGuide },
};

// ============================================================================
// DATABASE PERSISTENCE
// ============================================================================

async function saveBlogPost(prisma: PrismaClient, post: InternalBlogPost): Promise<void> {
  // Find or create category
  let category = await prisma.blogCategory.findUnique({ where: { slug: post.categorySlug } });
  if (!category) {
    category = await prisma.blogCategory.create({
      data: {
        name: 'Platform Guides',
        slug: post.categorySlug,
        description: 'Step-by-step guides on how to use every feature of Omnicassion',
        isActive: true,
      },
    });
  }

  // Find or create tags
  const tagIds: string[] = [];
  for (const tagSlug of post.tagSlugs) {
    let tag = await prisma.blogTag.findUnique({ where: { slug: tagSlug } });
    if (!tag) {
      tag = await prisma.blogTag.create({
        data: {
          name: tagSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          slug: tagSlug,
        },
      });
    }
    tagIds.push(tag.id);
  }

  // Upsert blog post (avoid duplicates on re-run)
  const existing = await prisma.blogPost.findUnique({ where: { slug: post.slug } });
  let createdPost;
  if (existing) {
    createdPost = await prisma.blogPost.update({
      where: { slug: post.slug },
      data: {
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        metaTitle: post.metaTitle,
        metaDescription: post.metaDescription,
        focusKeyword: post.focusKeyword,
        keywords: post.keywords,
        featuredImageAlt: post.featuredImageAlt,
        status: post.status,
        readingTime: post.readingTime,
        categoryId: category.id,
      },
    });
    console.log(`  Updated: ${createdPost.title}`);
  } else {
    createdPost = await prisma.blogPost.create({
      data: {
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        metaTitle: post.metaTitle,
        metaDescription: post.metaDescription,
        focusKeyword: post.focusKeyword,
        keywords: post.keywords,
        featuredImageAlt: post.featuredImageAlt,
        status: post.status,
        readingTime: post.readingTime,
        categoryId: category.id,
        authorId: post.authorId,
      },
    });
    console.log(`  Created: ${createdPost.title}`);
  }

  // Upsert tag associations
  for (const tagId of tagIds) {
    const existingTag = await prisma.blogPostTag.findUnique({
      where: { postId_tagId: { postId: createdPost.id, tagId } },
    });
    if (!existingTag) {
      await prisma.blogPostTag.create({ data: { postId: createdPost.id, tagId } });
    }
  }
}

// ============================================================================
// CLI DISPLAY HELPER
// ============================================================================

function displayPost(post: InternalBlogPost): void {
  console.log('\n' + '='.repeat(60));
  console.log(`Title:       ${post.title}`);
  console.log(`Slug:        ${post.slug}`);
  console.log(`Category:    ${post.categorySlug}`);
  console.log(`Reading Time:${post.readingTime} min`);
  console.log(`Words:       ~${post.content.split(/\s+/).length}`);
  console.log(`Meta Title:  ${post.metaTitle}`);
  console.log(`Meta Desc:   ${post.metaDescription}`);
  console.log(`Tags:        ${post.tagSlugs.join(', ')}`);
  console.log('\nExcerpt:');
  console.log(post.excerpt);
  console.log('\n--- Content Preview (500 chars) ---');
  console.log(post.content.replace(/<[^>]*>/g, '').substring(0, 500) + '...');
}

// ============================================================================
// MAIN CLI
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
Omnicassion Internal Blog Generator
=====================================
Generates "How to Use Omnicassion" platform guide articles

Usage:
  npx ts-node scripts/generate-internal-blogs.ts <command> [options]

Commands:
  generate-all <authorId> [--save]   Generate all 10 internal blogs
  generate <type> <authorId> [--save] Generate a specific blog
  list                               List all available blog types

Available Types:
${Object.entries(internalBlogTemplates).map(([k, v]) => `  - ${k.padEnd(22)} ${v.label}`).join('\n')}

Examples:
  npx ts-node scripts/generate-internal-blogs.ts list
  npx ts-node scripts/generate-internal-blogs.ts generate getting-started <authorId>
  npx ts-node scripts/generate-internal-blogs.ts generate getting-started <authorId> --save
  npx ts-node scripts/generate-internal-blogs.ts generate-all <authorId> --save
`);
    return;
  }

  const command = args[0];

  // ===== LIST =====
  if (command === 'list') {
    console.log('\nAvailable Internal Blog Templates:');
    console.log('===================================\n');
    Object.entries(internalBlogTemplates).forEach(([key, val]) => {
      console.log(`  ${key.padEnd(24)} ${val.label}`);
    });
    console.log(`\nTotal: ${Object.keys(internalBlogTemplates).length} templates`);
    return;
  }

  // ===== GENERATE ONE =====
  if (command === 'generate') {
    const type = args[1];
    const authorId = args[2];
    const saveToDb = args[3] === '--save';

    if (!type || !authorId) {
      console.error('Error: Missing arguments');
      console.error('Usage: generate <type> <authorId> [--save]');
      process.exit(1);
    }

    const template = internalBlogTemplates[type];
    if (!template) {
      console.error(`Error: Unknown type "${type}". Run "list" to see available types.`);
      process.exit(1);
    }

    const post = template.fn(authorId);
    displayPost(post);

    if (saveToDb) {
      const prisma = createPrismaClient();
      try {
        console.log('\nSaving to database...');
        await saveBlogPost(prisma, post);
        console.log('✓ Saved successfully');
      } finally {
        await prisma.$disconnect();
      }
    } else {
      console.log('\nAdd --save to persist to database.');
    }
    return;
  }

  // ===== GENERATE ALL =====
  if (command === 'generate-all') {
    const authorId = args[1];
    const saveToDb = args[2] === '--save';

    if (!authorId) {
      console.error('Error: Missing authorId');
      console.error('Usage: generate-all <authorId> [--save]');
      process.exit(1);
    }

    const types = Object.keys(internalBlogTemplates);
    console.log(`\nGenerating all ${types.length} internal blog posts...`);

    let prisma: PrismaClient | null = null;
    if (saveToDb) {
      prisma = createPrismaClient();
    }

    const generated: InternalBlogPost[] = [];

    try {
      for (let i = 0; i < types.length; i++) {
        const type = types[i];
        const template = internalBlogTemplates[type];
        console.log(`\n[${i + 1}/${types.length}] ${template.label}`);

        const post = template.fn(authorId);
        generated.push(post);

        console.log(`  Slug:      ${post.slug}`);
        console.log(`  Words:     ~${post.content.split(/\s+/).length}`);
        console.log(`  Read Time: ${post.readingTime} min`);

        if (saveToDb && prisma) {
          await saveBlogPost(prisma, post);
        }
      }

      console.log('\n' + '='.repeat(60));
      console.log('INTERNAL BLOG GENERATION SUMMARY');
      console.log('='.repeat(60));
      console.log(`Total posts generated: ${generated.length}`);
      console.log(`Total words:           ~${generated.reduce((s, p) => s + p.content.split(/\s+/).length, 0)}`);
      console.log(`Avg reading time:      ${Math.round(generated.reduce((s, p) => s + p.readingTime, 0) / generated.length)} min`);

      if (saveToDb) {
        console.log('\nStatus: All posts saved to database ✓');
      } else {
        console.log('\nStatus: Preview only. Run with --save to persist.');
      }

      console.log('\nGenerated posts:');
      generated.forEach((p, i) => {
        console.log(`  ${(i + 1).toString().padStart(2)}. ${p.title.substring(0, 55).padEnd(55)} [${p.readingTime}m]`);
      });

    } catch (err) {
      console.error('Error during generation:', err);
      process.exit(1);
    } finally {
      if (prisma) await prisma.$disconnect();
    }
    return;
  }

  console.error(`Unknown command: "${command}". Run without arguments for help.`);
  process.exit(1);
}

main().catch(console.error);

export {
  internalBlogTemplates,
  saveBlogPost,
  createPrismaClient,
  InternalBlogPost,
};
