# Omnicassion V2.0: Master Product Specification
**Document Type:** Detailed Feature & Requirement Specification  
**Version:** 2.0 (Enterprise Scalable)  
**Goal:** To build India's most efficient, visual-first Event Planning Ecosystem.

---

## 1. Module A: The User Experience (The "Planner")
*Target Audience: Couples, Families, Event Planners.*

### 1.1 Authentication & Onboarding
* **Social Login:** One-tap login via Google & Truecaller (essential for verifying phone numbers instantly).
* **"Wedding Identity":** Users create a joint profile (e.g., "Rohit & Riya") so both partners can edit the same plan from different phones.
* **The "Vibe" Quiz:** A visual onboarding step where users select 5 photos they like. This trains the algorithm to show them relevant content immediately.

### 1.2 The Visual Discovery Engine (Pinterest-Style Feed)
* **Infinite Masonry Grid:** High-performance image feed that auto-adjusts to screen size.
* **Smart Filters:**
    * *By Attribute:* Color (Red, Pastel), Style (Royal, Boho), Time (Day/Night).
    * *By Budget:* "Show me decor under ₹2 Lakhs."
* **"Shop the Look" Logic:** Every photo is tagged with the exact vendor.
    * *Action:* User clicks a photo -> sees "Get Quote" button -> Lead goes to Vendor.
* **Wishlists:** Users can create multiple boards (e.g., "Haldi Ideas," "Reception Outfits").

### 1.3 The Digital Planning Suite
* **Guest List Manager 2.0:**
    * **WhatsApp Integration:** Send invites directly to WhatsApp contacts.
    * **Grouping:** Tag guests as "Bride Side," "Groom Side," "VIP," "Staff."
    * **RSVP Tracker:** Real-time dashboard showing "Accepted," "Declined," "Pending."
* **Smart Checklist:**
    * **Timeline Logic:** Tasks unlock based on the event date (e.g., "2 Months to Go: Book Makeup Artist").
    * **Gamification:** Progress bar shows "40% Planned" to encourage users to keep coming back.
* **Budget Calculator (Pre-AI):**
    * Manual tracker where users input expenses.
    * *Future Data:* This creates the dataset needed to train your AI Budget Advisor later.

### 1.4 Event Memories (The Viral Loop)
* **QR Code Generator:** System auto-generates a printable QR code poster for the event venue.
* **Guest Upload Portal:**
    * No-Login required for guests (reduces friction).
    * **Live Slideshow:** (Optional Pro Feature) Photos uploaded by guests can be streamed live on a projector at the venue.
* **Privacy Controls:** Admin (User) must approve photos before they go public on the gallery.

---

## 2. Module B: The Vendor Experience (The "Business")
*Target Audience: Photographers, Makeup Artists, Caterers, Venues.*

### 2.1 The "Instagram-Style" Portfolio
* **Drag & Drop Uploads:** Vendors can upload up to 20 photos at once.
* **Intelligent Tagging (Auto-SEO):**
    * Vendor selects: *Category* (Makeup) + *City* (Amritsar).
    * **System Action:** Auto-renames files to `bridal-makeup-amritsar-omnicassion.jpg` for Google ranking.
* **Video Integration:** Support for YouTube Links and Instagram Reels embeds (crucial for engagement).

### 2.2 Vendor Dashboard & Analytics
* **Lead CRM:**
    * View all inquiries with status: *New, Contacted, Meeting Scheduled, Booked, Lost.*
    * **"Quick Reply" Templates:** One-tap WhatsApp replies (e.g., "Hi, thanks for your inquiry! Here is my rate card...").
* **Performance Insights:**
    * "How many people viewed my profile?"
    * "How many saved my photos?" (This tells them what style is trending).

### 2.3 Calendar & Availability
* **Date Blocking:** Vendors can mark dates as "Booked" so users don't waste time inquiring for unavailable dates.

---

## 3. Module C: Internal Operations (The "Control Tower")
*Target Audience: Your Admin Team, Sales Managers.*

### 3.1 The "Concierge" CRM (Sales Manager Tool)
* **Lead Routing Logic:**
    * System assigns incoming high-value leads to a Sales Manager first.
    * Manager calls the user to verify requirements.
    * Manager "Broadcasts" the lead to 3-5 suitable vendors.
* **Commission Tracking:** If your model includes commissions, track which leads converted into actual bookings.

### 3.2 Content Management System (CMS)
* **Blog/Article Manager:** For your "Content Writers" to publish SEO articles (e.g., "Top 10 Venues in Punjab").
* **Featured Vendor Management:** Admin can manually boost a vendor to the top of the homepage (Monetization feature).

### 3.3 Dispute Resolution Center
* A ticket system where Users or Vendors can flag issues (e.g., "Vendor didn't show up").

---

## 4. Detailed Real-Life Usage Scenarios

### Scenario 1: The "Planning" Flow (User Side)
> **Persona:** *Simran, getting married in 6 months.*

1.  **Trigger:** Simran is browsing Instagram but it's unorganized. She comes to Omnicassion.
2.  **Search:** She searches "Pastel Pink Decor Amritsar."
3.  **Visual Discovery:** She sees a specific stage design she loves.
4.  **Action:** She clicks **"Get Quote"**.
    * *System Check:* Is she logged in? No -> Trigger Login via Truecaller.
5.  **Data Capture:** System asks: "What is your event date? Budget for decor?"
6.  **Gratification:** System says "Request sent to **Elite Decors**. While you wait, create your free Guest List?"
7.  **Retention:** Simran starts adding guests. She is now "hooked" into the ecosystem.

### Scenario 2: The "Business" Flow (Vendor Side)
> **Persona:** *Raj, a Wedding Photographer.*

1.  **Notification:** Raj gets a WhatsApp msg: *"New Lead: Simran, Dec 12th. Budget ₹1.5L. Click to View."*
2.  **Response:** He clicks the link. It opens his Vendor Dashboard.
3.  **Action:** He clicks **"Accept Lead"**.
4.  **Conversion:** He uses the "Quick Reply" feature to send his PDF Portfolio to Simran via WhatsApp.
5.  **Marketing:** Later that night, Raj uploads photos from today's shoot. He tags them `#NightWedding`. These photos instantly appear on the Omnicassion Feed, generating leads for next week.

### Scenario 3: The "Memory" Flow (Guest Side)
> **Persona:** *Vikram, a guest at Simran's wedding.*

1.  **Event Day:** Vikram takes a great candid photo of the couple.
2.  **Discovery:** He sees a table card: *"Scan to upload to Simran's Album."*
3.  **Upload:** He scans the QR code. A web page opens (Fast load, no app install).
4.  **Contribution:** He selects 3 photos and hits "Upload."
5.  **Reward:** The screen thanks him and shows a "Live Feed" of other guests' photos.
6.  **Viral Hook:** A small banner at the bottom says: *"Planning an event? Get your own Memory Wall on Omnicassion."*

---

## 5. Technical Efficiency Features (For Developers)

To ensure the website is **efficient** (fast and scalable), we will implement:

1.  **Lazy Loading:** Images in the feed only load when the user scrolls near them.
2.  **Image Optimization:** All uploads are automatically converted to **WebP** format (smaller size, same quality) to save data.
3.  **Edge Caching:** Content is served from servers closest to the user (CDN) so the site loads instantly in any city.
4.  **Progressive Web App (PWA):** Users can "Install" the website on their phone home screen without going to the App Store.

Omnicassion V2.0: Dual-Origin Master Workflow
Document Goal: To define how events enter the system from two different sources and how they are executed uniformly.
________________________________________
Part 1: Event Initiation (The Two Entry Points)
Scenario A: The "Digital Lead" (User-Driven)
Best for: Users browsing the website/app who want a specific look.
1.	Discovery (User): User browses the Visual Feed > Clicks a photo > Clicks "Get Quote".
2.	System Action:
o	Captures: User Name, Phone, Date, Budget, and the Reference Image ID.
o	Creates Record: CRM Lead (Status: New).
3.	Verification (Ops Admin):
o	Admin receives notification.
o	Admin calls User to verify requirements.
4.	Conversion:
o	Admin clicks "Convert to Event".
o	System moves data from CRM Lead > Active Event.
Scenario B: The "Direct Booking" (Internal-Driven)
Best for: Offline walk-ins, phone referrals, or VIP clients who don't use the app.
1.	Trigger: Client calls or visits the office directly.
2.	Manual Entry (Ops Admin):
o	Admin logs into "Control Tower".
o	Clicks "Create New Event".
3.	Data Input:
o	Admin manually fills: Client Name, Event Date, Total Budget, Event Type (Wedding/Concert).
o	Note: No "Reference Image" is linked automatically, but Admin can upload reference files manually.
4.	Creation:
o	Admin clicks "Save & Initialize".
o	System creates Record: Active Event.
________________________________________
Part 2: The Unified Execution Loop
Once an event is created (via Scenario A or B), the workflow becomes identical.
Step 1: Assignment & Setup
•	Actor: Ops Admin
•	Action: views the new Active Event on the Dashboard.
•	Task: Selects an Ops Manager from the dropdown list.
•	Result: The Event now appears in that specific Ops Manager's app/dashboard.
Step 2: Requirement Breakdown
•	Actor: Ops Manager
•	Action: Reviews Client details (and Reference Images if from Scenario A).
•	Task: Creates a Requirement Sheet.
o	Example: "Need 1 Photographer, 1 Decorator, 2 Security Guards."
Step 3: Vendor Agreement Cycle (Financial Logic)
This is the core "Business" engine.
1.	Selection: Manager searches Internal Vendor Database > Selects Vendor.
2.	Negotiation: Manager talks to Vendor offline > Enters "Agreed Amount" into system.
3.	Digital Contract: Manager clicks "Send Agreement".
4.	Vendor Action:
o	Vendor receives App Notification.
o	Vendor clicks "Accept".
5.	Result:
o	Status becomes Contract Locked.
o	System generates a Provisional Invoice.
o	Cost is updated in Ops Admin's "Total Spend" view.
Step 4: Task Delegation (The "Boots on the Ground")
•	Actor: Ops Manager
•	Action: Converts the "Requirement Sheet" into actionable Tasks.
•	Delegation: Assigns tasks to Ops Assistants (Staff) or Vendors.
o	Task Example: "Go to Venue X and collect advance payment check."
o	Task Example: "Upload stage setup photos by 4 PM."
Step 5: Evidence & Closure
•	Actor: Ops Assistant
•	Action: Receives task on mobile.
•	Proof: Performs work > Uploads Attachments (Photos/PDFs) as proof.
•	Submission: Marks task as Submitted for Review.
•	Closure: Ops Manager verifies proof > Marks Closed.
________________________________________
Part 3: High-Level Oversight (Ops Admin View)
The Admin watches both Scenario A and B events in one single dashboard.
View	Metric	Purpose
Global Calendar	All Events (Web + Offline)	To see date clashes or resource shortages.
Financial Dashboard	Total Cost vs. Client Budget	To ensure profit margins are met across all events.
Team Analytics	Task Completion Rate	To see if Managers/Assistants are working efficiently.
Invoice Center	Pending Payments	To track which Vendors need to be paid.



