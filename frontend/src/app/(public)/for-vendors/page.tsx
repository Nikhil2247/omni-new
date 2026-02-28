'use client'

import { useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { trackDashboard } from '@/lib/analytics/umami'
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useInView,
  type Variants,
} from 'framer-motion'
import Lenis from 'lenis'
import { Button } from '@/components/ui/button'
import {
  ArrowRight,
  Users,
  TrendingUp,
  Calendar,
  MessageSquare,
  Star,
  Shield,
  Sparkles,
  BarChart3,
  Wallet,
  Camera,
  Award,
  CheckCircle2,
  ArrowDown,
  Mail,
  Phone,
  Clock,
  Target,
  Zap,
  Globe,
} from 'lucide-react'

// ─── Lenis Smooth Scroll ─────────────────────────────────────────────────────

function useSmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })
    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
    return () => lenis.destroy()
  }, [])
}

// ─── Reusable Motion Wrappers ────────────────────────────────────────────────

const ease = [0.22, 1, 0.36, 1] as const

function FadeIn({
  children,
  delay = 0,
  className = '',
  y = 50,
}: {
  children: React.ReactNode
  delay?: number
  className?: string
  y?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

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
  )
}

function StaggerContainer({
  children,
  className = '',
  staggerDelay = 0.06,
}: {
  children: React.ReactNode
  className?: string
  staggerDelay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: staggerDelay } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

const staggerChild: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.55, ease },
  },
}

// ─── Constants ───────────────────────────────────────────────────────────────

const stats = [
  { value: '50K+', label: 'Couples & Planners', icon: Users },
  { value: '₹500Cr+', label: 'Revenue Generated', icon: TrendingUp },
  { value: '15K+', label: 'Events Booked', icon: Calendar },
  { value: '4.9★', label: 'Vendor Rating', icon: Star },
]

const benefits = [
  {
    icon: Users,
    title: 'Quality Leads',
    description: 'Connect with engaged couples and event planners actively searching for your services.',
    bg: 'bg-sky-50',
    iconBg: 'bg-sky-100',
    iconColor: 'text-sky-600',
  },
  {
    icon: BarChart3,
    title: 'Business Insights',
    description: 'Track your performance with detailed analytics on views, inquiries, and bookings.',
    bg: 'bg-violet-50',
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
  },
  {
    icon: MessageSquare,
    title: 'Direct Messaging',
    description: 'Chat directly with clients through our integrated messaging system. No phone tag.',
    bg: 'bg-emerald-50',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
  {
    icon: Camera,
    title: 'Portfolio Showcase',
    description: 'Showcase your best work with unlimited photo and video galleries that convert.',
    bg: 'bg-amber-50',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
  },
  {
    icon: Shield,
    title: 'Verified Badge',
    description: 'Get verified to build trust and stand out from the competition.',
    bg: 'bg-rose-50',
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-600',
  },
  {
    icon: Wallet,
    title: 'Secure Payments',
    description: 'Accept payments securely with integrated payment processing and invoicing.',
    bg: 'bg-indigo-50',
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
  },
]

const features = [
  {
    icon: Target,
    badge: 'Reach',
    title: 'Get discovered by your ideal clients',
    description: 'Your profile appears in relevant searches when couples and planners are actively looking for services like yours. Our smart matching ensures you connect with the right audience.',
    highlights: [
      'Smart search optimization',
      'Category-based discovery',
      'Location targeting',
      'Featured listings',
    ],
    bg: 'bg-sky-50 dark:bg-sky-950/40',
    iconBg: 'bg-sky-100 dark:bg-sky-900/50',
    iconColor: 'text-sky-600 dark:text-sky-400',
    badgeBg: 'bg-sky-100 dark:bg-sky-900/50',
    badgeText: 'text-sky-700 dark:text-sky-300',
  },
  {
    icon: Sparkles,
    badge: 'Profile',
    title: 'Showcase your work like never before',
    description: 'Create a stunning portfolio that highlights your expertise. Upload unlimited photos, videos, and real client reviews that build trust and drive bookings.',
    highlights: [
      'Unlimited media uploads',
      'Video portfolio support',
      'Client review system',
      'Custom service packages',
    ],
    bg: 'bg-violet-50 dark:bg-violet-950/40',
    iconBg: 'bg-violet-100 dark:bg-violet-900/50',
    iconColor: 'text-violet-600 dark:text-violet-400',
    badgeBg: 'bg-violet-100 dark:bg-violet-900/50',
    badgeText: 'text-violet-700 dark:text-violet-300',
  },
  {
    icon: Zap,
    badge: 'Efficiency',
    title: 'Manage everything from one dashboard',
    description: 'Handle inquiries, send quotes, manage bookings, and track payments — all in one place. Spend less time on admin and more time on what you do best.',
    highlights: [
      'Unified inbox',
      'Quick quote builder',
      'Booking calendar',
      'Invoice management',
    ],
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    iconBg: 'bg-amber-100 dark:bg-amber-900/50',
    iconColor: 'text-amber-600 dark:text-amber-400',
    badgeBg: 'bg-amber-100 dark:bg-amber-900/50',
    badgeText: 'text-amber-700 dark:text-amber-300',
  },
]

const howItWorks = [
  {
    step: '01',
    title: 'Create Your Profile',
    description: 'Sign up and build your professional profile with your services, pricing, and portfolio.',
    icon: Award,
  },
  {
    step: '02',
    title: 'Get Discovered',
    description: 'Appear in search results when couples and planners look for vendors in your category.',
    icon: Globe,
  },
  {
    step: '03',
    title: 'Connect & Convert',
    description: 'Receive inquiries, chat with clients, send quotes, and close more bookings.',
    icon: TrendingUp,
  },
]

const testimonials = [
  {
    name: 'Priya Sharma',
    role: 'Wedding Photographer',
    company: 'Candid Captures',
    content: 'Omnicassion transformed my business. I went from 2-3 bookings per month to 15+ qualified leads. The platform is intuitive and the clients are serious.',
    rating: 5,
    image: '/images/placeholder/avatar-1.jpg',
  },
  {
    name: 'Rajesh Kumar',
    role: 'Event Decorator',
    company: 'Royal Decor',
    content: 'Best investment I made for my business. The messaging system alone saves me hours every week. Plus, the verified badge gives clients confidence.',
    rating: 5,
    image: '/images/placeholder/avatar-2.jpg',
  },
  {
    name: 'Anita Desai',
    role: 'Catering Services',
    company: 'Spice & Everything Nice',
    content: 'I love how easy it is to showcase my menus and pricing. Clients can see everything upfront, which means the inquiries I get are already qualified.',
    rating: 5,
    image: '/images/placeholder/avatar-3.jpg',
  },
]

// ─── Hero ────────────────────────────────────────────────────────────────────

function HeroSection() {
  const scrollToFeatures = useCallback(() => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const heroRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  
  const rawY = useTransform(scrollYProgress, [0, 1], [0, 150])
  const rawOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])
  const rawScale = useTransform(scrollYProgress, [0, 1], [1, 0.95])
  const heroTextY = useSpring(rawY, { stiffness: 100, damping: 30 })
  const heroOpacity = useSpring(rawOpacity, { stiffness: 100, damping: 30 })
  const heroScale = useSpring(rawScale, { stiffness: 100, damping: 30 })

  const blob1Y = useTransform(scrollYProgress, [0, 1], [0, -80])
  const blob2Y = useTransform(scrollYProgress, [0, 1], [0, 60])
  const blob3Y = useTransform(scrollYProgress, [0, 1], [0, 100])

  return (
    <section
      ref={heroRef}
      className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-linear-to-br from-slate-50 via-sky-50 to-indigo-50 dark:from-slate-950 dark:via-sky-950/30 dark:to-indigo-950/30"
    >
      {/* Enhanced floating blobs with more depth */}
      <motion.div
        style={{ y: blob1Y }}
        className="absolute -top-40 -left-40 h-150 w-150 rounded-full bg-sky-500/20 blur-[140px]"
      />
      <motion.div
        style={{ y: blob2Y }}
        className="absolute -bottom-40 -right-40 h-125 w-125 rounded-full bg-indigo-500/15 blur-[140px]"
      />
      <motion.div
        style={{ y: blob3Y }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-100 w-100 rounded-full bg-violet-500/10 blur-[120px]"
      />

      <div className="relative z-20 mx-auto w-full max-w-7xl px-6">
        <motion.div
          style={{ y: heroTextY, opacity: heroOpacity, scale: heroScale }}
          className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center"
        >
          {/* Left Content */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease }}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300"
            >
              <Shield className="h-4 w-4" />
              Trusted by 10,000+ Professional Vendors
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 1, delay: 0.2, ease }}
              className="font-serif text-4xl font-bold leading-[1.15] tracking-tight sm:text-5xl lg:text-6xl"
            >
              Turn your passion into
              <span className="block mt-2 bg-linear-to-r from-sky-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                profitable bookings
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease }}
              className="text-base leading-relaxed text-muted-foreground sm:text-lg"
            >
              Join India&apos;s fastest-growing event marketplace. Connect with <strong className="text-foreground">50,000+ active couples</strong> and event planners who are ready to book. Get qualified leads, showcase your portfolio, and grow your business.
            </motion.p>

            {/* Key Benefits Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6, ease }}
              className="grid grid-cols-2 gap-4"
            >
              {[
                { icon: CheckCircle2, text: 'Free to join', color: 'text-emerald-600' },
                { icon: CheckCircle2, text: 'Verified badge', color: 'text-sky-600' },
                { icon: CheckCircle2, text: 'Unlimited portfolio', color: 'text-violet-600' },
                { icon: CheckCircle2, text: 'Direct messaging', color: 'text-indigo-600' },
              ].map((benefit, i) => (
                <motion.div
                  key={benefit.text}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 + i * 0.1, ease }}
                  className="flex items-center gap-2"
                >
                  <benefit.icon className={`h-5 w-5 ${benefit.color}`} />
                  <span className="text-sm font-medium text-foreground">{benefit.text}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.8, ease }}
              className="flex flex-wrap items-center gap-3 relative z-30"
            >
              <Button asChild size="lg" className="h-12 rounded-full px-8 text-sm shadow-xl shadow-primary/25 relative z-30">
                <Link href="/register/vendor">
                  Start Growing Today
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 rounded-full px-8 text-sm border-2 relative z-30">
                <Link href="#features">
                  See How It Works
                </Link>
              </Button>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 1, ease }}
              className="flex flex-wrap items-center gap-6 pt-4 border-t border-border/50"
            >
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-sky-600" />
                <span>Setup in 10 minutes</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-violet-600" />
                <span>Cancel anytime</span>
              </div>
            </motion.div>
          </div>

          {/* Right Content - Stats & Visual */}
          <div className="relative">
            {/* Stats Cards */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.5, ease }}
              className="grid grid-cols-2 gap-4"
            >
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.6 + i * 0.1, ease }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="group relative overflow-hidden rounded-2xl border border-border/50 bg-background/90 backdrop-blur-sm p-4 shadow-lg hover:shadow-xl transition-shadow"
                >
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="relative">
                    <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-4 ring-primary/5 group-hover:scale-110 transition-transform">
                      <stat.icon className="h-5 w-5" />
                    </div>
                    <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
                    <div className="mt-1.5 text-xs font-medium text-muted-foreground">{stat.label}</div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Floating Elements */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 1.2, ease }}
              className="mt-6 rounded-2xl border border-border/50 bg-linear-to-br from-background/95 to-background/80 backdrop-blur-sm p-4 shadow-xl"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                  <Star className="h-5 w-5 fill-amber-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl font-bold">4.9/5</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Average rating from <strong className="text-foreground">2,500+ vendor reviews</strong>
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Scroll arrow */}
      <motion.button
        onClick={scrollToFeatures}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.3, duration: 0.6 }}
        className="absolute bottom-28 left-1/2 z-30 -translate-x-1/2 text-muted-foreground hover:text-foreground transition-colors animate-bounce-slow sm:bottom-32 lg:bottom-36"
        aria-label="Scroll down"
      >
        <ArrowDown className="h-6 w-6" />
      </motion.button>

      {/* Wave cutout */}
      <div className="absolute bottom-0 left-0 z-5 w-full overflow-hidden leading-0 pointer-events-none">
        <svg
          viewBox="0 0 1440 200"
          preserveAspectRatio="none"
          className="relative block h-25 w-full sm:h-32.5 lg:h-40"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,80 C180,160 360,20 540,80 C720,140 900,30 1080,90 C1200,120 1320,60 1440,80 L1440,200 L0,200 Z"
            className="fill-background"
          />
        </svg>
      </div>
    </section>
  )
}

// ─── Benefits Grid ───────────────────────────────────────────────────────────

function BenefitsGrid() {
  return (
    <section id="features" className="bg-background py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <FadeIn className="mb-14 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
            Why Join Omnicassion
          </p>
          <h2 className="font-serif text-3xl font-bold sm:text-4xl lg:text-5xl">
            Everything you need to succeed
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            From lead generation to payment processing, we&apos;ve built tools that help you 
            grow your business and delight your clients.
          </p>
        </FadeIn>

        <StaggerContainer className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit) => (
            <motion.div
              key={benefit.title}
              variants={staggerChild}
              whileHover={{ y: -4, transition: { duration: 0.25 } }}
              className={`group rounded-2xl ${benefit.bg} p-7 transition-shadow duration-300 hover:shadow-lg`}
            >
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${benefit.iconBg} transition-transform group-hover:scale-110`}>
                <benefit.icon className={`h-6 w-6 ${benefit.iconColor}`} />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{benefit.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}

// ─── Feature Deep Dives ──────────────────────────────────────────────────────

function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof features)[number]
  index: number
}) {
  const cardRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress: enterProgress } = useScroll({
    target: cardRef,
    offset: ['start end', 'start 0.3'],
  })
  const rawEnterY = useTransform(enterProgress, [0, 1], [120, 0])
  const rawEnterOpacity = useTransform(enterProgress, [0, 0.4], [0, 1])
  const enterY = useSpring(rawEnterY, { stiffness: 80, damping: 25 })
  const enterOpacity = useSpring(rawEnterOpacity, { stiffness: 80, damping: 25 })

  const { scrollYProgress: exitProgress } = useScroll({
    target: cardRef,
    offset: ['start start', 'end start'],
  })
  const rawScale = useTransform(exitProgress, [0, 1], [1, 0.9])
  const rawExitOpacity = useTransform(exitProgress, [0, 0.5, 1], [1, 1, 0.3])
  const scale = useSpring(rawScale, { stiffness: 100, damping: 30 })
  const exitOpacity = useSpring(rawExitOpacity, { stiffness: 100, damping: 30 })

  const rawVisualY = useTransform(enterProgress, [0, 1], [60, 0])
  const visualY = useSpring(rawVisualY, { stiffness: 60, damping: 20 })

  const Icon = feature.icon
  const isEven = index % 2 === 0

  return (
    <div
      ref={cardRef}
      className="sticky top-0 min-h-screen"
      style={{ zIndex: index + 1 }}
    >
      <motion.div
        style={{ scale, opacity: exitOpacity }}
        className={`${feature.bg} relative min-h-screen flex items-center overflow-hidden`}
      >
        <div className={`absolute ${isEven ? '-right-32 -top-32' : '-left-32 -bottom-32'} h-96 w-96 rounded-full ${feature.iconBg} opacity-40 blur-[100px]`} />

        <motion.div
          style={{ y: enterY, opacity: enterOpacity }}
          className="relative z-10 mx-auto w-full max-w-6xl px-6 py-16 lg:py-20"
        >
          <div
            className={`flex flex-col gap-12 lg:flex-row lg:items-center ${
              !isEven ? 'lg:flex-row-reverse' : ''
            }`}
          >
            <div className="flex-1 space-y-6">
              <span className={`inline-flex items-center gap-2 rounded-full ${feature.badgeBg} ${feature.badgeText} px-4 py-1.5 text-xs font-semibold uppercase tracking-wider`}>
                <Icon className="h-3.5 w-3.5" />
                {feature.badge}
              </span>

              <h3 className="font-serif text-3xl font-bold leading-tight sm:text-4xl lg:text-[2.75rem]">
                {feature.title}
              </h3>

              <p className="max-w-lg text-lg leading-relaxed text-muted-foreground">
                {feature.description}
              </p>

              <ul className="grid grid-cols-2 gap-x-6 gap-y-3">
                {feature.highlights.map((h) => (
                  <li key={h} className="flex items-center gap-2 text-sm text-foreground">
                    <CheckCircle2 className={`h-4 w-4 shrink-0 ${feature.iconColor}`} />
                    {h}
                  </li>
                ))}
              </ul>

              <div className="pt-2">
                <Button asChild size="lg" className="rounded-full px-8">
                  <Link href="/register/vendor">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <motion.div
              style={{ y: visualY }}
              className="flex flex-1 items-center justify-center"
            >
              <div className="relative h-72 w-full max-w-md overflow-hidden rounded-3xl border border-border/50 bg-background shadow-2xl lg:h-96">
                <div className="absolute inset-x-0 top-0 flex items-center gap-2 border-b border-border bg-muted/50 px-5 py-3">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/60" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-400/60" />
                  <div className="ml-4 h-3.5 w-28 rounded-full bg-muted" />
                </div>

                <div className="absolute inset-0 flex items-center justify-center pt-8">
                  <div className={`flex h-24 w-24 items-center justify-center rounded-3xl ${feature.iconBg}`}>
                    <Icon className={`h-12 w-12 ${feature.iconColor}`} />
                  </div>
                </div>

                <div className="absolute bottom-6 left-6 right-6 space-y-2.5">
                  <div className="h-2.5 w-4/5 rounded-full bg-muted" />
                  <div className="h-2.5 w-3/5 rounded-full bg-muted" />
                  <div className="h-2.5 w-2/3 rounded-full bg-muted" />
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

function FeatureDeepDives() {
  return (
    <section className="relative">
      <div className="bg-background py-14 lg:py-20 text-center">
        <FadeIn>
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
            Powerful Features
          </p>
          <h2 className="font-serif text-3xl font-bold sm:text-4xl lg:text-5xl">
            Built for busy professionals
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Stop juggling multiple tools. Manage your entire vendor business from one unified platform.
          </p>
        </FadeIn>
      </div>

      <div className="relative">
        {features.map((feature, i) => (
          <FeatureCard key={feature.badge} feature={feature} index={i} />
        ))}
      </div>
    </section>
  )
}

// ─── How It Works ────────────────────────────────────────────────────────────

function HowItWorksSection() {
  return (
    <section className="bg-background py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <FadeIn className="mb-14 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
            Simple Process
          </p>
          <h2 className="font-serif text-3xl font-bold sm:text-4xl lg:text-5xl">
            How it works
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Get started in minutes and start receiving qualified leads today.
          </p>
        </FadeIn>

        <StaggerContainer className="grid gap-8 lg:grid-cols-3">
          {howItWorks.map((item) => (
            <motion.div
              key={item.step}
              variants={staggerChild}
              className="relative rounded-2xl border border-border bg-card p-8"
            >
              <div className="absolute -top-5 -left-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground shadow-lg">
                {item.step}
              </div>
              <item.icon className="mb-6 mt-4 h-12 w-12 text-primary" />
              <h3 className="mb-3 text-xl font-semibold">{item.title}</h3>
              <p className="text-muted-foreground">{item.description}</p>
            </motion.div>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}

// ─── Testimonials ────────────────────────────────────────────────────────────

function TestimonialsSection() {
  return (
    <section className="bg-muted/30 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <FadeIn className="mb-14 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
            Success Stories
          </p>
          <h2 className="font-serif text-3xl font-bold sm:text-4xl lg:text-5xl">
            What vendors say about us
          </h2>
        </FadeIn>

        <StaggerContainer className="grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <motion.div
              key={testimonial.name}
              variants={staggerChild}
              className="rounded-2xl border border-border bg-card p-7"
            >
              <div className="mb-4 flex gap-1">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                &ldquo;{testimonial.content}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-linear-to-br from-sky-400 to-indigo-400" />
                <div>
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.role}, {testimonial.company}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}

// ─── CTA Section ─────────────────────────────────────────────────────────────

function CTASection() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const bgY = useTransform(scrollYProgress, [0, 1], [60, -60])

  return (
    <section ref={ref} className="relative overflow-hidden bg-linear-to-br from-slate-900 via-indigo-950 to-purple-950 py-20 lg:py-28">
      <motion.div style={{ y: bgY }} className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-sky-500/15 blur-[120px]" />
      <motion.div style={{ y: bgY }} className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-rose-500/12 blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <FadeIn>
          <h2 className="font-serif text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Ready to grow your business?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/70">
            Join thousands of successful vendors who are booking more events and building 
            their reputation on India&apos;s premier event planning platform.
          </p>
          
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg" className="h-13 rounded-full px-8 text-base shadow-lg shadow-primary/30">
              <Link href="/register/vendor">
                Join as a Vendor
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-13 rounded-full border-white/20 bg-white/5 px-8 text-base text-white backdrop-blur-sm hover:bg-white/10 hover:text-white"
            >
              <Link href="/contact">Contact Sales</Link>
            </Button>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-white/60">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              <span className="text-sm">vendors@omnicassion.com</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              <span className="text-sm">1800-123-4567</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <span className="text-sm">Mon-Sat, 9AM-7PM</span>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ForVendorsPage() {
  useSmoothScroll()

  useEffect(() => {
    trackDashboard.sectionView('for-vendors', 'vendor')
  }, [])

  return (
    <>
      <HeroSection />
      <BenefitsGrid />
      <FeatureDeepDives />
      <HowItWorksSection />
      <TestimonialsSection />
      <CTASection />
    </>
  )
}
