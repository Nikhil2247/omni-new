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

function HeroVideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "200px" });
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);

  useEffect(() => {
    if (isInView) {
      setShouldLoadVideo(true);
    }
  }, [isInView]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setPrefersReducedMotion(mediaQuery.matches);

    onChange();
    mediaQuery.addEventListener("change", onChange);

    return () => mediaQuery.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!videoRef.current || !shouldLoadVideo || prefersReducedMotion) {
      return;
    }

    const playPromise = videoRef.current.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        setIsVideoReady(false);
      });
    }
  }, [shouldLoadVideo, prefersReducedMotion]);

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-background" />

      {shouldLoadVideo && !prefersReducedMotion && (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/images/hero-video-poster.jpg"
          onCanPlay={() => setIsVideoReady(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${isVideoReady ? "opacity-100" : "opacity-0"}`}
        >
          <source src="/video/hero-mobile.mp4" type="video/mp4" media="(max-width: 767px)" />
          <source src="/video/hero-desktop.mp4" type="video/mp4" />
        </video>
      )}

      <div className="absolute inset-0 bg-black/55" />
    </div>
  );
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORY_SLUGS = {
  VENUE: "venue",
  PHOTOGRAPHY: "photography",
  FOOD_CATERING: "food-catering",
  WEDDING_PLANNING: "wedding-planning",
  ENTERTAINMENT: "entertainment",
  DECOR_DESIGN: "decor-design",
  MAKEUP_HAIR: "makeup-hair",
  MEHNDI_ARTISTS: "mehndi-artists",
};

// Category cards with images - Zola style
const serviceCategories = [
  {
    title: "Venues",
    description: "Find the perfect location for your celebration.",
    icon: Building2,
    href: `/vendors?categoryId=${CATEGORY_SLUGS.VENUE}`,
    image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&q=80",
  },
  {
    title: "Photo & Video",
    description: "Capture every precious moment beautifully.",
    icon: Camera,
    href: `/vendors?categoryId=${CATEGORY_SLUGS.PHOTOGRAPHY}`,
    image: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=600&q=80",
  },
  {
    title: "Food & Catering",
    description: "Delight your guests with amazing cuisine.",
    icon: UtensilsCrossed,
    href: `/vendors?categoryId=${CATEGORY_SLUGS.FOOD_CATERING}`,
    image: "https://images.unsplash.com/photo-1555244162-803834f70033?w=600&q=80",
  },
  {
    title: "Decor & Design",
    description: "Transform your venue into a dream setting.",
    icon: Sparkles,
    href: `/vendors?categoryId=${CATEGORY_SLUGS.DECOR_DESIGN}`,
    image: "https://images.unsplash.com/photo-1478146059778-26028b07395a?w=600&q=80",
  },
  {
    title: "Mehndi & Artists",
    description: "Beautiful henna designs for your special day.",
    icon: Flower2,
    href: `/vendors?categoryId=${CATEGORY_SLUGS.MEHNDI_ARTISTS}`,
    image: "https://images.unsplash.com/photo-1702378154233-9b870ff8f1b3?q=80&w=600",
  },
  {
    title: "Entertainment",
    description: "Keep your guests entertained all night long.",
    icon: Music,
    href: `/vendors?categoryId=${CATEGORY_SLUGS.ENTERTAINMENT}`,
    image: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=600&q=80",
  },
  {
    title: "Planners",
    description: "Let experts handle the details for you.",
    icon: Users,
    href: `/vendors?categoryId=${CATEGORY_SLUGS.WEDDING_PLANNING}`,
    image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600&q=80",
  },
  {
    title: "Makeup & Hair",
    description: "Look your absolute best on your big day.",
    icon: Lightbulb,
    href: `/vendors?categoryId=${CATEGORY_SLUGS.MAKEUP_HAIR}`,
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80",
  },
];

// Zola-style feature cards with images
const toolkitFeatures = [
  {
    title: "Find Vendors",
    description: "Discover the perfect professionals for your event.",
    href: "/vendors",
    image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&q=80",
    badge: "5,000+ vendors",
    badgeIcon: Star,
  },
  {
    title: "Event Website",
    description: "Create a beautiful site to share with guests.",
    href: "/register",
    image: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=600&q=80",
    badge: "Free templates",
    badgeIcon: Sparkles,
  },
  {
    title: "Digital Invites",
    description: "Send stunning invitations and track RSVPs.",
    href: "/register",
    image: "https://images.unsplash.com/photo-1607861716497-e65ab29fc7ac?w=600&q=80",
    badge: "Customize design",
    badgeIcon: Heart,
  },
  {
    title: "Guest List",
    description: "Manage RSVPs, meals, and seating with ease.",
    href: "/register",
    image: "https://images.unsplash.com/photo-1529634806980-85c3dd6d34ac?w=600&q=80",
    badge: "Track RSVPs",
    badgeIcon: Users,
  },
  {
    title: "Budget Tracker",
    description: "Stay on top of every rupee you spend.",
    href: "/register",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&q=80",
    badge: "Payment reminders",
    badgeIcon: Wallet,
  },
  {
    title: "Photo Gallery",
    description: "Collect moments from all your guests instantly.",
    href: "/register",
    image: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=600&q=80",
    badge: "QR uploads",
    badgeIcon: Camera,
  },
];

// Feature sections with Zola-style layout - images + text
const featureSections = [
  {
    id: "vendors",
    badge: "Find Vendors",
    title: "Discover trusted vendors for your dream event",
    description: "Browse thousands of verified photographers, decorators, caterers, and more. Compare portfolios, read real reviews, and book with confidence.",
    cta: "Explore Vendors",
    ctaHref: "/vendors",
    ctaSecondary: "How it works",
    ctaSecondaryHref: "/how-it-works",
    bgImage: "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80",
    mockupImage: "/images/features/vendor-search-mockup.png",
    bgColor: "bg-[#0f4c5c]", // Teal
    textColor: "text-white",
  },
  {
    id: "discover",
    badge: "Get Inspired",
    title: "Explore stunning portfolios and find your style",
    description: "Browse through thousands of real event photos and portfolios. Get inspired by the latest trends, save your favorites, and discover vendors whose style matches your vision.",
    cta: "Explore Gallery",
    ctaHref: "/discover",
    ctaSecondary: "View Portfolios",
    ctaSecondaryHref: "/discover?tab=portfolios",
    bgImage: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1200&q=80",
    mockupImage: "/images/features/discover-mockup.png",
    bgColor: "bg-[#5e4b8b]", // Purple
    textColor: "text-white",
  },
  {
    id: "planning",
    badge: "Planning Tools",
    title: "Plan every detail with ease",
    description: "Smart checklists, budget trackers, and timelines that adapt to your event date. Stay organized without the stress.",
    cta: "Start Planning",
    ctaHref: "/register",
    ctaSecondary: "See Features",
    ctaSecondaryHref: "/features",
    bgImage: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=1200&q=80",
    mockupImage: "/images/features/checklist-mockup.png",
    bgColor: "bg-[#2d5a4a]", // Forest green
    textColor: "text-white",
  },
  {
    id: "invites",
    badge: "E-Invites",
    title: "Send beautiful digital invitations",
    description: "Create stunning digital invitations that match your event theme. Track RSVPs in real-time, send reminders, and keep all your guests informed effortlessly.",
    cta: "Create Invite",
    ctaHref: "/register",
    ctaSecondary: "View Templates",
    ctaSecondaryHref: "/invites/templates",
    bgImage: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=1200&q=80",
    mockupImage: "/images/features/invites-mockup.png",
    bgColor: "bg-[#8b5a2b]", // Warm brown
    textColor: "text-white",
  },
  {
    id: "website",
    badge: "Event Website",
    title: "Create your own event website in minutes",
    description: "Build a beautiful, personalized website for your event. Share your story, event details, registry links, and photo galleries — all in one place your guests can easily access.",
    cta: "Build Your Site",
    ctaHref: "/register",
    ctaSecondary: "See Examples",
    ctaSecondaryHref: "/websites/examples",
    bgImage: "https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=1200&q=80",
    mockupImage: "/images/features/website-mockup.png",
    bgColor: "bg-[#4a3728]", // Deep brown
    textColor: "text-white",
  },
  {
    id: "guests",
    badge: "Guest Management",
    title: "Manage your guest list effortlessly",
    description: "Track RSVPs, manage dietary preferences, organize seating arrangements, and keep everyone in the loop with beautiful digital invites.",
    cta: "Start Planning",
    ctaHref: "/register",
    ctaSecondary: "Learn More",
    ctaSecondaryHref: "/features/guests",
    bgImage: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200&q=80",
    mockupImage: "/images/features/guest-list-mockup.png",
    bgColor: "bg-[#3d5a6c]", // Steel blue
    textColor: "text-white",
  },
  {
    id: "memories",
    badge: "Capture Memories",
    title: "Collect every moment from your guests",
    description: "Generate a QR code for your event. Guests scan and upload photos instantly — no app needed. Create a beautiful shared gallery.",
    cta: "Start Planning",
    ctaHref: "/register",
    ctaSecondary: "See Demo",
    ctaSecondaryHref: "/features/memories",
    bgImage: "https://images.unsplash.com/photo-1529634806980-85c3dd6d34ac?w=1200&q=80",
    mockupImage: "/images/features/qr-gallery-mockup.png",
    bgColor: "bg-[#6b4c5a]", // Dusty mauve
    textColor: "text-white",
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

  return (
    <section
      ref={heroRef}
      className="relative z-20 flex min-h-[60vh] w-full items-center justify-center overflow-x-hidden overflow-y-visible bg-background py-12 sm:min-h-[85vh] sm:py-16"
    >
      <HeroVideoBackground />

      <motion.div
        style={{ y: heroTextY, opacity: heroOpacity, scale: heroScale }}
        className="relative z-30 mx-auto max-w-5xl px-6 text-center"
      >
        <motion.h1
          initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1, delay: 0.2, ease }}
          className="font-serif text-4xl leading-tight font-bold tracking-tight text-white drop-shadow-lg sm:text-5xl lg:text-6xl"
        >
          Discover the Best Events and Services
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease }}
          className="mx-auto mt-4 max-w-2xl text-lg text-white/90 sm:text-xl"
        >
          Find the perfect venue, vendors, and planners for your next event.
        </motion.p>

        {/* Global Search */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.5, ease }}
          className="relative z-100 mx-auto mt-8 max-w-2xl"
        >
          <GlobalSearch
            placeholder="Search vendors..."
            className="max-w-none"
            showOnHomePage={true}
          />
        </motion.div>

  
      </motion.div>

      {/* Scroll arrow */}
      <motion.button
        onClick={scrollToServices}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="animate-bounce-slow absolute bottom-20 left-1/2 z-20 -translate-x-1/2 text-white/75 transition-colors hover:text-white sm:bottom-24"
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

// ─── Services Grid - Zola Style Layout (Title Left, Cards Right) ─────────────

function ServicesGrid() {
  const gridRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(gridRef, { once: true, margin: "-50px" });

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 25 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease },
    },
  };

  // Take first 6 categories for 2x3 grid
  const displayCategories = serviceCategories.slice(0, 6);

  return (
    <section id="services" className="bg-background py-12 sm:py-16 lg:py-16">
      <div className="mx-auto max-w-7xl px-6">
        {/* Two-column layout: Title on left (centered vertically), grid on right */}
        <div className="grid gap-10 lg:grid-cols-[280px_1fr] lg:gap-8 xl:grid-cols-[320px_1fr]">

          {/* Left side - Title (vertically centered) */}
          <FadeIn className="flex flex-col justify-center">
            <h2 className="font-serif text-3xl font-bold leading-tight sm:text-4xl">
              Explore by Categories
            </h2>
            <p className="mt-3 text-muted-foreground">
              Find the perfect professionals for your event
            </p>
          </FadeIn>

          {/* Right side - Cards grid with vertical dividers */}
          <motion.div
            ref={gridRef}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={containerVariants}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-10"
          >
            {displayCategories.map((cat, index) => {
              // Border logic: add left border for 2nd and 3rd columns
              const isSecondColLg = index % 3 === 1;
              const isThirdColLg = index % 3 === 2;
              const isSecondColSm = index % 2 === 1;

              return (
                <motion.div
                  key={cat.title}
                  variants={itemVariants}
                  className={`
                    px-0 first:pl-0
                    sm:px-6
                    ${isSecondColSm ? 'sm:border-l border-border' : ''}
                    ${isSecondColLg || isThirdColLg ? 'lg:border-l' : 'lg:border-l-0'}
                    ${index % 3 === 0 ? 'lg:pl-0' : ''}
                  `}
                >
                <Link href={cat.href} prefetch={false} className="group block">
                  {/* Title with arrow */}
                  <h3 className="text-lg font-semibold flex items-center gap-1 group-hover:underline decoration-1 underline-offset-4">
                    {cat.title}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </h3>

                  {/* Description */}
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {cat.description}
                  </p>

                  {/* Image */}
                  <div className="mt-4 relative overflow-hidden rounded-xl bg-gray-100 aspect-4/3">
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                      style={{ backgroundImage: `url(${cat.image})` }}
                    />
                  </div>
                </Link>
              </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* View all link */}
        <FadeIn delay={0.3} className="mt-10 text-center lg:text-right">
          <Link
            href="/vendors"
            className="inline-flex items-center text-sm font-medium text-primary hover:underline underline-offset-4"
          >
            View all categories
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </FadeIn>
      </div>
    </section>
  );
}

// ─── Zola-Style Feature Section with Lenis Smooth Stagger ────────────────────

function FeatureSection({
  section,
  index
}: {
  section: (typeof featureSections)[number];
  index: number;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const isEven = index % 2 === 0;

  // Parallax effect for the image
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // Smooth spring-based parallax for image
  const rawImageY = useTransform(scrollYProgress, [0, 1], ["-5%", "5%"]);
  const imageY = useSpring(rawImageY, { stiffness: 100, damping: 30 });

  // Card entrance animation
  const cardVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.6, ease },
    },
  };

  // Image slide-in animation
  const imageVariants: Variants = {
    hidden: { opacity: 0, x: isEven ? -60 : 60, scale: 1.1 },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: { duration: 0.8, ease, delay: 0.2 },
    },
  };

  // Stagger animation variants for text content
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30, filter: "blur(4px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.5, ease },
    },
  };

  return (
    <motion.section
      ref={sectionRef}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={cardVariants}
      className={`relative min-h-125 lg:min-h-137.5 ${section.bgColor} overflow-hidden`}
    >
      {/* Two-column layout */}
      <div className={`flex flex-col lg:flex-row ${!isEven ? "lg:flex-row-reverse" : ""} min-h-125 lg:min-h-137.5`}>

        {/* Image Side - 50% width on desktop with parallax */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={imageVariants}
          className="relative h-87.5 w-full lg:h-auto lg:w-1/2 overflow-hidden"
        >
          {/* Background Image with parallax */}
          <motion.div
            style={{ y: imageY }}
            className="absolute inset-[-10%] bg-cover bg-center"
          >
            <div
              className="absolute inset-0 bg-cover bg-center scale-110"
              style={{ backgroundImage: `url(${section.bgImage})` }}
            />
          </motion.div>

          {/* Gradient overlay for better text readability on mobile */}
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-black/40 lg:hidden" />

          {/* TODO: Add product mockup screenshots later */}
          {/* <motion.div className="absolute bottom-6 left-6 right-6 lg:bottom-12 lg:left-12 lg:right-auto lg:w-[320px] xl:w-[380px]">
            Product mockup will go here
          </motion.div> */}
        </motion.div>

        {/* Text Side - 50% width on desktop with stagger animations */}
        <div className="flex w-full items-center lg:w-1/2">
          <motion.div
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={containerVariants}
            className="px-6 py-8 lg:px-12 xl:px-16 lg:py-12"
          >
            {/* Badge */}
            <motion.span
              variants={itemVariants}
              className="mb-3 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/90"
            >
              {section.badge}
            </motion.span>

            {/* Title */}
            <motion.h2
              variants={itemVariants}
              className="font-serif text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-4xl"
            >
              {section.title}
            </motion.h2>

            {/* Description */}
            <motion.p
              variants={itemVariants}
              className="mt-3 max-w-lg text-base leading-relaxed text-white/80"
            >
              {section.description}
            </motion.p>

            {/* CTA - Single button only */}
            <motion.div
              variants={itemVariants}
              className="mt-6"
            >
              <Button
                asChild
                size="default"
                className="rounded-full bg-white px-6 text-gray-900 hover:bg-white/90"
              >
                <Link href={section.ctaHref}>
                  {section.cta}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}

function FeatureDeepDives() {
  return (
    <section className="relative">
      {/* Section Header */}
      <div className="bg-background py-16 text-center lg:py-16">
        <FadeIn>
          <p className="text-primary mb-3 text-sm font-semibold tracking-widest uppercase">
            Everything you need
          </p>
          <h2 className="font-serif text-3xl font-bold sm:text-4xl lg:text-5xl">
            Your complete planning toolkit
          </h2>
          <p className="text-muted-foreground mx-auto mt-5 max-w-2xl text-lg">
            From finding the perfect vendors to capturing every memory — all the tools you need
            to plan your dream event, in one place.
          </p>
        </FadeIn>
      </div>

      {/* Feature Sections */}
      <div>
        {featureSections.map((section, i) => (
          <FeatureSection key={section.id} section={section} index={i} />
        ))}
      </div>
    </section>
  );
}

// ─── Trust Section - Zola Style with Image Cards ─────────────────────────────

function TrustSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease },
    },
  };

  return (
    <section ref={sectionRef} className="bg-muted/30 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6">
        {/* Zola-style layout: Title on left, grid on right */}
        <div className="grid gap-12 lg:grid-cols-[300px_1fr] lg:gap-16 xl:grid-cols-[350px_1fr]">

          {/* Left side - Title */}
          <FadeIn className="lg:sticky lg:top-24 lg:self-start">
            <h2 className="font-serif text-3xl font-bold leading-tight sm:text-4xl lg:text-[2.75rem]">
              <span className="text-foreground">Everything you need</span>{" "}
              <span className="text-muted-foreground">to plan the event you want</span>
            </h2>
            <p className="mt-6 text-muted-foreground text-lg">
              For all the days along the way
            </p>
          </FadeIn>

          {/* Right side - Image cards grid */}
          <motion.div
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={containerVariants}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {toolkitFeatures.map((feature) => (
              <motion.div key={feature.title} variants={itemVariants}>
                <Link href={feature.href} className="group block">
                  {/* Card */}
                  <div className="space-y-3">
                    {/* Title with arrow */}
                    <div className="flex items-center gap-1">
                      <h3 className="text-lg font-semibold group-hover:underline decoration-1 underline-offset-4">
                        {feature.title}
                      </h3>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>

                    {/* Description */}
                    <p className="text-muted-foreground text-sm">
                      {feature.description}
                    </p>

                    {/* Image card */}
                    <div className="relative overflow-hidden rounded-2xl bg-gray-100 aspect-4/3">
                      <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                        style={{ backgroundImage: `url(${feature.image})` }}
                      />

                      {/* Floating badge */}
                      <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-white px-3 py-1.5 shadow-lg">
                        <feature.badgeIcon className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs font-medium text-gray-700">{feature.badge}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
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
      <FeaturedVendorsSection />
      {/* <VendorDiscoverySection /> */}
      {/* <CTASection /> */}
    </PublicLayout>
  );
}
