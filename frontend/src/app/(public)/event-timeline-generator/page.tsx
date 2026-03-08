"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import NextImage from "next/image";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useInView,
  type Variants,
} from "framer-motion";
import Lenis from "lenis";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { JsonLd } from "@/components/common/JsonLd";
import type { FAQSchema } from "@/lib/seo/types";
import {
  Clock,
  Calendar,
  Layers,
  Share2,
  Smartphone,
  ArrowRight,
  CheckCircle2,
  Users,
  Sparkles,
} from "lucide-react";

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
      initial={{ opacity: 0, y, filter: "blur(4px)" }}
      animate={isInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : { opacity: 0, y, filter: "blur(4px)" }}
      transition={{ duration: 0.7, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Data ────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: Calendar,
    title: "Visual Timeline",
    description: "Drag and drop events into place. See your entire day at a glance with intuitive visual scheduling.",
  },
  {
    icon: Layers,
    title: "Multiple Events",
    description: "Create parallel timelines for wedding party, vendors, and guests to keep everyone coordinated.",
  },
  {
    icon: Share2,
    title: "Share with Vendors",
    description: "Send timeline links to photographers, caterers, and coordinators with relevant portions visible.",
  },
  {
    icon: Smartphone,
    title: "Mobile Access",
    description: "Access your timeline from any device on the big day. Update in real-time from your phone.",
  },
];

const steps = [
  { step: "01", title: "Start with a Template", description: "Choose from wedding ceremony, reception, sangeet, or custom event templates." },
  { step: "02", title: "Add Your Events", description: "Add events with start times, durations, and descriptions for each moment." },
  { step: "03", title: "Assign to Groups", description: "Specify who needs to be where - bride's side, groom's side, vendors." },
  { step: "04", title: "Share & Execute", description: "Share the timeline with everyone and track progress on the big day." },
];

const faqs = [
  { question: "Is the timeline generator free?", answer: "Yes, our basic timeline generator is completely free. Premium features like multiple tracks and mobile notifications are available with a free Omnicassion account." },
  { question: "Can I create timelines for multiple events?", answer: "Absolutely! Create separate timelines for your sangeet, mehendi, wedding ceremony, reception, or any combination of events." },
  { question: "How do I share the timeline with my vendors?", answer: "Generate a unique link for each vendor showing only the portions relevant to them. The photographer sees photo moments, the caterer sees meal times." },
  { question: "Can vendors update the timeline?", answer: "You control who can edit. Share view-only links with most vendors, but give edit access to your coordinator if needed." },
  { question: "What if timing changes on the day?", answer: "Update the timeline in real-time from your phone. Everyone with access sees the changes instantly." },
];

const faqSchema: FAQSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
};

const relatedTools = [
  { title: "Event Checklist", href: "/event-checklist-tool", description: "Never miss a planning task.", badge: "Stay organized", badgeIcon: CheckCircle2 },
  { title: "Guest List Manager", href: "/wedding-guest-list-manager", description: "Track RSVPs and manage guests.", badge: "Track RSVPs", badgeIcon: Users },
  { title: "Budget Calculator", href: "/event-budget-calculator", description: "Track event expenses easily.", badge: "Track spending", badgeIcon: Sparkles },
];

// ─── Landing Header ──────────────────────────────────────────────────────────

function LandingHeader() {
  return (
    <header className="absolute top-0 left-0 right-0 z-50">
      <nav className="mx-auto flex items-center justify-center px-6 py-6">
        <Link href="/" className="flex items-center">
          <NextImage
            src="/images/omnilogo.avif"
            width={180}
            height={40}
            unoptimized={true}
            priority={true}
            className="h-10 w-auto"
            alt="Omnicassion"
          />
        </Link>
      </nav>
    </header>
  );
}

// ─── Hero Section ────────────────────────────────────────────────────────────

function HeroSection() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const rawY = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const rawOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const heroTextY = useSpring(rawY, { stiffness: 100, damping: 30 });
  const heroOpacity = useSpring(rawOpacity, { stiffness: 100, damping: 30 });

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen overflow-hidden bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 pt-24 pb-20 lg:pt-32 lg:pb-28"
    >
      {/* Background decoration */}
      <div className="absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-red-400/30 blur-[150px]" />
      <div className="absolute -bottom-32 -left-32 h-[500px] w-[500px] rounded-full bg-orange-300/40 blur-[150px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-white/10 blur-[200px]" />

      <motion.div
        style={{ y: heroTextY, opacity: heroOpacity }}
        className="relative z-10 mx-auto max-w-7xl px-6"
      >
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left - Text content */}
          <div className="text-center lg:text-left">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/25 px-5 py-2 text-sm font-semibold text-white backdrop-blur-sm"
            >
              <Clock className="h-4 w-4" />
              Free Scheduling Tool
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 1, delay: 0.2, ease }}
              className="font-serif text-5xl font-bold leading-tight text-white sm:text-6xl lg:text-7xl"
            >
              Event Timeline Generator
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease }}
              className="mt-6 text-2xl font-medium text-white/95"
            >
              Keep your big day running smoothly
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease }}
              className="mx-auto lg:mx-0 mt-4 max-w-lg text-lg text-white/80"
            >
              Create detailed day-of schedules for your wedding or event. Organize every moment, share with vendors, and ensure everyone knows exactly where to be and when.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5, ease }}
              className="mt-10 flex flex-wrap justify-center lg:justify-start gap-4"
            >
              <Button asChild size="lg" className="h-14 rounded-full bg-white px-10 text-lg font-semibold text-orange-600 shadow-xl hover:bg-white/90 hover:scale-105 transition-transform">
                <Link href="/register">
                  Create Your Timeline
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 rounded-full border-2 border-white/40 bg-white/10 px-10 text-lg font-semibold text-white backdrop-blur-sm hover:bg-white/20">
                <Link href="/vendors">Explore Vendors</Link>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="mt-10 flex flex-wrap justify-center lg:justify-start gap-8 text-sm text-white/90"
            >
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Unlimited events
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Share with vendors
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Export as PDF
              </span>
            </motion.div>
          </div>

          {/* Right - Interactive preview */}
          <motion.div
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4, ease }}
            className="relative hidden lg:block"
          >
            <div className="rounded-3xl bg-white/15 backdrop-blur-md p-8 border border-white/30 shadow-2xl">
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-white/80 text-sm font-medium">Wedding Day Timeline</span>
                  <span className="text-white font-bold text-xl flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Dec 15, 2024
                  </span>
                </div>
                <div className="space-y-3 pt-2">
                  {[
                    { time: "9:00 AM", event: "Bridal Preparation", duration: "2 hrs", color: "bg-orange-400" },
                    { time: "11:00 AM", event: "Photography Session", duration: "1 hr", color: "bg-amber-400" },
                    { time: "12:30 PM", event: "Baraat Arrival", duration: "45 min", color: "bg-yellow-400" },
                    { time: "1:30 PM", event: "Wedding Ceremony", duration: "2 hrs", color: "bg-orange-500" },
                  ].map((item, i) => (
                    <motion.div
                      key={item.time}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.8 + i * 0.15 }}
                      className="flex items-center gap-4"
                    >
                      <div className="text-white/70 text-sm w-20 shrink-0 font-medium">{item.time}</div>
                      <div className={`w-3 h-3 rounded-full ${item.color}`} />
                      <div className="flex-1 rounded-xl bg-white/15 p-3 backdrop-blur-sm">
                        <div className="text-white font-semibold text-sm">{item.event}</div>
                        <div className="text-xs text-white/60 mt-0.5">{item.duration}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 1.4 }}
                  className="pt-3 flex items-center justify-between text-sm"
                >
                  <span className="text-white/70">4 of 12 events shown</span>
                  <span className="text-white font-semibold flex items-center gap-1">
                    View full timeline <ArrowRight className="h-3 w-3" />
                  </span>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

// ─── Features Section ────────────────────────────────────────────────────────

function FeaturesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
  };

  return (
    <section ref={sectionRef} className="bg-background py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <FadeIn className="text-center mb-16">
          <p className="text-primary mb-4 text-sm font-semibold tracking-widest uppercase">Features</p>
          <h2 className="font-serif text-4xl font-bold leading-tight sm:text-5xl">
            Everything you need to schedule your event
          </h2>
          <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
            Powerful tools to organize every moment
          </p>
        </FadeIn>

        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={containerVariants}
          className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              whileHover={{ y: -8, transition: { duration: 0.25 } }}
              className="group text-center"
            >
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25">
                <feature.icon className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── How It Works Section ────────────────────────────────────────────────────

function HowItWorksSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const rawImageY = useTransform(scrollYProgress, [0, 1], ["-5%", "5%"]);
  const imageY = useSpring(rawImageY, { stiffness: 100, damping: 30 });

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.3 } },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30, filter: "blur(4px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.5, ease } },
  };

  return (
    <motion.section
      ref={sectionRef}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className="relative min-h-[550px] lg:min-h-[600px] bg-gradient-to-br from-orange-600 to-amber-700 overflow-hidden"
    >
      <div className="flex flex-col lg:flex-row min-h-[550px] lg:min-h-[600px]">
        {/* Image Side */}
        <motion.div
          initial={{ opacity: 0, x: -60, scale: 1.1 }}
          animate={isInView ? { opacity: 1, x: 0, scale: 1 } : {}}
          transition={{ duration: 0.8, ease, delay: 0.2 }}
          className="relative h-[400px] w-full lg:h-auto lg:w-1/2 overflow-hidden"
        >
          <motion.div style={{ y: imageY }} className="absolute inset-[-10%] bg-cover bg-center">
            <div
              className="absolute inset-0 bg-cover bg-center scale-110"
              style={{ backgroundImage: `url(https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=1200&q=80)` }}
            />
          </motion.div>
        </motion.div>

        {/* Text Side */}
        <div className="flex w-full items-center lg:w-1/2">
          <motion.div
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={containerVariants}
            className="px-8 py-16 lg:px-16 xl:px-20"
          >
            <motion.span
              variants={itemVariants}
              className="mb-4 inline-block rounded-full bg-white/25 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white"
            >
              Simple Process
            </motion.span>

            <motion.h2
              variants={itemVariants}
              className="font-serif text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl"
            >
              How it works
            </motion.h2>

            <motion.div variants={itemVariants} className="mt-10 space-y-8">
              {steps.map((item) => (
                <div key={item.step} className="flex gap-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-lg font-bold text-orange-600 shadow-lg">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{item.title}</h3>
                    <p className="mt-2 text-white/80">{item.description}</p>
                  </div>
                </div>
              ))}
            </motion.div>

            <motion.div variants={itemVariants} className="mt-10">
              <Button asChild size="lg" className="h-14 rounded-full bg-white px-8 text-lg font-semibold text-orange-600 shadow-xl hover:bg-white/90">
                <Link href="/register">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}

// ─── FAQ Section ─────────────────────────────────────────────────────────────

function FAQSection() {
  return (
    <section className="bg-muted/30 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <FadeIn className="text-center mb-16">
          <p className="text-primary mb-4 text-sm font-semibold tracking-widest uppercase">FAQ</p>
          <h2 className="font-serif text-4xl font-bold leading-tight sm:text-5xl">
            Frequently Asked Questions
          </h2>
        </FadeIn>

        <FadeIn delay={0.15} className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible defaultValue="item-0" className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="rounded-2xl border bg-card px-6 data-[state=open]:shadow-lg transition-shadow"
              >
                <AccordionTrigger className="text-left hover:no-underline py-6 text-lg font-semibold">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6 text-base">
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

// ─── Related Tools Section ───────────────────────────────────────────────────

function RelatedToolsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
  };

  return (
    <section ref={sectionRef} className="bg-background py-24 lg:py-32 border-t">
      <div className="mx-auto max-w-7xl px-6">
        <FadeIn className="mb-16 text-center">
          <p className="text-primary mb-4 text-sm font-semibold tracking-widest uppercase">More Tools</p>
          <h2 className="font-serif text-4xl font-bold sm:text-5xl">
            Explore More Planning Tools
          </h2>
        </FadeIn>

        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={containerVariants}
          className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
        >
          {relatedTools.map((tool) => (
            <motion.div
              key={tool.href}
              variants={itemVariants}
              whileHover={{ y: -8, transition: { duration: 0.25 } }}
            >
              <Link href={tool.href} className="group block p-6 rounded-2xl border bg-card hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white">
                    <tool.badgeIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{tool.title}</h3>
                    <p className="text-sm text-muted-foreground">{tool.description}</p>
                  </div>
                </div>
                <div className="flex items-center text-sm font-medium text-primary">
                  Learn more
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
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
  const bgY = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <section ref={ref} className="relative overflow-hidden py-24 lg:py-32">
      {/* Background Image */}
      <motion.div
        style={{ y: bgY }}
        className="absolute inset-0 -z-10"
      >
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-110"
          style={{ backgroundImage: `url(https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1920&q=80)` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-orange-900/95 via-amber-900/90 to-yellow-900/95" />
      </motion.div>

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <FadeIn>
          <h2 className="font-serif text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
            Ready to schedule your perfect day?
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-xl text-white/70">
            Join thousands of couples using Omnicassion for seamlessly coordinated events.
          </p>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg" className="h-14 rounded-full bg-white px-10 text-lg font-semibold text-orange-600 shadow-xl hover:bg-white/90 hover:scale-105 transition-transform">
              <Link href="/register">
                Create Free Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-14 rounded-full border-2 border-white/40 bg-white/10 px-10 text-lg font-semibold text-white backdrop-blur-sm hover:bg-white/20">
              <Link href="/vendors">Browse Vendors</Link>
            </Button>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function EventTimelineGeneratorPage() {
  useSmoothScroll();

  return (
    <div className="relative min-h-screen">
      <JsonLd data={faqSchema} />
      <LandingHeader />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <FAQSection />
      <RelatedToolsSection />
      <CTASection />
    </div>
  );
}
