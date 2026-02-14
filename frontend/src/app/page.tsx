"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useInView,
  type Variants,
} from "framer-motion";
import Lenis from "lenis";
import { PublicLayout } from "@/components/layouts/public";
import { GlobalSearch } from "@/components/common/global-search";
import {
  ArrowRight,
  ArrowDown,
  Building2,
  Camera,
  Music,
  Flower2,
  UtensilsCrossed,
  Sparkles,
  Users,
  CheckCircle2,
  Star,
  Shield,
  MessageSquare,
  DollarSign,
  Clock,
  Heart,
  Lightbulb,
  MapPin,
  ListChecks,
  Wallet,
  QrCode,
  CalendarClock,
  Search,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { VendorCard } from "@/components/features/vendors/vendor-card";
import { useFeaturedVendors } from "@/hooks/queries/use-public-vendors";

// ─── Lenis Smooth Scroll ─────────────────────────────────────────────────────

function useSmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);
}

// ─── Reusable Motion Wrappers ────────────────────────────────────────────────

const ease = [0.22, 1, 0.36, 1] as const;

/** Fade-up on scroll into view — used for section headings & blocks */
function FadeIn({
  children,
  delay = 0,
  className = "",
  y = 50,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.7, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Staggered children container */
function StaggerContainer({
  children,
  className = "",
  staggerDelay = 0.06,
}: {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: staggerDelay } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const staggerChild: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.55, ease },
  },
};

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORY_IDS = {
  VENUES: "venues",
  PHOTOGRAPHY: "photography",
  CATERING: "catering",
  WEDDING_PLANNING: "wedding-planning",
  DJ_MUSIC: "dj-music",
  FLORISTS: "florists",
  DECOR: "decor",
  MAKEUP_HAIR: "makeup-hair",
};

const serviceCategories = [
  {
    title: "Venues",
    icon: Building2,
    href: `/vendors?categoryId=${CATEGORY_IDS.VENUES}`,
    bg: "bg-rose-50",
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
  },
  {
    title: "Photographers",
    icon: Camera,
    href: `/vendors?categoryId=${CATEGORY_IDS.PHOTOGRAPHY}`,
    bg: "bg-amber-50",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  {
    title: "Caterers",
    icon: UtensilsCrossed,
    href: `/vendors?categoryId=${CATEGORY_IDS.CATERING}`,
    bg: "bg-emerald-50",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
  {
    title: "Decorators",
    icon: Sparkles,
    href: `/vendors?categoryId=${CATEGORY_IDS.DECOR}`,
    bg: "bg-violet-50",
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
  },
  {
    title: "Florists",
    icon: Flower2,
    href: `/vendors?categoryId=${CATEGORY_IDS.FLORISTS}`,
    bg: "bg-pink-50",
    iconBg: "bg-pink-100",
    iconColor: "text-pink-600",
  },
  {
    title: "Entertainment",
    icon: Music,
    href: `/vendors?categoryId=${CATEGORY_IDS.DJ_MUSIC}`,
    bg: "bg-sky-50",
    iconBg: "bg-sky-100",
    iconColor: "text-sky-600",
  },
  {
    title: "Planners",
    icon: Users,
    href: `/vendors?categoryId=${CATEGORY_IDS.WEDDING_PLANNING}`,
    bg: "bg-indigo-50",
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
  },
  {
    title: "Makeup & Hair",
    icon: Lightbulb,
    href: `/vendors?categoryId=${CATEGORY_IDS.MAKEUP_HAIR}`,
    bg: "bg-fuchsia-50",
    iconBg: "bg-fuchsia-100",
    iconColor: "text-fuchsia-600",
  },
];

const trustFeatures = [
  {
    icon: Shield,
    title: "Verified Vendors",
    description:
      "Every vendor is background-checked and reviewed before listing. Only trusted professionals.",
  },
  {
    icon: DollarSign,
    title: "Instant Quotes",
    description:
      "Get transparent pricing upfront. Compare quotes side-by-side and choose the best fit.",
  },
  {
    icon: Star,
    title: "Honest Reviews",
    description:
      "Real ratings from real customers. No fake reviews, no paid placements — just authentic feedback.",
  },
  {
    icon: MessageSquare,
    title: "Direct Messaging",
    description:
      "Chat directly with vendors, share your vision, and finalize details without leaving the platform.",
  },
  {
    icon: Clock,
    title: "Smart Planning Tools",
    description:
      "Checklists, budgets, timelines, and guest lists — everything you need to plan without the chaos.",
  },
  {
    icon: Heart,
    title: "Save & Compare",
    description:
      "Shortlist your favourites into wishlists. Compare vendors effortlessly and make confident decisions.",
  },
];

const featureCards: {
  icon: LucideIcon;
  badge: string;
  title: string;
  description: string;
  highlights: string[];
  cta: string;
  ctaHref: string;
  bg: string;
  iconBg: string;
  iconColor: string;
  badgeBg: string;
  badgeText: string;
}[] = [
  {
    icon: Search,
    badge: "Discover",
    title: "Find the perfect vendor for every occasion",
    description:
      "Browse thousands of verified vendors across every category. Filter by location, budget, style, and availability.",
    highlights: [
      "Smart search & filters",
      "Verified profiles",
      "Portfolio galleries",
      "Instant quote requests",
    ],
    cta: "Explore Vendors",
    ctaHref: "/vendors",
    bg: "bg-sky-50 dark:bg-sky-950/40",
    iconBg: "bg-sky-100 dark:bg-sky-900/50",
    iconColor: "text-sky-600 dark:text-sky-400",
    badgeBg: "bg-sky-100 dark:bg-sky-900/50",
    badgeText: "text-sky-700 dark:text-sky-300",
  },
  {
    icon: ListChecks,
    badge: "Checklist",
    title: "Stay on track with smart checklists",
    description:
      "Never miss a task. Our intelligent checklist adapts to your event date and unlocks tasks as milestones approach.",
    highlights: [
      "Auto-prioritised tasks",
      "Progress tracking",
      "Per-event checklists",
      "Milestone reminders",
    ],
    cta: "Start Planning",
    ctaHref: "/register",
    bg: "bg-violet-50 dark:bg-violet-950/40",
    iconBg: "bg-violet-100 dark:bg-violet-900/50",
    iconColor: "text-violet-600 dark:text-violet-400",
    badgeBg: "bg-violet-100 dark:bg-violet-900/50",
    badgeText: "text-violet-700 dark:text-violet-300",
  },
  {
    icon: Users,
    badge: "Guest List",
    title: "Manage guests and RSVPs effortlessly",
    description:
      "Track every guest from invitation to RSVP. Organise by groups, manage plus-ones, dietary needs, and seating.",
    highlights: ["RSVP tracking", "Group tags", "Dietary & meal prefs", "Export guest data"],
    cta: "Start Planning",
    ctaHref: "/register",
    bg: "bg-teal-50 dark:bg-teal-950/40",
    iconBg: "bg-teal-100 dark:bg-teal-900/50",
    iconColor: "text-teal-600 dark:text-teal-400",
    badgeBg: "bg-teal-100 dark:bg-teal-900/50",
    badgeText: "text-teal-700 dark:text-teal-300",
  },
  {
    icon: Wallet,
    badge: "Budget",
    title: "Track every rupee, stay in control",
    description:
      "Set your total budget, assign categories, and track spending in real time with visual breakdowns and alerts.",
    highlights: ["Real-time spending", "Category budgets", "Vendor payments", "Visual breakdowns"],
    cta: "Start Planning",
    ctaHref: "/register",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    iconBg: "bg-amber-100 dark:bg-amber-900/50",
    iconColor: "text-amber-600 dark:text-amber-400",
    badgeBg: "bg-amber-100 dark:bg-amber-900/50",
    badgeText: "text-amber-700 dark:text-amber-300",
  },
  {
    icon: Heart,
    badge: "Wishlists",
    title: "Save, compare, and decide with confidence",
    description:
      "Shortlist your favourite vendors into boards. Compare portfolios, pricing, and reviews side-by-side.",
    highlights: [
      "Organised boards",
      "Side-by-side compare",
      "Share with partner",
      "Quick quote access",
    ],
    cta: "Start Planning",
    ctaHref: "/register",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    iconBg: "bg-rose-100 dark:bg-rose-900/50",
    iconColor: "text-rose-600 dark:text-rose-400",
    badgeBg: "bg-rose-100 dark:bg-rose-900/50",
    badgeText: "text-rose-700 dark:text-rose-300",
  },
  {
    icon: CalendarClock,
    badge: "Timeline",
    title: "Plan the perfect day-of schedule",
    description:
      "Build a minute-by-minute timeline. Assign vendors to time slots, share with your team, and keep everyone in sync.",
    highlights: ["Day-of schedule", "Vendor assignments", "Team sharing", "Countdown timer"],
    cta: "Start Planning",
    ctaHref: "/register",
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    iconBg: "bg-indigo-100 dark:bg-indigo-900/50",
    iconColor: "text-indigo-600 dark:text-indigo-400",
    badgeBg: "bg-indigo-100 dark:bg-indigo-900/50",
    badgeText: "text-indigo-700 dark:text-indigo-300",
  },
  {
    icon: QrCode,
    badge: "Memories",
    title: "Capture every moment with QR uploads",
    description:
      "Generate a QR code. Guests scan and upload photos instantly — no app needed. Curate a live gallery.",
    highlights: [
      "No-app guest uploads",
      "Live photo gallery",
      "Moderation controls",
      "Printable QR poster",
    ],
    cta: "Start Planning",
    ctaHref: "/register",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/50",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    badgeBg: "bg-emerald-100 dark:bg-emerald-900/50",
    badgeText: "text-emerald-700 dark:text-emerald-300",
  },
];

const popularLocations = [
  { city: "Mumbai" },
  { city: "Delhi" },
  { city: "Bangalore" },
  { city: "Hyderabad" },
  { city: "Chennai" },
  { city: "Kolkata" },
  { city: "Pune" },
  { city: "Jaipur" },
  { city: "Ahmedabad" },
  { city: "Goa" },
  { city: "Udaipur" },
  { city: "Lucknow" },
];

// ─── Hero ────────────────────────────────────────────────────────────────────

function HeroSection() {
  const scrollToServices = useCallback(() => {
    document.getElementById("services")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  // Spring-smoothed transforms for buttery parallax
  const rawY = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const rawOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const rawScale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);
  const heroTextY = useSpring(rawY, { stiffness: 100, damping: 30 });
  const heroOpacity = useSpring(rawOpacity, { stiffness: 100, damping: 30 });
  const heroScale = useSpring(rawScale, { stiffness: 100, damping: 30 });

  // Floating blob parallax
  const blob1Y = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const blob2Y = useTransform(scrollYProgress, [0, 1], [0, 40]);

  // Sparkling stars data
  const sparkles = [
    { left: "10%", top: "15%", delay: 0, duration: 3 },
    { left: "85%", top: "20%", delay: 0.5, duration: 2.5 },
    { left: "20%", top: "75%", delay: 1, duration: 3.2 },
    { left: "75%", top: "65%", delay: 0.3, duration: 2.8 },
    { left: "50%", top: "10%", delay: 1.5, duration: 3.5 },
    { left: "15%", top: "45%", delay: 0.8, duration: 2.7 },
    { left: "90%", top: "50%", delay: 1.2, duration: 3.1 },
    { left: "40%", top: "80%", delay: 0.2, duration: 2.9 },
    { left: "65%", top: "30%", delay: 1.8, duration: 3.3 },
    { left: "30%", top: "25%", delay: 0.6, duration: 2.6 },
  ];

  return (
    <section
      ref={heroRef}
      className="from-background via-primary/5 to-background relative z-20 flex min-h-[80vh] items-center justify-center overflow-visible bg-linear-to-br py-12 sm:min-h-[75vh] sm:py-16"
    >
      {/* Floating blobs with parallax */}
      <motion.div
        style={{ y: blob1Y }}
        className="absolute -top-32 -left-32 h-[450px] w-[450px] rounded-full bg-sky-500/10 blur-[120px]"
      />
      <motion.div
        style={{ y: blob2Y }}
        className="absolute -right-32 -bottom-32 h-[400px] w-[400px] rounded-full bg-rose-500/8 blur-[120px]"
      />
      <motion.div
        style={{ y: blob1Y }}
        className="absolute top-1/3 left-1/2 h-[350px] w-[350px] -translate-x-1/2 rounded-full bg-violet-500/10 blur-[120px]"
      />

      {/* Floating sparkles */}
      {sparkles.map((sparkle, i) => (
        <motion.div
          key={i}
          className="absolute z-10 h-1 w-1 rounded-full bg-white shadow-lg"
          style={{
            left: sparkle.left,
            top: sparkle.top,
          }}
          animate={{
            scale: [0, 1, 1, 0],
            opacity: [0, 1, 1, 0],
            y: [0, -20, -40, -60],
          }}
          transition={{
            duration: sparkle.duration,
            delay: sparkle.delay,
            repeat: Infinity,
            repeatDelay: 2,
            ease: "easeOut",
          }}
        />
      ))}

      {/* Larger floating sparkles with glow */}
      <motion.div
        className="absolute top-[30%] left-[15%] z-10 h-2 w-2 rounded-full bg-amber-400/80 shadow-lg shadow-amber-400/50 blur-[1px]"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.4, 1, 0.4],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute top-[40%] right-[20%] z-10 h-2 w-2 rounded-full bg-sky-400/80 shadow-lg shadow-sky-400/50 blur-[1px]"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.4, 1, 0.4],
        }}
        transition={{
          duration: 3.5,
          delay: 1,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute top-[70%] left-[70%] z-10 h-2 w-2 rounded-full bg-violet-400/80 shadow-lg shadow-violet-400/50 blur-[1px]"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.4, 1, 0.4],
        }}
        transition={{
          duration: 4.2,
          delay: 0.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        style={{ y: heroTextY, opacity: heroOpacity, scale: heroScale }}
        className="relative z-20 mx-auto max-w-5xl px-6 text-center"
      >
        <motion.h1
          initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1, delay: 0.2, ease }}
          className="text-foreground font-serif text-4xl leading-tight font-bold tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl"
        >
          Your dream event
          <br />
          <span className="from-primary bg-gradient-to-r via-purple-600 to-pink-600 bg-clip-text text-transparent">
            starts here
          </span>
        </motion.h1>

        {/* Global Search */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4, ease }}
          className="relative z-50 mx-auto mt-6 max-w-3xl sm:mt-8"
        >
          <GlobalSearch
            placeholder="Search for photographers, venues, caterers..."
            className="max-w-none"
            showOnHomePage={true}
          />

          <p className="text-muted-foreground mt-3 text-sm">
            Popular: <button className="text-primary mx-1 hover:underline">Wedding Venues</button> •
            <button className="text-primary mx-1 hover:underline">Photographers</button> •
            <button className="text-primary mx-1 hover:underline">Caterers in Mumbai</button>
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7, ease }}
          className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm sm:mt-10 sm:gap-8"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <span className="text-muted-foreground">
              <strong className="text-foreground font-semibold">10,000+</strong> Verified Vendors
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />
            <span className="text-muted-foreground">
              <strong className="text-foreground font-semibold">50,000+</strong> Happy Events
            </span>
          </div>
        </motion.div>
      </motion.div>

      {/* Scroll arrow */}
      <motion.button
        onClick={scrollToServices}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="text-muted-foreground hover:text-foreground animate-bounce-slow absolute bottom-20 left-1/2 z-20 -translate-x-1/2 transition-colors sm:bottom-24"
        aria-label="Scroll down"
      >
        <ArrowDown className="h-6 w-6" />
      </motion.button>

      {/* Wave cutout at bottom — visible in viewport */}
      {/* <div className="absolute bottom-0 left-0 z-10 w-full overflow-hidden leading-[0]">
        <svg
          viewBox="0 0 1440 200"
          preserveAspectRatio="none"
          className="relative block h-[100px] w-full sm:h-[130px] lg:h-[80px]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,80 C180,160 360,20 540,80 C720,140 900,30 1080,90 C1200,120 1320,60 1440,80 L1440,200 L0,200 Z"
            className="fill-background"
          />
        </svg>
      </div> */}
    </section>
  );
}

// ─── Services Grid ───────────────────────────────────────────────────────────

function ServicesGrid() {
  return (
    <section id="services" className="bg-background py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <FadeIn className="mb-10 text-center sm:mb-14">
          <p className="text-primary mb-3 text-sm font-semibold tracking-widest uppercase">
            What are you planning?
          </p>
          <h2 className="font-serif text-3xl font-bold sm:text-4xl lg:text-5xl">
            Explore by category
          </h2>
        </FadeIn>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:hidden">
          {serviceCategories.map((cat, index) => (
            <motion.div
              key={cat.title}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: index * 0.04, ease }}
              className="p-1"
            >
              <Link href={cat.href} prefetch={false} className="group block">
                <div className="flex flex-col items-center gap-2 sm:gap-3">
                  <div
                    className={`flex h-20 w-20 items-center justify-center rounded-full ${cat.bg} border-background border-2 shadow-lg transition-all duration-300 group-active:scale-95 sm:h-24 sm:w-24 sm:border-4`}
                  >
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-full ${cat.iconBg} transition-transform duration-300 sm:h-14 sm:w-14`}
                    >
                      <cat.icon className={`h-6 w-6 ${cat.iconColor} sm:h-7 sm:w-7`} />
                    </div>
                  </div>
                  <span className="text-foreground group-hover:text-primary text-center text-xs font-semibold transition-colors sm:text-sm">
                    {cat.title}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="relative hidden overflow-x-hidden px-2 md:block lg:px-8">
          <Carousel
            opts={{
              align: "start",
              loop: true,
              slidesToScroll: 1,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {serviceCategories.map((cat, index) => (
                <CarouselItem key={cat.title} className="basis-1/3 pl-4 lg:basis-1/5">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.4, delay: index * 0.05, ease }}
                    className="p-1"
                  >
                    <Link href={cat.href} prefetch={false} className="group block">
                      <div className="flex flex-col items-center gap-3">
                        <div
                          className={`flex h-28 w-28 items-center justify-center rounded-full ${cat.bg} border-background border-4 shadow-lg transition-all duration-300 md:group-hover:scale-110 md:group-hover:shadow-xl`}
                        >
                          <div
                            className={`flex h-16 w-16 items-center justify-center rounded-full ${cat.iconBg} transition-transform duration-300 md:group-hover:scale-110 lg:h-20 lg:w-20`}
                          >
                            <cat.icon className={`h-8 w-8 ${cat.iconColor} lg:h-10 lg:w-10`} />
                          </div>
                        </div>
                        <span className="text-foreground group-hover:text-primary text-center text-sm font-semibold transition-colors">
                          {cat.title}
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-0 hidden lg:flex" />
            <CarouselNext className="right-0 hidden lg:flex" />
          </Carousel>
        </div>
      </div>
    </section>
  );
}

// ─── Feature Card with Parallax Stack ────────────────────────────────────────

function FeatureCard({ card, index }: { card: (typeof featureCards)[number]; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Entrance animation
  const { scrollYProgress: enterProgress } = useScroll({
    target: cardRef,
    offset: ["start end", "start 0.3"],
  });
  const rawEnterY = useTransform(enterProgress, [0, 1], [120, 0]);
  const rawEnterOpacity = useTransform(enterProgress, [0, 0.4], [0, 1]);
  const enterY = useSpring(rawEnterY, { stiffness: 80, damping: 25 });
  const enterOpacity = useSpring(rawEnterOpacity, { stiffness: 80, damping: 25 });

  // Exit: scale down + fade as next card covers
  const { scrollYProgress: exitProgress } = useScroll({
    target: cardRef,
    offset: ["start start", "end start"],
  });
  const rawScale = useTransform(exitProgress, [0, 1], [1, 0.9]);
  const rawExitOpacity = useTransform(exitProgress, [0, 0.5, 1], [1, 1, 0.3]);
  const scale = useSpring(rawScale, { stiffness: 100, damping: 30 });
  const exitOpacity = useSpring(rawExitOpacity, { stiffness: 100, damping: 30 });

  // Visual side subtle parallax offset
  const rawVisualY = useTransform(enterProgress, [0, 1], [60, 0]);
  const visualY = useSpring(rawVisualY, { stiffness: 60, damping: 20 });

  const Icon = card.icon;
  const isEven = index % 2 === 0;

  return (
    <div ref={cardRef} className="sticky top-0 min-h-screen" style={{ zIndex: index + 1 }}>
      <motion.div
        style={{ scale, opacity: exitOpacity }}
        className={`${card.bg} relative flex min-h-screen items-center overflow-hidden`}
      >
        {/* Subtle decorative gradient orb */}
        <div
          className={`absolute ${isEven ? "-top-32 -right-32" : "-bottom-32 -left-32"} h-96 w-96 rounded-full ${card.iconBg} opacity-40 blur-[100px]`}
        />

        <motion.div
          style={{ y: enterY, opacity: enterOpacity }}
          className="relative z-10 mx-auto w-full max-w-6xl px-6 py-16 lg:py-20"
        >
          <div
            className={`flex flex-col gap-12 lg:flex-row lg:items-center ${
              !isEven ? "lg:flex-row-reverse" : ""
            }`}
          >
            {/* Text */}
            <div className="flex-1 space-y-6">
              <span
                className={`inline-flex items-center gap-2 rounded-full ${card.badgeBg} ${card.badgeText} px-4 py-1.5 text-xs font-semibold tracking-wider uppercase`}
              >
                <Icon className="h-3.5 w-3.5" />
                {card.badge}
              </span>

              <h3 className="font-serif text-3xl leading-tight font-bold sm:text-4xl lg:text-[2.75rem]">
                {card.title}
              </h3>

              <p className="text-muted-foreground max-w-lg text-lg leading-relaxed">
                {card.description}
              </p>

              <ul className="grid grid-cols-2 gap-x-6 gap-y-3">
                {card.highlights.map((h) => (
                  <li key={h} className="text-foreground flex items-center gap-2 text-sm">
                    <CheckCircle2 className={`h-4 w-4 shrink-0 ${card.iconColor}`} />
                    {h}
                  </li>
                ))}
              </ul>

              <div className="pt-2">
                <Button asChild size="lg" className="rounded-full px-8">
                  <Link href={card.ctaHref}>
                    {card.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Visual mockup with its own parallax */}
            <motion.div style={{ y: visualY }} className="flex flex-1 items-center justify-center">
              <div className="border-border/50 bg-background relative h-72 w-full max-w-md overflow-hidden rounded-3xl border shadow-2xl lg:h-96">
                {/* Window chrome */}
                <div className="border-border bg-muted/50 absolute inset-x-0 top-0 flex items-center gap-2 border-b px-5 py-3">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/60" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-400/60" />
                  <div className="bg-muted ml-4 h-3.5 w-28 rounded-full" />
                </div>

                {/* Center icon */}
                <div className="absolute inset-0 flex items-center justify-center pt-8">
                  <div
                    className={`flex h-24 w-24 items-center justify-center rounded-3xl ${card.iconBg}`}
                  >
                    <Icon className={`h-12 w-12 ${card.iconColor}`} />
                  </div>
                </div>

                {/* Skeleton */}
                <div className="absolute right-6 bottom-6 left-6 space-y-2.5">
                  <div className="bg-muted h-2.5 w-4/5 rounded-full" />
                  <div className="bg-muted h-2.5 w-3/5 rounded-full" />
                  <div className="bg-muted h-2.5 w-2/3 rounded-full" />
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

function FeatureDeepDives() {
  return (
    <section className="relative">
      <div className="bg-background py-14 text-center lg:py-20">
        <FadeIn>
          <p className="text-primary mb-3 text-sm font-semibold tracking-widest uppercase">
            Everything you need
          </p>
          <h2 className="font-serif text-3xl font-bold sm:text-4xl lg:text-5xl">
            Your complete planning toolkit
          </h2>
          <p className="text-muted-foreground mx-auto mt-4 max-w-2xl">
            From finding vendors to collecting guest memories — every tool works together so you can
            focus on celebrating.
          </p>
        </FadeIn>
      </div>

      <div className="relative">
        {featureCards.map((card, i) => (
          <FeatureCard key={card.badge} card={card} index={i} />
        ))}
      </div>
    </section>
  );
}

// ─── Trust Section ───────────────────────────────────────────────────────────

function TrustSection() {
  return (
    <section className="bg-background py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <FadeIn className="mb-14 text-center">
          <p className="text-primary mb-3 text-sm font-semibold tracking-widest uppercase">
            Why Omnicassion
          </p>
          <h2 className="font-serif text-3xl font-bold sm:text-4xl lg:text-5xl">
            The difference is in the details
          </h2>
          <p className="text-muted-foreground mx-auto mt-4 max-w-2xl">
            We&apos;ve built every feature around one goal: making your event planning stress-free,
            transparent, and joyful.
          </p>
        </FadeIn>

        <StaggerContainer className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" staggerDelay={0.08}>
          {trustFeatures.map((feature) => (
            <motion.div
              key={feature.title}
              variants={staggerChild}
              whileHover={{ y: -4, transition: { duration: 0.25 } }}
              className="group border-border bg-card hover:border-primary/20 rounded-2xl border p-7 transition-shadow duration-300 hover:shadow-lg"
            >
              <div className="bg-primary/10 text-primary mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

// ─── Featured Vendors ────────────────────────────────────────────────────────

function FeaturedVendorsSection() {
  const { data: vendors, isLoading } = useFeaturedVendors(8);

  if (!isLoading && (!vendors || vendors.length === 0)) return null;

  return (
    <section className="bg-muted/30 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <FadeIn className="mb-14 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div>
            <p className="text-primary mb-2 text-sm font-semibold tracking-widest uppercase">
              Featured
            </p>
            <h2 className="font-serif text-3xl font-bold sm:text-4xl">Top-rated vendors</h2>
          </div>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/vendors">
              View All Vendors
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </FadeIn>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card animate-pulse overflow-hidden rounded-2xl border">
                <div className="bg-muted aspect-4/3" />
                <div className="space-y-3 p-4">
                  <div className="bg-muted h-4 w-3/4 rounded" />
                  <div className="bg-muted h-3 w-full rounded" />
                  <div className="bg-muted h-3 w-2/3 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <StaggerContainer
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
            staggerDelay={0.07}
          >
            {vendors!.slice(0, 8).map((vendor) => (
              <motion.div
                key={vendor.id}
                variants={staggerChild}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
              >
                <VendorCard vendor={vendor} />
              </motion.div>
            ))}
          </StaggerContainer>
        )}
      </div>
    </section>
  );
}

// ─── Vendor Discovery ────────────────────────────────────────────────────────

function VendorDiscoverySection() {
  return (
    <section className="bg-background border-t py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <FadeIn className="mb-14 text-center">
          <h2 className="font-serif text-3xl font-bold sm:text-4xl">Find vendors near you</h2>
          <p className="text-muted-foreground mx-auto mt-3 max-w-xl">
            Browse event professionals by category and location across India.
          </p>
        </FadeIn>

        <FadeIn delay={0.15}>
          <h3 className="text-muted-foreground mb-6 text-center text-sm font-semibold tracking-widest uppercase">
            Popular Locations
          </h3>
        </FadeIn>

        <StaggerContainer
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
          staggerDelay={0.04}
        >
          {popularLocations.map((loc) => (
            <motion.div key={loc.city} variants={staggerChild}>
              <Link
                href={`/vendors?location=${loc.city.toLowerCase()}`}
                prefetch={false}
                className="group border-border bg-card hover:border-primary/30 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm transition-all hover:shadow-sm"
              >
                <MapPin className="text-muted-foreground group-hover:text-primary h-3.5 w-3.5 transition-colors" />
                <span className="text-foreground group-hover:text-primary font-medium transition-colors">
                  {loc.city}
                </span>
              </Link>
            </motion.div>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

// ─── CTA Section ─────────────────────────────────────────────────────────────

function CTASection() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const bgScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.95, 1, 0.95]);

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-linear-to-br from-slate-900 via-indigo-950 to-purple-950 py-20 lg:py-28"
    >
      <motion.div
        style={{ y: bgY }}
        className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-sky-500/15 blur-[120px]"
      />
      <motion.div
        style={{ y: bgY }}
        className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-rose-500/12 blur-[120px]"
      />

      <motion.div
        style={{ scale: bgScale }}
        className="relative z-10 mx-auto max-w-3xl px-6 text-center"
      >
        <FadeIn>
          <h2 className="font-serif text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Ready to plan your dream event?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/55">
            Join thousands of couples and event planners who trust Omnicassion to bring their vision
            to life.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="shadow-primary/30 h-13 rounded-full px-8 text-base shadow-lg"
            >
              <Link href="/register">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-13 rounded-full border-white/20 bg-white/5 px-8 text-base text-white backdrop-blur-sm hover:bg-white/10 hover:text-white"
            >
              <Link href="/vendors" prefetch={false}>
                Browse Vendors
              </Link>
            </Button>
          </div>
        </FadeIn>
      </motion.div>
    </section>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Home() {
  useSmoothScroll();

  return (
    <PublicLayout>
      <HeroSection />
      <ServicesGrid />
      <FeatureDeepDives />
      <TrustSection />
      <FeaturedVendorsSection />
      {/* <VendorDiscoverySection /> */}
      <CTASection />
    </PublicLayout>
  );
}
