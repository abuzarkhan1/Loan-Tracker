import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  ContactRound,
  FileText,
  HandCoins,
  Landmark,
  ListChecks,
  LockKeyhole,
  Moon,
  ReceiptText,
  Scale,
  ShieldCheck,
  Smartphone,
  Sparkles,
  WalletCards,
} from "lucide-react";

export const navLinks = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/features" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "App Preview", href: "/screenshots" },
  { label: "Download", href: "/download" },
  { label: "Contact", href: "/contact" },
];

export const stats = [
  { label: "Track given loans", value: "Given", icon: ArrowDownLeft, tone: "success" },
  { label: "Track borrowed loans", value: "Taken", icon: ArrowUpRight, tone: "danger" },
  { label: "Partial repayments", value: "Auto", icon: ReceiptText, tone: "primary" },
  { label: "Remaining balances", value: "Clear", icon: Scale, tone: "warning" },
  { label: "Charts and summaries", value: "Reports", icon: BarChart3, tone: "success" },
];

export const painPoints = [
  "Forgetting who owes money and how much is still pending.",
  "Confusing partial payments after multiple small repayments.",
  "No clear remaining balance after every transaction.",
  "Manual WhatsApp or chat calculations that are easy to lose.",
  "No proper personal loan history contact-wise.",
];

export const solutions = [
  "Add trusted contacts and keep every ledger organized.",
  "Create loans as GIVEN or TAKEN with issue and due dates.",
  "Record partial payments whenever money comes back or goes out.",
  "Let the app auto-calculate paid and remaining amount.",
  "View dashboard stats, charts, statuses, and reports in seconds.",
];

export const featureHighlights = [
  {
    title: "Loan Given Tracking",
    description: "Track money you gave to others and know exactly what is still receivable.",
    icon: ArrowDownLeft,
    tone: "success",
  },
  {
    title: "Loan Taken Tracking",
    description: "Record borrowed money and stay clear on what you still need to pay back.",
    icon: ArrowUpRight,
    tone: "danger",
  },
  {
    title: "Partial Payment Management",
    description: "Add multiple repayments against the same loan with dates, notes, and methods.",
    icon: ReceiptText,
    tone: "primary",
  },
  {
    title: "Remaining Balance Calculation",
    description: "Paid and remaining amounts update automatically after every payment change.",
    icon: Scale,
    tone: "warning",
  },
  {
    title: "Contact-wise Ledger",
    description: "Open any contact and see their complete loan summary and recent activity.",
    icon: ContactRound,
    tone: "success",
  },
  {
    title: "Dashboard Statistics",
    description: "See total receivable, payable, returned money, active loans, and overdue loans.",
    icon: WalletCards,
    tone: "primary",
  },
  {
    title: "Charts and Reports",
    description: "Understand trends with monthly flow, loan type charts, and loan status charts.",
    icon: BarChart3,
    tone: "warning",
  },
  {
    title: "Smart Loan Statuses",
    description: "Loans stay organized as Active, Partially Paid, Completed, or Overdue.",
    icon: ListChecks,
    tone: "danger",
  },
  {
    title: "Light and Dark Mode",
    description: "A warm premium light theme and a soft dark theme, matching the mobile app.",
    icon: Moon,
    tone: "primary",
  },
  {
    title: "Secure Personal Records",
    description: "Your personal finance records stay account-based and neatly structured.",
    icon: LockKeyhole,
    tone: "success",
  },
];

export const howItWorksSteps = [
  {
    step: "01",
    title: "Add a contact",
    description: "Save the person you gave money to or borrowed money from.",
    icon: ContactRound,
  },
  {
    step: "02",
    title: "Add loan as Given or Taken",
    description: "Enter amount, issue date, due date, and a simple note for context.",
    icon: HandCoins,
  },
  {
    step: "03",
    title: "Record partial payments",
    description: "Add every repayment with method, date, and note. Payment type is automatic.",
    icon: ReceiptText,
  },
  {
    step: "04",
    title: "Track remaining amount and reports",
    description: "Dashboard cards, statuses, and charts keep the full picture visible.",
    icon: BarChart3,
  },
];

export const financeCards = [
  { label: "Mujhe Lene Hain", value: "Rs 84,000", icon: ArrowDownLeft, tone: "success" },
  { label: "Mujhe Dene Hain", value: "Rs 36,500", icon: ArrowUpRight, tone: "danger" },
  { label: "Total Wapis Mila", value: "Rs 51,200", icon: ReceiptText, tone: "primary" },
  { label: "Total Wapis Diya", value: "Rs 19,000", icon: Landmark, tone: "warning" },
  { label: "Baqi Raqam", value: "Rs 47,500", icon: Scale, tone: "success" },
  { label: "Active Loans", value: "12", icon: Clock3, tone: "primary" },
  { label: "Completed Loans", value: "18", icon: CheckCircle2, tone: "success" },
  { label: "Overdue Loans", value: "3", icon: FileText, tone: "danger" },
];

export const trustItems = [
  { title: "Simple records", description: "Every entry stays readable and easy to revisit.", icon: FileText },
  { title: "Clear calculations", description: "Paid and remaining amounts are automatically calculated.", icon: Scale },
  { title: "Personal finance clarity", description: "Know what is receivable and payable without mental math.", icon: Sparkles },
  { title: "Organized loan history", description: "Contact-wise ledgers keep repayment history searchable.", icon: ShieldCheck },
];

export const faqItems = [
  {
    question: "What is Loan Tracker?",
    answer: "Loan Tracker is a personal finance app for recording money you gave, money you borrowed, repayments, balances, contacts, and reports.",
  },
  {
    question: "Can I track money I gave to others?",
    answer: "Yes. Add a loan as GIVEN and the app will treat repayments as money received back.",
  },
  {
    question: "Can I track money I borrowed?",
    answer: "Yes. Add a loan as TAKEN and the app will track how much you have paid back and what remains.",
  },
  {
    question: "Does it support partial payments?",
    answer: "Yes. You can add multiple partial payments against the same loan with date, method, and note.",
  },
  {
    question: "Does it calculate remaining balance automatically?",
    answer: "Yes. Loan Tracker recalculates paid amount, remaining amount, and loan status after every payment update.",
  },
  {
    question: "Is there a dark mode?",
    answer: "Yes. The app and this website support a warm light theme and a premium dark theme.",
  },
  {
    question: "Is it free?",
    answer: "The current Android APK is planned as a simple public download. Pricing can be updated later if needed.",
  },
  {
    question: "How can I download the APK?",
    answer: "Use any Download Android APK button on this website. The link is kept in one config file so it can be updated later.",
  },
];

export const previewScreens = [
  { id: "dashboard", title: "Dashboard screen", description: "Summary cards, charts, and top contacts." },
  { id: "loans", title: "Loan list screen", description: "Given and taken loans with status badges." },
  { id: "detail", title: "Loan detail screen", description: "Progress, balances, and payment history." },
  { id: "payment", title: "Add payment screen", description: "Record partial repayments cleanly." },
  { id: "reports", title: "Reports screen", description: "Loan type and status chart previews." },
] as const;

export const legalUpdated = "May 28, 2026";
