<p align="center">
  <img src="public/logo.png" alt="ResolvOS Logo" width="120" />
</p>

<h1 align="center">ResolvOS</h1>
<p align="center"><strong>Intelligent Resolution Platform — Autonomous Refund Operations for E-commerce</strong></p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.1-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Gemini-2.5_Flash-4285F4?logo=google" alt="Gemini" />
  <img src="https://img.shields.io/badge/Supabase-Realtime-3FCF8E?logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/License-Private-red" alt="License" />
</p>

---

## The Problem

Online retailers lose thousands of hours monthly processing refund requests manually. Support agents are overwhelmed with repetitive tickets, fraud slips through the cracks, and customers wait days for simple resolutions. Scaling support teams is expensive, and inconsistent decision-making creates liability.

## The Solution

**ResolvOS** is an AI-powered customer operations platform that autonomously validates, decides, and resolves refund requests in real time — while keeping humans in the loop for high-value and complex cases.

- 🤖 **AI validates** each refund claim against live order data and dynamically inferred return policies
- ⚡ **Auto-resolves** low-risk refunds in under 2 seconds — no human intervention needed
- 🚨 **Detects fraud** by analyzing refund frequency, rejection patterns, and behavioral anomalies
- 🛡️ **Escalates intelligently** — high-value or suspicious cases route to agents with full AI summaries
- 📊 **Full audit trail** — every decision is logged with rationale, timestamps, and agent actions

> **Result:** ~60% reduction in support workload. Faster resolutions. Zero unlogged decisions.

---

## Features

| Feature | Description |
|---|---|
| **Customer Chat** | Natural language support chat — no forms, no ticket numbers |
| **Autonomous Refund Engine** | AI validates orders, checks eligibility, and processes refunds automatically |
| **Agent Dashboard** | Real-time operations queue with ticket review, one-click approve/reject |
| **Fraud Monitor** | Per-user refund behavior analysis with fraud scoring and flagging |
| **Policy Configuration** | Adjustable auto-approve thresholds, return windows, and validation rules |
| **Kill Switch** | Instantly pause all automation and queue tickets for human review |
| **Refund Slips** | Downloadable/printable refund receipts for approved tickets |
| **Real-time Sync** | Supabase Realtime — new tickets appear instantly on the dashboard |

---

## AI Escalation Principles

ResolvOS uses a tiered decision engine to triage every refund request. The AI agent never blindly approves — it validates, reasons, and routes each case:

```
Customer submits refund request
        │
        ▼
   AI checks order data
   (ownership, return window, item returnability)
        │
        ├── Item is non-returnable?
        │       └── ❌ Auto-reject — politely declined
        │
        ├── AI detects policy violation?
        │   (vague reason, user-inflicted damage, fraud pattern)
        │       └── ❌ Rejected by AI — logged with full rationale
        │
        ├── Order value ≤ $50 + valid reason?
        │       └── ✅ Auto-approved — refund processed instantly
        │          Customer receives a downloadable refund slip
        │
        └── Order value > $50?
                └── ⚠️ Escalated to human agent
                   Ticket created with AI summary for one-click review
```

| Scenario | AI Action | Handled By |
|---|---|---|
| Low-value item (≤ $50), valid reason, returnable | **Auto-approved** — refund processed instantly | AI Agent |
| Policy violation (damage, fraud, vague claim) | **Auto-rejected** — logged with rationale | AI Agent |
| Non-returnable item | **Blocked** — politely declined regardless of price | AI Agent |
| High-value item (> $50), valid reason | **Escalated** — queued for human review with full context | Human Staff |
| Suspicious refund frequency (3+ in 30 days) | **Flagged** — appears on Fraud Monitor dashboard | Human Staff |

> **Key principle:** The AI never skips validation. It always asks for the specific reason and item condition before making a decision, tailoring its questions to the product category (e.g., checking for seal integrity on perfumes, screen damage on electronics).

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org) (App Router) |
| **AI** | [Google Gemini 2.5 Flash](https://ai.google.dev/) via [Vercel AI SDK](https://sdk.vercel.ai/) |
| **Database & Auth** | [Supabase](https://supabase.com) (PostgreSQL, Auth, Row Level Security, Realtime) |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com) |
| **Language** | TypeScript |

---

## Project Structure

```
resolvos/
├── app/
│   ├── page.tsx               # Landing page
│   ├── layout.tsx             # Root layout with fonts & metadata
│   ├── globals.css            # Global styles
│   ├── chat/
│   │   └── page.tsx           # Customer support chat interface
│   ├── dashboard/
│   │   └── page.tsx           # Human agent operations dashboard
│   ├── agent/
│   │   └── login/
│   │       └── page.tsx       # Agent authentication page
│   └── api/
│       ├── chat/
│       │   └── route.ts       # AI chat endpoint (Gemini + tools)
│       └── tickets/
│           └── decision/
│               └── route.ts   # Ticket approve/reject endpoint
├── lib/
│   ├── supabase.ts            # Supabase client initialization
│   └── authz.ts               # Role-based authorization helpers
├── supabase/
│   ├── agent_rls_policies.sql # Row Level Security policies
│   ├── demo_agent_seed.sql    # Seed data for agent accounts
│   └── demo_customer_seed.sql # Seed data for demo customer orders
├── public/                    # Static assets (logo, hero images)
├── package.json
└── tsconfig.json
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+ and **npm** (or yarn/pnpm)
- A **Supabase** project ([create one free](https://supabase.com/dashboard))
- A **Google AI** API key ([get one here](https://aistudio.google.com/apikey))

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/resolvos.git
cd resolvos
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
# Google Gemini AI (powers the chat agent)
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_api_key

# Supabase (database, auth, realtime)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

| Variable | Description | Where to Find |
|---|---|---|
| `GOOGLE_GENERATIVE_AI_API_KEY` | API key for Gemini 2.5 Flash | [Google AI Studio](https://aistudio.google.com/apikey) |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anonymous key for client-side access | Supabase Dashboard → Settings → API |

### 4. Set Up the Database

In your Supabase SQL Editor, run the following scripts in order:

1. **Create tables** — Set up `users`, `orders`, and `tickets` tables
2. **RLS policies** — Run `supabase/agent_rls_policies.sql` for Row Level Security
3. **Seed demo data** — Run `supabase/demo_customer_seed.sql` for customer orders

#### Required Tables

```sql
-- Users table
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT NOT NULL
);

-- Orders table
CREATE TABLE public.orders (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  item_name TEXT,
  price NUMERIC NOT NULL,
  status TEXT DEFAULT 'delivered',
  is_returnable BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tickets table
CREATE TABLE public.tickets (
  id TEXT PRIMARY KEY,
  order_id TEXT REFERENCES public.orders(id),
  user_id UUID REFERENCES auth.users(id),
  status TEXT NOT NULL,
  ai_summary TEXT,
  assigned_to TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 5. Set Up Agent Authentication

1. In Supabase Dashboard → **Authentication** → **Users**, create a user with email/password
2. Update `supabase/demo_agent_seed.sql` with the agent's email
3. Run the seed script in the SQL Editor to grant the `customer_service_agent` role

### 6. Enable Realtime

In Supabase Dashboard → **Database** → **Replication**, enable Realtime for the `tickets` table so new tickets appear instantly on the agent dashboard.

### 7. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Usage

### Customer Flow

1. Go to the **Live Demo** from the landing page (or navigate to `/chat`)
2. Describe your issue naturally — e.g., *"I want to return my clear phone case"*
3. The AI fetches your orders, asks clarifying questions, and makes a decision
4. Low-value refunds are approved instantly with a downloadable receipt
5. High-value items are escalated to the agent dashboard

### Agent Flow

1. Navigate to `/agent/login` and sign in with agent credentials
2. The **Operations Dashboard** shows today's tickets in real time
3. Click any ticket to view the full AI decision log
4. One-click **Approve** or **Reject** escalated tickets
5. Monitor the **Fraud Monitor** tab for suspicious patterns
6. Adjust rules in the **Policy Config** tab

---

## Deployment

### Deploy to Vercel

```bash
npm run build
```

Then deploy via [Vercel](https://vercel.com):

1. Connect your GitHub repository
2. Add all three environment variables in Vercel's project settings
3. Deploy — Vercel auto-detects Next.js and handles the rest

---

## License

This project is private and proprietary. All rights reserved.

---

<p align="center">
  <strong>ResolvOS</strong> — Autonomous Customer Operations · Zero-Trust Architecture · Every Decision Logged
</p>
