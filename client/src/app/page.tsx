import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BellRing,
  Repeat,
  ShieldCheck,
  Target,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const FEATURES = [
  {
    icon: Wallet,
    title: "Smart expense tracking",
    description:
      "Log expenses in seconds with categories, notes and rich filters. Search, date ranges and amount filters make finding any transaction effortless.",
  },
  {
    icon: Target,
    title: "Monthly budgets",
    description:
      "Set spending limits per category and watch progress bars fill up. Get warned when you approach your threshold before it's too late.",
  },
  {
    icon: Repeat,
    title: "Recurring expenses",
    description:
      "Subscriptions, rent and salaries on autopilot. Define a schedule once and let the app generate expenses automatically.",
  },
  {
    icon: BarChart3,
    title: "Insightful analytics",
    description:
      "See monthly trends, category breakdowns and budget health on a live dashboard. Know exactly where your money goes.",
  },
  {
    icon: BellRing,
    title: "Budget alerts",
    description:
      "Receive clear warnings when a category crosses your alert threshold, so surprises never hit at the end of the month.",
  },
  {
    icon: ShieldCheck,
    title: "Private by design",
    description:
      "Your data is secured with JWT authentication and scoped to your account. Export your expenses to CSV anytime you like.",
  },
];

const STATS = [
  { value: "6", label: "months of trend data" },
  { value: "11+", label: "spending categories" },
  { value: "4", label: "recurring frequencies" },
  { value: "100%", label: "you control your money" },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Wallet className="size-4" />
            </span>
            <span className="text-lg font-semibold tracking-tight">
              Expenze.Ly
            </span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#how-it-works" className="transition-colors hover:text-foreground">
              How it works
            </a>
            <a href="#faq" className="transition-colors hover:text-foreground">
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" className="hidden sm:inline-flex">
                Sign in
              </Button>
            </Link>
            <Link href="/register">
              <Button>
                Get started
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 pt-20 pb-16 sm:px-6 sm:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-primary" />
              </span>
              Free &amp; open source
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-6xl">
              Take control of your{" "}
              <span className="text-primary">money</span>, one expense at a
              time
            </h1>
            <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
              Track spending, set budgets, and never miss a subscription again.
              A clean, fast dashboard that shows you exactly where your money
              goes every month.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto">
                  Create free account
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <a href="#features">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Explore features
                </Button>
              </a>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              No credit card required · Set up in under a minute
            </p>
          </div>

          <div className="relative mx-auto mt-16 max-w-4xl">
            <div className="absolute -inset-4 rounded-3xl bg-primary/10 blur-2xl" />
            <div className="relative overflow-hidden rounded-2xl border bg-card shadow-xl">
              <div className="flex items-center gap-1.5 border-b bg-secondary/40 px-4 py-3">
                <span className="size-3 rounded-full bg-destructive/70" />
                <span className="size-3 rounded-full bg-yellow-500/70" />
                <span className="size-3 rounded-full bg-green-500/70" />
                <span className="ml-3 text-xs text-muted-foreground">
                  app.expenze.ly/dashboard
                </span>
              </div>
              <div className="grid gap-4 p-4 sm:grid-cols-3 sm:p-6">
                {[
                  {
                    label: "Spent this month",
                    value: "$1,245.80",
                    delta: "-12.4% vs last month",
                    up: false,
                  },
                  {
                    label: "Budgets on track",
                    value: "6/8",
                    delta: "2 exceeded",
                    up: false,
                  },
                  {
                    label: "Recurring monthly",
                    value: "$214.90",
                    delta: "9 active subscriptions",
                    up: true,
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border bg-background p-4"
                  >
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="mt-1 text-2xl font-semibold tracking-tight">
                      {stat.value}
                    </p>
                    <p
                      className={`mt-1 text-xs ${
                        stat.up
                          ? "text-green-600 dark:text-green-500"
                          : "text-muted-foreground"
                      }`}
                    >
                      {stat.delta}
                    </p>
                  </div>
                ))}
                <div className="rounded-xl border bg-background p-4 sm:col-span-3">
                  <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Spending trend</span>
                    <span>Last 6 months</span>
                  </div>
                  <div className="flex h-24 items-end gap-2">
                    {[38, 55, 42, 70, 58, 82].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t-md bg-primary/70 transition-all hover:bg-primary"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="stats" className="border-y bg-secondary/40">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold tracking-tight text-primary">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to stay on top of spending
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Built for real life — simple enough for daily use, powerful
              enough to catch problems early.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <Card key={feature.title} className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <feature.icon className="size-5" />
                  </span>
                </CardHeader>
                <CardContent>
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="border-y bg-secondary/40">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Up and running in three steps
              </h2>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Create your account",
                  description:
                    "Sign up with your email and choose a default currency. It takes less than a minute.",
                },
                {
                  step: "02",
                  title: "Add your first expense",
                  description:
                    "Log an expense with a category and date. Optional notes keep the details handy.",
                },
                {
                  step: "03",
                  title: "Set budgets & watch trends",
                  description:
                    "Define monthly limits, add recurring payments, and let the dashboard do the rest.",
                },
              ].map((step) => (
                <div key={step.step} className="relative rounded-2xl border bg-card p-6">
                  <span className="text-4xl font-bold text-primary/20">
                    {step.step}
                  </span>
                  <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Frequently asked questions
            </h2>
          </div>
          <div className="mx-auto mt-10 max-w-3xl space-y-4">
            {[
              {
                q: "Is my data secure?",
                a: "Yes. Passwords are hashed with bcrypt and API access is protected with JWTs scoped to your account. Your data is never shared.",
              },
              {
                q: "Can I export my expenses?",
                a: "Absolutely. You can download all your expenses as a CSV file, filterable by date range and category.",
              },
              {
                q: "Do recurring expenses get added automatically?",
                a: "Daily, weekly, monthly and yearly schedules are supported. When an item becomes due, it is generated into a normal expense.",
              },
              {
                q: "How do budget alerts work?",
                a: "Each budget has an alert threshold (default 80%). When your spending crosses it, the budget is flagged as a warning so you can adjust before exceeding the limit.",
              },
            ].map((item) => (
              <details
                key={item.q}
                className="group rounded-xl border bg-card p-5"
              >
                <summary className="flex cursor-pointer items-center justify-between text-sm font-medium sm:text-base">
                  {item.q}
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        <section id="cta" className="border-t">
          <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to take control of your money?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
              Join now and see your first spending insights in minutes.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto">
                  Get started free
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  I already have an account
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-secondary/40">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Wallet className="size-3.5" />
            </span>
            <span className="text-sm font-semibold">Expenze.Ly</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Expenze.Ly. Built for clarity,
            not complexity.
          </p>
        </div>
      </footer>
    </div>
  );
}