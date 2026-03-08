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
  CheckSquare,
  Calendar,
  Users,
  FileText,
  Target,
  CheckCircle2,
  ArrowRight,
  Wallet,
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
    title: "Smart Scheduling",
    description: "Tasks automatically adjust based on your event date. See what needs to be done this week.",
  },
  {
    icon: FileText,
    title: "Pre-built Templates",
    description: "Start with expert-designed templates for weddings, corporate events, or parties.",
  },
  {
    icon: Target,
    title: "Progress Tracking",
    description: "Visualize your planning progress with beautiful dashboards and completion metrics.",
  },
  {
    icon: Users,
    title: "Task Assignment",
    description: "Delegate tasks to your partner, family, or wedding party with clear deadlines.",
  },
];

const steps = [
  { step: "01", title: "Choose Your Template", description: "Select from wedding, engagement, or corporate event templates with expert-recommended tasks." },
  { step: "02", title: "Set Your Event Date", description: "Enter your event date and watch tasks automatically schedule themselves." },
  { step: "03", title: "Customize Your List", description: "Add, remove, or modify tasks. Assign to team members and set priorities." },
  { step: "04", title: "Track & Complete", description: "Check off tasks as you complete them. Get reminders and celebrate milestones." },
];

const faqs = [
  { question: "Is the event checklist tool free?", answer: "Yes, our checklist tool is free with unlimited tasks. Premium features like task assignments and file attachments are available with a free Omnicassion account." },
  { question: "What templates are available?", answer: "We offer templates for weddings (12-month, 6-month, 3-month timelines), engagements, corporate events, birthday parties, baby showers, and more." },
  { question: "Can I share the checklist with my partner?", answer: "Absolutely! Invite your partner, family members, or wedding party to collaborate and check off completed items." },
  { question: "How do deadline reminders work?", answer: "Set reminders for any task — one week before, three days before, or on the due date. Receive notifications via email or push notification." },
  { question: "Does it sync with my calendar?", answer: "You can export tasks to Google Calendar, Apple Calendar, or Outlook. Important deadlines appear alongside your regular schedule." },
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
  { title: "Budget Calculator", href: "/event-budget-calculator", description: "Track event expenses easily.", badge: "Track spending", badgeIcon: Wallet },
  { title: "Guest List Manager", href: "/wedding-guest-list-manager", description: "Organize guests and RSVPs.", badge: "Track RSVPs", badgeIcon: Users },
  { title: "Timeline Generator", href: "/event-timeline-generator", description: "Create day-of schedules.", badge: "Minute by minute", badgeIcon: Sparkles },
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

  const checklistItems = [
    { task: "Book venue", completed: true, progress: 100 },
    { task: "Hire photographer", completed: true, progress: 100 },
    { task: "Send invitations", completed: false, progress: 65 },
    { task: "Finalize catering menu", completed: false, progress: 40 },
  ];

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen overflow-hidden bg-gradient-to-br from-purple-500 via-violet-500 to-fuchsia-500 pt-24 pb-20 lg:pt-32 lg:pb-28"
    >
      {/* Background decoration */}
      <div className="absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-pink-400/30 blur-[150px]" />
      <div className="absolute -bottom-32 -left-32 h-[500px] w-[500px] rounded-full bg-purple-300/40 blur-[150px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-fuchsia-400/20 blur-[200px]" />

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
              <CheckSquare className="h-4 w-4" />
              Free Planning Tool
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 1, delay: 0.2, ease }}
              className="font-serif text-5xl font-bold leading-tight text-white sm:text-6xl lg:text-7xl"
            >
              Event Checklist Tool
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease }}
              className="mt-6 text-2xl font-medium text-white/95"
            >
              Never miss a single detail
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease }}
              className="mx-auto lg:mx-0 mt-4 max-w-lg text-lg text-white/80"
            >
              Stay organized with our smart event checklist. Get pre-built templates, automatic scheduling based on your event date, deadline reminders, and collaborative task management.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5, ease }}
              className="mt-10 flex flex-wrap justify-center lg:justify-start gap-4"
            >
              <Button asChild size="lg" className="h-14 rounded-full bg-white px-10 text-lg font-semibold text-purple-600 shadow-xl hover:bg-white/90 hover:scale-105 transition-transform">
                <Link href="/register">
                  Start Planning Free
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
                Unlimited tasks
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Smart reminders
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Export anytime
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
                  <span className="text-white/80 text-sm font-medium">Planning Progress</span>
                  <span className="text-white font-bold text-3xl flex items-center">
                    76%
                  </span>
                </div>
                <div className="h-4 rounded-full bg-white/25 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "76%" }}
                    transition={{ duration: 1.5, delay: 0.8, ease }}
                    className="h-full bg-white rounded-full shadow-lg"
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/80">19 of 25 tasks completed</span>
                  <span className="text-white font-bold text-lg">6 remaining</span>
                </div>
                <div className="space-y-3 pt-4">
                  {checklistItems.map((item, i) => (
                    <motion.div
                      key={item.task}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 1 + i * 0.1 }}
                      className="rounded-2xl bg-white/15 p-4 backdrop-blur-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-6 w-6 items-center justify-center rounded-full ${item.completed ? 'bg-green-500' : 'border-2 border-white/40'}`}>
                          {item.completed && <CheckCircle2 className="h-4 w-4 text-white" />}
                        </div>
                        <div className="flex-1">
                          <div className={`text-sm font-medium ${item.completed ? 'text-white/60 line-through' : 'text-white'}`}>{item.task}</div>
                          {!item.completed && (
                            <div className="mt-2 h-1.5 rounded-full bg-white/20 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${item.progress}%` }}
                                transition={{ duration: 1, delay: 1.2 + i * 0.1 }}
                                className="h-full bg-fuchsia-300 rounded-full"
                              />
                            </div>
                          )}
                        </div>
                        {!item.completed && (
                          <span className="text-xs text-white/60 font-medium">{item.progress}%</span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
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
            Smart Features for Stress-Free Planning
          </h2>
          <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
            Powerful tools to keep you organized
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
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white shadow-lg shadow-purple-500/25">
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
      className="relative min-h-[550px] lg:min-h-[600px] bg-gradient-to-br from-purple-600 to-fuchsia-700 overflow-hidden"
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
              style={{ backgroundImage: `url(https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=1200&q=80)` }}
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
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-lg font-bold text-purple-600 shadow-lg">
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
              <Button asChild size="lg" className="h-14 rounded-full bg-white px-8 text-lg font-semibold text-purple-600 shadow-xl hover:bg-white/90">
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
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white">
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
          style={{ backgroundImage: `url(https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1920&q=80)` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/95 via-violet-900/90 to-fuchsia-900/95" />
      </motion.div>

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <FadeIn>
          <h2 className="font-serif text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
            Ready to plan your perfect event?
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-xl text-white/70">
            Join thousands of couples using Omnicassion for organized, stress-free event planning.
          </p>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg" className="h-14 rounded-full bg-white px-10 text-lg font-semibold text-purple-600 shadow-xl hover:bg-white/90 hover:scale-105 transition-transform">
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

export default function EventChecklistToolPage() {
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
