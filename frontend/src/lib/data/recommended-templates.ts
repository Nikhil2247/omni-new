// Recommended templates for Timeline, Budget, and Checklist tools

export interface ChecklistTemplateItem {
  title: string
  description?: string
  category: string
}

export interface ChecklistTemplate {
  id: string
  name: string
  description: string
  eventType: string
  items: ChecklistTemplateItem[]
}

export interface TimelineTemplateItem {
  title: string
  description: string
  scheduledTime: string
  duration: number
}

export interface TimelineTemplate {
  id: string
  name: string
  description: string
  eventType: string
  items: TimelineTemplateItem[]
}

export interface BudgetTemplateItem {
  category: string
  name: string
  percentageOfTotal: number
}

export interface BudgetTemplate {
  id: string
  name: string
  description: string
  eventType: string
  items: BudgetTemplateItem[]
}

// Timeline Templates
export const TIMELINE_TEMPLATES: TimelineTemplate[] = [
  {
    id: 'wedding-traditional',
    name: 'Traditional Wedding',
    description: 'Classic wedding day schedule with ceremonies and reception',
    eventType: 'WEDDING',
    items: [
      { title: 'Bride & Groom Getting Ready', description: 'Hair, makeup, and dressing', scheduledTime: '08:00', duration: 180 },
      { title: 'Photo Session', description: 'Pre-ceremony photos', scheduledTime: '11:00', duration: 60 },
      { title: 'Guest Arrival', description: 'Guests arrive at venue', scheduledTime: '12:00', duration: 30 },
      { title: 'Ceremony', description: 'Wedding ceremony', scheduledTime: '12:30', duration: 60 },
      { title: 'Cocktail Hour', description: 'Drinks and appetizers', scheduledTime: '13:30', duration: 60 },
      { title: 'Reception Entrance', description: 'Grand entrance of couple', scheduledTime: '14:30', duration: 15 },
      { title: 'First Dance', description: 'Couple\'s first dance', scheduledTime: '14:45', duration: 10 },
      { title: 'Lunch/Dinner', description: 'Main meal service', scheduledTime: '15:00', duration: 90 },
      { title: 'Cake Cutting', description: 'Cake cutting ceremony', scheduledTime: '16:30', duration: 15 },
      { title: 'Speeches & Toasts', description: 'Family and friends speeches', scheduledTime: '16:45', duration: 30 },
      { title: 'Dancing & Party', description: 'Open dance floor', scheduledTime: '17:15', duration: 180 },
      { title: 'Send Off', description: 'Grand exit', scheduledTime: '20:15', duration: 15 },
    ],
  },
  {
    id: 'wedding-indian',
    name: 'Indian Wedding',
    description: 'Traditional Indian wedding with multiple ceremonies',
    eventType: 'WEDDING',
    items: [
      { title: 'Baraat Arrival', description: 'Groom\'s procession arrival', scheduledTime: '10:00', duration: 60 },
      { title: 'Welcome Ceremony', description: 'Milni and welcome rituals', scheduledTime: '11:00', duration: 30 },
      { title: 'Mandap Ceremony', description: 'Main wedding rituals', scheduledTime: '11:30', duration: 120 },
      { title: 'Pheras', description: 'Sacred vows around fire', scheduledTime: '13:30', duration: 45 },
      { title: 'Sindoor & Mangalsutra', description: 'Final rituals', scheduledTime: '14:15', duration: 15 },
      { title: 'Vidaai', description: 'Bride\'s farewell', scheduledTime: '14:30', duration: 30 },
      { title: 'Reception Welcome', description: 'Guests arrive for reception', scheduledTime: '18:00', duration: 60 },
      { title: 'Couple Entrance', description: 'Grand entry of newlyweds', scheduledTime: '19:00', duration: 15 },
      { title: 'Dinner', description: 'Multi-course dinner service', scheduledTime: '19:15', duration: 120 },
      { title: 'Dancing & Celebration', description: 'DJ and dancing', scheduledTime: '21:15', duration: 180 },
    ],
  },
  {
    id: 'birthday-party',
    name: 'Birthday Party',
    description: 'Fun-filled birthday celebration timeline',
    eventType: 'BIRTHDAY',
    items: [
      { title: 'Setup & Decorations', description: 'Final venue setup', scheduledTime: '14:00', duration: 60 },
      { title: 'Guest Arrival', description: 'Welcome guests', scheduledTime: '15:00', duration: 30 },
      { title: 'Games & Activities', description: 'Party games', scheduledTime: '15:30', duration: 60 },
      { title: 'Snacks & Refreshments', description: 'Light bites', scheduledTime: '16:30', duration: 30 },
      { title: 'Cake Cutting', description: 'Birthday cake ceremony', scheduledTime: '17:00', duration: 15 },
      { title: 'Cake & Desserts', description: 'Dessert service', scheduledTime: '17:15', duration: 30 },
      { title: 'Gift Opening', description: 'Open presents', scheduledTime: '17:45', duration: 30 },
      { title: 'More Fun & Photos', description: 'Photo booth and activities', scheduledTime: '18:15', duration: 45 },
      { title: 'Thank You & Farewell', description: 'Guest departure', scheduledTime: '19:00', duration: 30 },
    ],
  },
  {
    id: 'corporate-event',
    name: 'Corporate Event',
    description: 'Professional corporate event schedule',
    eventType: 'CORPORATE',
    items: [
      { title: 'Registration', description: 'Guest check-in', scheduledTime: '09:00', duration: 30 },
      { title: 'Welcome & Opening', description: 'Opening remarks', scheduledTime: '09:30', duration: 15 },
      { title: 'Keynote Session', description: 'Main presentation', scheduledTime: '09:45', duration: 60 },
      { title: 'Coffee Break', description: 'Networking break', scheduledTime: '10:45', duration: 30 },
      { title: 'Panel Discussion', description: 'Expert panel', scheduledTime: '11:15', duration: 60 },
      { title: 'Lunch', description: 'Lunch service', scheduledTime: '12:15', duration: 60 },
      { title: 'Breakout Sessions', description: 'Workshop sessions', scheduledTime: '13:15', duration: 90 },
      { title: 'Closing Remarks', description: 'Summary and closing', scheduledTime: '14:45', duration: 15 },
      { title: 'Networking', description: 'Networking session', scheduledTime: '15:00', duration: 60 },
    ],
  },
]

// Budget Templates
export const BUDGET_TEMPLATES: BudgetTemplate[] = [
  {
    id: 'wedding-traditional',
    name: 'Traditional Wedding',
    description: 'Standard wedding budget breakdown',
    eventType: 'WEDDING',
    items: [
      { category: 'Venue', name: 'Venue rental & setup', percentageOfTotal: 35 },
      { category: 'Catering', name: 'Food & beverages', percentageOfTotal: 25 },
      { category: 'Photography', name: 'Photo & video', percentageOfTotal: 10 },
      { category: 'Decor', name: 'Decorations & flowers', percentageOfTotal: 8 },
      { category: 'Entertainment', name: 'DJ/Band & entertainment', percentageOfTotal: 5 },
      { category: 'Attire', name: 'Wedding attire & accessories', percentageOfTotal: 5 },
      { category: 'Invitations', name: 'Invites & stationery', percentageOfTotal: 3 },
      { category: 'Transportation', name: 'Guest & couple transport', percentageOfTotal: 3 },
      { category: 'Favors', name: 'Guest favors & gifts', percentageOfTotal: 2 },
      { category: 'Miscellaneous', name: 'Contingency & misc', percentageOfTotal: 4 },
    ],
  },
  {
    id: 'wedding-indian',
    name: 'Indian Wedding',
    description: 'Multi-day Indian wedding budget',
    eventType: 'WEDDING',
    items: [
      { category: 'Venue', name: 'Multiple venue rentals', percentageOfTotal: 30 },
      { category: 'Catering', name: 'Multi-cuisine catering', percentageOfTotal: 25 },
      { category: 'Decor', name: 'Mandap, flowers & decor', percentageOfTotal: 12 },
      { category: 'Photography', name: 'Photo, video & drone', percentageOfTotal: 8 },
      { category: 'Attire', name: 'Bridal & groom outfits', percentageOfTotal: 7 },
      { category: 'Entertainment', name: 'DJ, sangeet performances', percentageOfTotal: 5 },
      { category: 'Mehndi & Makeup', name: 'Bridal services', percentageOfTotal: 4 },
      { category: 'Invitations', name: 'Invites & E-invites', percentageOfTotal: 2 },
      { category: 'Transportation', name: 'Baraat & guest transport', percentageOfTotal: 3 },
      { category: 'Miscellaneous', name: 'Pandit, gifts, contingency', percentageOfTotal: 4 },
    ],
  },
  {
    id: 'birthday-party',
    name: 'Birthday Party',
    description: 'Birthday celebration budget',
    eventType: 'BIRTHDAY',
    items: [
      { category: 'Venue', name: 'Venue or home setup', percentageOfTotal: 25 },
      { category: 'Catering', name: 'Food & cake', percentageOfTotal: 30 },
      { category: 'Decor', name: 'Decorations & balloons', percentageOfTotal: 15 },
      { category: 'Entertainment', name: 'Games & activities', percentageOfTotal: 10 },
      { category: 'Invitations', name: 'Party invites', percentageOfTotal: 5 },
      { category: 'Favors', name: 'Party favors & return gifts', percentageOfTotal: 10 },
      { category: 'Miscellaneous', name: 'Contingency', percentageOfTotal: 5 },
    ],
  },
  {
    id: 'corporate-event',
    name: 'Corporate Event',
    description: 'Professional event budget',
    eventType: 'CORPORATE',
    items: [
      { category: 'Venue', name: 'Conference venue', percentageOfTotal: 30 },
      { category: 'Catering', name: 'Meals & refreshments', percentageOfTotal: 25 },
      { category: 'AV Equipment', name: 'Audio-visual setup', percentageOfTotal: 15 },
      { category: 'Marketing', name: 'Promotion & materials', percentageOfTotal: 10 },
      { category: 'Speakers', name: 'Speaker fees & travel', percentageOfTotal: 10 },
      { category: 'Miscellaneous', name: 'Contingency & misc', percentageOfTotal: 10 },
    ],
  },
]

// Checklist Templates
export const CHECKLIST_TEMPLATES: ChecklistTemplate[] = [
  {
    id: 'wedding-12-months',
    name: '12-Month Wedding',
    description: 'Complete wedding planning checklist starting 12 months before',
    eventType: 'WEDDING',
    items: [
      // 12 months before
      { title: 'Set wedding date', category: '12 Months Before', description: 'Choose your preferred wedding date' },
      { title: 'Determine budget', category: '12 Months Before', description: 'Decide on total wedding budget' },
      { title: 'Create guest list draft', category: '12 Months Before', description: 'Initial list of guests to invite' },
      { title: 'Book venue', category: '12 Months Before', description: 'Research and book wedding venue' },
      { title: 'Hire wedding planner', category: '12 Months Before', description: 'Optional but recommended' },
      // 9 months before
      { title: 'Book photographer', category: '9 Months Before', description: 'Research and book photography' },
      { title: 'Book videographer', category: '9 Months Before', description: 'Research and book videography' },
      { title: 'Choose wedding party', category: '9 Months Before', description: 'Select bridesmaids and groomsmen' },
      { title: 'Start dress shopping', category: '9 Months Before', description: 'Begin bridal dress search' },
      { title: 'Book caterer', category: '9 Months Before', description: 'Select and book catering service' },
      // 6 months before
      { title: 'Send save-the-dates', category: '6 Months Before', description: 'Mail or email save-the-dates' },
      { title: 'Book DJ or band', category: '6 Months Before', description: 'Book entertainment' },
      { title: 'Order wedding cake', category: '6 Months Before', description: 'Select and order cake' },
      { title: 'Book florist', category: '6 Months Before', description: 'Choose flowers and decorations' },
      { title: 'Plan honeymoon', category: '6 Months Before', description: 'Book honeymoon travel' },
      // 3 months before
      { title: 'Send invitations', category: '3 Months Before', description: 'Mail wedding invitations' },
      { title: 'Order wedding rings', category: '3 Months Before', description: 'Select and order rings' },
      { title: 'Book transportation', category: '3 Months Before', description: 'Arrange wedding day transport' },
      { title: 'Schedule dress fittings', category: '3 Months Before', description: 'Final alterations' },
      { title: 'Plan rehearsal dinner', category: '3 Months Before', description: 'Organize pre-wedding dinner' },
      // 1 month before
      { title: 'Confirm all vendors', category: '1 Month Before', description: 'Final confirmation with vendors' },
      { title: 'Get marriage license', category: '1 Month Before', description: 'Apply for marriage license' },
      { title: 'Final guest count', category: '1 Month Before', description: 'Confirm final attendance' },
      { title: 'Create seating chart', category: '1 Month Before', description: 'Finalize seating arrangements' },
      { title: 'Write vows', category: '1 Month Before', description: 'Prepare personal vows' },
      // Week of
      { title: 'Confirm timeline with vendors', category: 'Week Of', description: 'Final schedule confirmation' },
      { title: 'Pack for honeymoon', category: 'Week Of', description: 'Prepare travel bags' },
      { title: 'Rehearsal dinner', category: 'Week Of', description: 'Attend rehearsal dinner' },
      { title: 'Get beauty rest', category: 'Week Of', description: 'Rest before the big day' },
    ],
  },
  {
    id: 'wedding-indian',
    name: 'Indian Wedding',
    description: 'Multi-event Indian wedding checklist',
    eventType: 'WEDDING',
    items: [
      // Pre-wedding events
      { title: 'Book multiple venues', category: 'Pre-Wedding Planning', description: 'Venues for all ceremonies' },
      { title: 'Plan Sangeet ceremony', category: 'Pre-Wedding Planning', description: 'Music and dance night' },
      { title: 'Plan Mehndi ceremony', category: 'Pre-Wedding Planning', description: 'Henna application event' },
      { title: 'Plan Haldi ceremony', category: 'Pre-Wedding Planning', description: 'Turmeric ritual' },
      { title: 'Book pandit/priest', category: 'Pre-Wedding Planning', description: 'Religious officiant' },
      // Attire
      { title: 'Order bridal lehenga', category: 'Attire', description: 'Bridal outfit for wedding' },
      { title: 'Order groom sherwani', category: 'Attire', description: 'Groom outfit for wedding' },
      { title: 'Order outfits for all events', category: 'Attire', description: 'Sangeet, mehndi, reception' },
      { title: 'Book bridal jewelry', category: 'Attire', description: 'Traditional wedding jewelry' },
      // Decor
      { title: 'Design mandap', category: 'Decor', description: 'Wedding altar decoration' },
      { title: 'Book flower decorator', category: 'Decor', description: 'Floral arrangements' },
      { title: 'Plan stage decoration', category: 'Decor', description: 'Reception stage setup' },
      // Catering
      { title: 'Plan menu for all events', category: 'Catering', description: 'Multi-day catering' },
      { title: 'Arrange chaat counter', category: 'Catering', description: 'Street food station' },
      { title: 'Order mithai/sweets', category: 'Catering', description: 'Traditional sweets' },
      // Entertainment
      { title: 'Book DJ for sangeet', category: 'Entertainment', description: 'Music for sangeet' },
      { title: 'Choreograph dances', category: 'Entertainment', description: 'Family dance performances' },
      { title: 'Book band/dhol', category: 'Entertainment', description: 'Baraat music' },
      // Logistics
      { title: 'Arrange baraat transport', category: 'Logistics', description: 'Groom procession' },
      { title: 'Book guest accommodation', category: 'Logistics', description: 'Out-of-town guests' },
      { title: 'Plan vidaai arrangements', category: 'Logistics', description: 'Bride farewell' },
    ],
  },
  {
    id: 'birthday-party',
    name: 'Birthday Party',
    description: 'Fun birthday party planning checklist',
    eventType: 'BIRTHDAY',
    items: [
      { title: 'Set party date and time', category: 'Planning', description: 'Choose convenient date' },
      { title: 'Decide on theme', category: 'Planning', description: 'Party theme selection' },
      { title: 'Create guest list', category: 'Planning', description: 'Who to invite' },
      { title: 'Book venue', category: 'Planning', description: 'Home or external venue' },
      { title: 'Send invitations', category: 'Invitations', description: 'Physical or digital invites' },
      { title: 'Track RSVPs', category: 'Invitations', description: 'Confirm attendance' },
      { title: 'Order birthday cake', category: 'Food & Drinks', description: 'Custom birthday cake' },
      { title: 'Plan party menu', category: 'Food & Drinks', description: 'Snacks and meals' },
      { title: 'Arrange drinks', category: 'Food & Drinks', description: 'Beverages for guests' },
      { title: 'Buy decorations', category: 'Decor', description: 'Balloons, banners, etc.' },
      { title: 'Get party supplies', category: 'Decor', description: 'Plates, cups, napkins' },
      { title: 'Plan games and activities', category: 'Entertainment', description: 'Party games' },
      { title: 'Arrange music', category: 'Entertainment', description: 'Playlist or DJ' },
      { title: 'Buy party favors', category: 'Favors', description: 'Return gifts for guests' },
      { title: 'Prepare goodie bags', category: 'Favors', description: 'Pack party favors' },
      { title: 'Set up photo area', category: 'Day Of', description: 'Photo booth or backdrop' },
      { title: 'Decorate venue', category: 'Day Of', description: 'Set up decorations' },
    ],
  },
  {
    id: 'corporate-event',
    name: 'Corporate Event',
    description: 'Professional corporate event checklist',
    eventType: 'CORPORATE',
    items: [
      { title: 'Define event objectives', category: 'Planning', description: 'Goals and outcomes' },
      { title: 'Set budget', category: 'Planning', description: 'Event budget allocation' },
      { title: 'Choose event date', category: 'Planning', description: 'Select appropriate date' },
      { title: 'Book venue', category: 'Venue', description: 'Conference or event space' },
      { title: 'Arrange AV equipment', category: 'Venue', description: 'Audio-visual setup' },
      { title: 'Plan seating layout', category: 'Venue', description: 'Room configuration' },
      { title: 'Invite speakers', category: 'Content', description: 'Keynote and panelists' },
      { title: 'Prepare presentation materials', category: 'Content', description: 'Slides and handouts' },
      { title: 'Create event agenda', category: 'Content', description: 'Detailed schedule' },
      { title: 'Send invitations', category: 'Attendees', description: 'Email invitations' },
      { title: 'Set up registration', category: 'Attendees', description: 'Online registration system' },
      { title: 'Arrange catering', category: 'Catering', description: 'Meals and refreshments' },
      { title: 'Order name badges', category: 'Materials', description: 'Attendee badges' },
      { title: 'Prepare welcome packets', category: 'Materials', description: 'Event materials' },
      { title: 'Arrange transportation', category: 'Logistics', description: 'Guest transport if needed' },
      { title: 'Confirm all vendors', category: 'Final Prep', description: 'Vendor confirmation' },
      { title: 'Brief event staff', category: 'Final Prep', description: 'Team preparation' },
      { title: 'Test all equipment', category: 'Final Prep', description: 'Technical check' },
    ],
  },
]
