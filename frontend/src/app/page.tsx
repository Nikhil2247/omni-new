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
  Sparkles,
  Users,
  CheckCircle2,
  Star,
  Calendar,
  Wallet,
  ListChecks,
  CalendarClock,
  Mail,
  Heart,
  ChevronRight,
  Search,
  Clock,
  Shield,
  Zap,
  Award,
  Building2,
  Camera,
  UtensilsCrossed,
  Music,
  Flower2,
  Lightbulb,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { VendorCard } from "@/components/features/vendors/vendor-card";
import { useFeaturedVendors } from "@/hooks/queries/use-public-vendors";
import { usePublicBlogPosts } from "@/hooks/queries/use-public-blog";
import { FeaturedVendors, BannerAd, PromotedAlbums } from "@/components/ads";

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

// ─── Reusable Components ─────────────────────────────────────────────────────

const ease = [0.22, 1, 0.36, 1] as const;

// Floating Elements Component
function FloatingElements() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="from-primary/10 to-primary/5 absolute top-20 left-[10%] h-32 w-32 rounded-full bg-gradient-to-br blur-xl"
      />
      <motion.div
        animate={{ y: [0, 20, 0], x: [0, -15, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute right-[15%] bottom-32 h-24 w-24 rounded-full bg-gradient-to-br from-purple-400/10 to-pink-400/10 blur-xl"
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute top-1/2 left-[5%] h-16 w-16 rounded-full bg-gradient-to-br from-emerald-400/10 to-teal-400/10 blur-lg"
      />
      <motion.div
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="absolute top-1/3 right-[8%] h-20 w-20 rounded-full bg-gradient-to-br from-amber-400/10 to-orange-400/10 blur-lg"
      />
    </div>
  );
}

// Background Pattern Component
function BackgroundPattern() {
  return (
    <div className="pointer-events-none absolute inset-0 opacity-30">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366f1' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}

function FadeIn({
  children,
  delay = 0,
  className = "",
  y = 40,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y, filter: "blur(4px)" }}
      animate={
        isInView
          ? { opacity: 1, y: 0, filter: "blur(0px)" }
          : { opacity: 0, y, filter: "blur(4px)" }
      }
      transition={{ duration: 0.6, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function StaggerContainer({
  children,
  className = "",
  staggerDelay = 0.05,
}: {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: staggerDelay, delayChildren: 0.1 } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const staggerChild: Variants = {
  hidden: { opacity: 0, y: 25, scale: 0.97, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease },
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
    if (isInView) setShouldLoadVideo(true);
  }, [isInView]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setPrefersReducedMotion(mediaQuery.matches);
    onChange();
    mediaQuery.addEventListener("change", onChange);
    return () => mediaQuery.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!videoRef.current || !shouldLoadVideo || prefersReducedMotion) return;
    const playPromise = videoRef.current.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => setIsVideoReady(false));
    }
  }, [shouldLoadVideo, prefersReducedMotion]);

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div className="bg-background absolute inset-0" />
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

// ─── Data ────────────────────────────────────────────────────────────────────

const serviceCategories = [
  { title: "Venue", icon: Building2, href: "/vendors?categoryId=venue" },
  { title: "Photography", icon: Camera, href: "/vendors?categoryId=photography" },
  { title: "Catering", icon: UtensilsCrossed, href: "/vendors?categoryId=food-catering" },
  { title: "Decor", icon: Sparkles, href: "/vendors?categoryId=decor-design" },
  { title: "Mehndi", icon: Flower2, href: "/vendors?categoryId=mehndi-artists" },
  { title: "Entertainment", icon: Music, href: "/vendors?categoryId=entertainment" },
  { title: "Planner", icon: Users, href: "/vendors?categoryId=wedding-planning" },
  { title: "Makeup", icon: Lightbulb, href: "/vendors?categoryId=makeup-hair" },
];

const tools = [
  {
    title: "Budget Calculator",
    description: "Track expenses and manage your event budget",
    icon: Wallet,
    href: "/event-budget-calculator",
    color: "from-emerald-500 to-teal-500",
  },
  {
    title: "Guest List Manager",
    description: "Organize guests, RSVPs, and seating",
    icon: Users,
    href: "/wedding-guest-list-manager",
    color: "from-blue-500 to-indigo-500",
  },
  {
    title: "Event Checklist",
    description: "Never miss a task with smart planning",
    icon: ListChecks,
    href: "/event-checklist-tool",
    color: "from-purple-500 to-violet-500",
  },
  {
    title: "Timeline Generator",
    description: "Create day-of schedules for your event",
    icon: CalendarClock,
    href: "/event-timeline-generator",
    color: "from-orange-500 to-amber-500",
  },
  {
    title: "RSVP Manager",
    description: "Track responses and send reminders",
    icon: Mail,
    href: "/rsvp-manager",
    color: "from-pink-500 to-rose-500",
  },
  {
    title: "Digital Invites",
    description: "Design and send beautiful invitations",
    icon: Heart,
    href: "/digital-invite-generator",
    color: "from-teal-500 to-cyan-500",
  },
];

const platformFeatures = [
  {
    icon: Search,
    title: "Discover Vendors",
    description:
      "Browse thousands of verified vendors across all categories including venues, photographers, caterers, decorators, and more. Filter by location, budget, style, and availability to find your perfect match.",
    color: "from-blue-500 to-indigo-500",
  },
  {
    icon: Star,
    title: "Verified Reviews",
    description:
      "Read authentic reviews and ratings from real couples who have worked with our vendors. See photos, detailed feedback, and honest experiences to make informed decisions.",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: Calendar,
    title: "Planning Tools",
    description:
      "Access free budget calculators, guest list managers, event checklists, timeline generators, RSVP trackers, and digital invite creators to stay organized throughout your planning journey.",
    color: "from-emerald-500 to-teal-500",
  },
  {
    icon: Shield,
    title: "Secure Booking",
    description:
      "Book vendors with confidence using our secure payment processing. Your transactions are protected, and we offer booking guarantees to ensure peace of mind for your special day.",
    color: "from-purple-500 to-violet-500",
  },
  {
    icon: Zap,
    title: "Instant Communication",
    description:
      "Message vendors directly through our platform, share ideas, request quotes, negotiate details, and finalize everything in one convenient place without switching between apps.",
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: Award,
    title: "Best Price Guarantee",
    description:
      "Get competitive pricing with transparent quotes from multiple vendors. Compare packages, negotiate deals, and ensure you're getting the best value for your celebration.",
    color: "from-cyan-500 to-sky-500",
  },
];

const inspirationCategories = [
  {
    title: "Wedding Decor",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80",
    count: "2,500+ ideas",
  },
  {
    title: "Venue Ideas",
    image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&q=80",
    count: "1,800+ venues",
  },
  {
    title: "Bridal Looks",
    image: "https://images.unsplash.com/photo-1594552072238-b8a33785b261?w=600&q=80",
    count: "3,200+ styles",
  },
  {
    title: "Food & Menu",
    image: "https://images.unsplash.com/photo-1555244162-803834f70033?w=600&q=80",
    count: "1,500+ menus",
  },
];

const faqs = [
  {
    question: "Is Omnicassion free to use?",
    answer:
      "Yes! Creating an account, browsing vendors, and using our planning tools is completely free. You only pay when you book vendor services.",
  },
  {
    question: "How do I find the right vendor?",
    answer:
      "Use our search filters to narrow down by category, location, budget, and style. Read reviews, view portfolios, and message vendors directly to find your perfect match.",
  },
  {
    question: "Are vendors on Omnicassion verified?",
    answer:
      "Yes, all vendors go through a verification process. We check business documents, portfolios, and monitor reviews to ensure quality service.",
  },
  {
    question: "Can I manage my entire event on Omnicassion?",
    answer:
      "Absolutely! Use our budget calculator, guest list manager, checklist, timeline generator, and digital invites to plan every detail of your event.",
  },
  {
    question: "How does vendor booking work?",
    answer:
      "Browse vendors, request quotes, compare prices, and book directly through our secure platform. We handle payments and provide booking protection.",
  },
  {
    question: "What if I need help with planning?",
    answer:
      "Our AI assistant is available 24/7 to answer questions and provide recommendations. You can also hire professional planners through our platform.",
  },
];

// ─── Hero ────────────────────────────────────────────────────────────────────

function HeroSection() {
  const scrollToContent = useCallback(() => {
    document.getElementById("services")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });

  const rawY = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const rawOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const rawScale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);
  const heroTextY = useSpring(rawY, { stiffness: 100, damping: 30 });
  const heroOpacity = useSpring(rawOpacity, { stiffness: 100, damping: 30 });
  const heroScale = useSpring(rawScale, { stiffness: 100, damping: 30 });

  return (
    <section
      ref={heroRef}
      className="bg-background relative z-20 flex min-h-[70vh] w-full items-center justify-center overflow-hidden py-16 sm:min-h-[85vh] sm:py-20"
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
          Plan Your Perfect Event
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease }}
          className="mx-auto mt-6 max-w-2xl text-lg text-white/90 sm:text-xl"
        >
          Discover top vendors, manage your budget, and bring your dream celebration to life.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.5, ease }}
          className="relative z-100 mx-auto mt-10 max-w-2xl"
        >
          <GlobalSearch
            placeholder="Search vendors, venues, services..."
            className="max-w-none"
            showOnHomePage={true}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7, ease }}
          className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-white/80"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            5,000+ Verified Vendors
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Free Planning Tools
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Trusted by 50,000+ Couples
          </span>
        </motion.div>
      </motion.div>

      <motion.button
        onClick={scrollToContent}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="animate-bounce-slow absolute bottom-16 left-1/2 z-20 -translate-x-1/2 text-white/75 transition-colors hover:text-white sm:bottom-20"
        aria-label="Scroll down"
      >
        <ArrowDown className="h-6 w-6" />
      </motion.button>
    </section>
  );
}

// ─── Start Planning Section with Floating Elements ───────────────────────────

function StartPlanningSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.45, ease } },
  };

  return (
    <section
      id="services"
      ref={sectionRef}
      className="from-background via-background to-primary/5 relative overflow-hidden bg-gradient-to-br py-14 lg:py-20"
    >
      <BackgroundPattern />
      <FloatingElements />

      <div className="relative mx-auto max-w-7xl px-6">
        {/* Section Header */}
        <FadeIn className="mb-10 text-center">
          <div className="from-primary/10 to-primary/20 text-primary mb-4 inline-flex items-center rounded-full bg-gradient-to-r px-4 py-2 text-sm font-semibold">
            <Sparkles className="mr-2 h-4 w-4" />
            Start Planning
          </div>
          <h2 className="font-serif text-3xl leading-tight font-bold sm:text-4xl">
            Everything You Need to Plan Your{" "}
            <span className="from-primary to-primary/70 bg-gradient-to-r bg-clip-text text-transparent">
              Dream Event
            </span>
          </h2>
          <p className="text-muted-foreground mx-auto mt-4 max-w-3xl text-lg">
            Omnicassion is your all-in-one event planning platform. From finding verified vendors to
            managing your budget, we provide every tool and resource you need to create
            unforgettable celebrations.
          </p>
        </FadeIn>

        {/* Platform Features Grid */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={containerVariants}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {platformFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
            >
              <div className="group relative h-full overflow-hidden">
                {/* Card Background */}
                <div className="bg-card/80 border-border/50 group-hover:border-primary/30 absolute inset-0 rounded-2xl border shadow-lg backdrop-blur-lg transition-all group-hover:shadow-xl" />

                {/* Floating Elements inside card */}
                <motion.div
                  animate={{ y: [0, -8, 0], x: [0, 4, 0] }}
                  transition={{ duration: 4 + index * 0.5, repeat: Infinity, ease: "easeInOut" }}
                  className="from-primary/10 absolute -top-4 -right-4 h-20 w-20 rounded-full bg-gradient-to-br to-transparent blur-xl"
                />
                <motion.div
                  animate={{ y: [0, 6, 0], x: [0, -3, 0] }}
                  transition={{
                    duration: 5 + index * 0.3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1,
                  }}
                  className="from-primary/8 absolute -bottom-6 -left-6 h-16 w-16 rounded-full bg-gradient-to-tr to-transparent blur-lg"
                />
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: index * 0.2,
                  }}
                  className="from-primary/5 absolute top-1/2 right-4 h-8 w-8 rounded-full bg-gradient-to-br to-transparent blur-md"
                />

                {/* Card Content */}
                <div className="relative z-10 flex h-full flex-col p-6">
                  <div
                    className={`h-14 w-14 rounded-xl bg-gradient-to-br ${feature.color} mb-4 flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-105`}
                  >
                    <feature.icon className="h-7 w-7" />
                  </div>
                  <h3 className="group-hover:text-primary mb-3 text-xl font-bold transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground flex-1 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── Tools Section ───────────────────────────────────────────────────────────

function ToolsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.45, ease } },
  };

  return (
    <section ref={sectionRef} className="bg-muted/30 relative overflow-hidden py-14 lg:py-20">
      <FloatingElements />

      <div className="relative mx-auto max-w-7xl px-6">
        <FadeIn className="mb-10 text-center">
          <div className="from-primary/10 to-primary/20 text-primary mb-4 inline-flex items-center rounded-full bg-gradient-to-r px-4 py-2 text-sm font-semibold">
            <Zap className="mr-2 h-4 w-4" />
            Free Tools
          </div>
          <h2 className="font-serif text-3xl leading-tight font-bold sm:text-4xl">
            Planning Tools to Keep You{" "}
            <span className="from-primary to-primary/70 bg-gradient-to-r bg-clip-text text-transparent">
              Organized
            </span>
          </h2>
          <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-lg">
            Powerful, easy-to-use tools to plan every aspect of your event
          </p>
        </FadeIn>

        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={containerVariants}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {tools.map((tool) => (
            <motion.div
              key={tool.title}
              variants={itemVariants}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
            >
              <Link
                href={tool.href}
                className="group bg-card/80 flex items-start gap-5 rounded-2xl border p-6 backdrop-blur-sm transition-all hover:shadow-lg"
              >
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${tool.color} text-white shadow-lg`}
                >
                  <tool.icon className="h-7 w-7" />
                </div>
                <div className="flex-1">
                  <h3 className="group-hover:text-primary mb-1 text-lg font-bold transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-muted-foreground mb-3 text-sm">{tool.description}</p>
                  <span className="text-primary inline-flex items-center text-sm font-medium">
                    Try it free
                    <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── Featured Vendors Section ────────────────────────────────────────────────

function FeaturedVendorsSection() {
  const { data: vendors, isLoading } = useFeaturedVendors(4);
  if (!isLoading && (!vendors || vendors.length === 0)) return null;

  return (
    <section className="bg-background py-14 lg:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <FadeIn className="mb-10 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div>
            <div className="from-primary/10 to-primary/20 text-primary mb-3 inline-flex items-center rounded-full bg-gradient-to-r px-4 py-2 text-sm font-semibold">
              <Star className="mr-2 h-4 w-4" />
              Featured
            </div>
            <h2 className="font-serif text-2xl font-bold sm:text-3xl lg:text-4xl">
              Top-Rated{" "}
              <span className="from-primary to-primary/70 bg-gradient-to-r bg-clip-text text-transparent">
                Vendors
              </span>
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Handpicked professionals for your special day
            </p>
          </div>
          <Button asChild variant="outline" className="h-10 rounded-full">
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

// ─── Inspire Section ─────────────────────────────────────────────────────────

function InspireSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 25, scale: 0.97, filter: "blur(4px)" },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: { duration: 0.5, ease },
    },
  };

  return (
    <section ref={sectionRef} className="bg-muted/30 relative overflow-hidden py-14 lg:py-20">
      <FloatingElements />

      <div className="relative mx-auto max-w-7xl px-6">
        <FadeIn className="mb-10 text-center">
          <div className="from-primary/10 to-primary/20 text-primary mb-4 inline-flex items-center rounded-full bg-gradient-to-r px-4 py-2 text-sm font-semibold">
            <Heart className="mr-2 h-4 w-4" />
            Get Inspired
          </div>
          <h2 className="font-serif text-3xl leading-tight font-bold sm:text-4xl">
            Explore Ideas for Your{" "}
            <span className="from-primary to-primary/70 bg-gradient-to-r bg-clip-text text-transparent">
              Event
            </span>
          </h2>
          <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-lg">
            Browse through stunning photos, trending styles, and creative ideas
          </p>
        </FadeIn>

        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={containerVariants}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {inspirationCategories.map((cat) => (
            <motion.div key={cat.title} variants={itemVariants}>
              <Link href="/discover" className="group block">
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl">
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                    style={{ backgroundImage: `url(${cat.image})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute right-0 bottom-0 left-0 p-6">
                    <h3 className="mb-1 text-xl font-bold text-white">{cat.title}</h3>
                    <p className="text-sm text-white/70">{cat.count}</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <FadeIn delay={0.2} className="mt-10 text-center">
          <Button asChild variant="outline" className="h-10 rounded-full">
            <Link href="/discover">
              Explore All Ideas
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </FadeIn>
      </div>
    </section>
  );
}

// ─── Top Blogs Section ───────────────────────────────────────────────────────

function TopBlogsSection() {
  const { data: blogsData, isLoading } = usePublicBlogPosts({
    status: "PUBLISHED",
    limit: 3,
    sortBy: "mostViewed",
  });
  const blogs = blogsData?.data || [];
  if (isLoading || blogs.length === 0) return null;

  return (
    <section className="bg-background py-14 lg:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <FadeIn className="mb-10 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div>
            <div className="from-primary/10 to-primary/20 text-primary mb-3 inline-flex items-center rounded-full bg-gradient-to-r px-4 py-2 text-sm font-semibold">
              <Calendar className="mr-2 h-4 w-4" />
              Latest Articles
            </div>
            <h2 className="font-serif text-2xl font-bold sm:text-3xl lg:text-4xl">
              Top Wedding{" "}
              <span className="from-primary to-primary/70 bg-gradient-to-r bg-clip-text text-transparent">
                Blogs
              </span>
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Tips, trends, and inspiration for your big day
            </p>
          </div>
          <Button asChild variant="outline" className="h-10 rounded-full">
            <Link href="/blog">
              View All Articles
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </FadeIn>

        <StaggerContainer className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3" staggerDelay={0.1}>
          {blogs.map((blog) => (
            <motion.div key={blog.id} variants={staggerChild}>
              <Link href={`/blog/${blog.slug}`} className="group block">
                <div className="relative mb-5 aspect-[16/10] overflow-hidden rounded-2xl">
                  {blog.featuredImage ? (
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                      style={{ backgroundImage: `url(${blog.featuredImage})` }}
                    />
                  ) : (
                    <div className="from-primary/20 to-primary/5 absolute inset-0 bg-gradient-to-br" />
                  )}
                </div>
                <div className="text-muted-foreground mb-3 flex items-center gap-3 text-sm">
                  {blog.category && (
                    <span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-medium">
                      {blog.category.name}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {blog.readingTime} min read
                  </span>
                </div>
                <h3 className="group-hover:text-primary mb-2 line-clamp-2 text-xl font-bold transition-colors">
                  {blog.title}
                </h3>
                {blog.excerpt && (
                  <p className="text-muted-foreground line-clamp-2 text-sm">{blog.excerpt}</p>
                )}
              </Link>
            </motion.div>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

// ─── FAQ Section ─────────────────────────────────────────────────────────────

function FAQSection() {
  return (
    <section className="from-muted/30 via-background to-primary/5 relative overflow-hidden bg-gradient-to-br py-14 lg:py-20">
      <BackgroundPattern />
      <FloatingElements />

      <div className="relative mx-auto max-w-7xl px-6">
        <FadeIn className="mb-10 text-center">
          <div className="from-primary/10 to-primary/20 text-primary mb-4 inline-flex items-center rounded-full bg-gradient-to-r px-4 py-2 text-sm font-semibold">
            <HelpCircle className="mr-2 h-4 w-4" />
            FAQ Section
          </div>
          <h2 className="font-serif text-3xl leading-tight font-bold sm:text-4xl">
            Got{" "}
            <span className="from-primary to-primary/70 bg-gradient-to-r bg-clip-text text-transparent">
              Questions?
            </span>
            <br />
            We've Got Answers
          </h2>
        </FadeIn>

        <FadeIn delay={0.15} className="mx-auto max-w-3xl">
          <Accordion type="single" collapsible defaultValue="item-0" className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card/80 rounded-2xl border px-6 backdrop-blur-sm transition-shadow data-[state=open]:shadow-lg"
              >
                <AccordionTrigger className="py-6 text-left text-lg font-semibold hover:no-underline">
                  <div className="flex items-center gap-4">
                    <div className="bg-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-full border">
                      <span className="text-muted-foreground text-sm font-semibold">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>
                    {faq.question}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6 pl-12 text-base">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </FadeIn>
      </div>
    </section>
  );
}

// ─── Join as Vendor Section ──────────────────────────────────────────────────

function JoinAsVendorSection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], [0, -80]);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.5, ease } },
  };

  return (
    <section ref={ref} className="relative overflow-hidden py-16 lg:py-24">
      <motion.div style={{ y: bgY }} className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0 scale-110 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(https://images.unsplash.com/photo-1519741497674-611481863552?w=1920&q=80)`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-purple-900/90 to-indigo-900/95" />
      </motion.div>

      <motion.div
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        variants={containerVariants}
        className="relative z-10 mx-auto max-w-4xl px-6 text-center"
      >
        <motion.div
          variants={itemVariants}
          className="mb-4 inline-flex items-center rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur-sm"
        >
          <Users className="mr-2 h-4 w-4" />
          For Vendors
        </motion.div>
        <motion.h2
          variants={itemVariants}
          className="font-serif text-3xl font-bold text-white sm:text-4xl lg:text-5xl"
        >
          Grow Your Business{" "}
          <span className="bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
            With Us
          </span>
        </motion.h2>
        <motion.p variants={itemVariants} className="mx-auto mt-4 max-w-2xl text-lg text-white/70">
          Join thousands of vendors reaching couples planning their dream events.
        </motion.p>

        <motion.div variants={itemVariants} className="mt-8 grid gap-4 text-center sm:grid-cols-3">
          {[
            { value: "50,000+", label: "Active Users" },
            { value: "5,000+", label: "Verified Vendors" },
            { value: "10,000+", label: "Successful Events" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-3xl font-bold text-white">{stat.value}</div>
              <div className="mt-1 text-sm text-white/60">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <Button
            asChild
            size="lg"
            className="h-12 rounded-full bg-white px-8 text-base font-semibold text-purple-600 shadow-xl hover:bg-white/90"
          >
            <Link href="/vendor-registration">
              Join as Vendor
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-12 rounded-full border-2 border-white/40 bg-white/10 px-8 text-base font-semibold text-white backdrop-blur-sm hover:bg-white/20"
          >
            <Link href="/vendor-benefits">Learn More</Link>
          </Button>
        </motion.div>
      </motion.div>
    </section>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

// ─── Sponsored Banner Section ─────────────────────────────────────────────────

function SponsoredBannerSection() {
  return (
    <section className="bg-background py-8">
      <div className="mx-auto max-w-7xl px-6">
        <BannerAd placement="homepage" variant="large" />
      </div>
    </section>
  );
}

// ─── Boosted Vendors Section (Paid Promotions) ────────────────────────────────

function BoostedVendorsSection() {
  return (
    <section className=" py-8">
      <div className="mx-auto max-w-7xl px-6">
        <FeaturedVendors
          limit={4}
          title="Promoted Vendors"
          subtitle="Premium vendors ready to make your event special"
          className=""
        />
      </div>
    </section>
  );
}

// ─── Promoted Albums Section ──────────────────────────────────────────────────

function PromotedAlbumsSection() {
  return (
    <section className=" py-8">
      <div className="mx-auto max-w-7xl px-6">
        <PromotedAlbums
          limit={4}
          title="Trending Portfolios"
          subtitle="Discover stunning work from top vendors"
          className=""
        />
      </div>
    </section>
  );
}

export default function Home() {
  useSmoothScroll();

  return (
    <PublicLayout>
      <HeroSection />
      <StartPlanningSection />
      <SponsoredBannerSection />
      <ToolsSection />
      <BoostedVendorsSection />
      <FeaturedVendorsSection />
      <PromotedAlbumsSection />
      <InspireSection />
      <TopBlogsSection />
      <FAQSection />
      {/* <JoinAsVendorSection /> */}
    </PublicLayout>
  );
}
