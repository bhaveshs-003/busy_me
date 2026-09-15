import type { ChatSession, ChatMessage, WebSearchResult, ChatSuggestedAction } from '@/types/index';

// ─── Demo Query Suggestions ────────────────────────────────────────────────────

export const DEMO_QUERIES: string[] = [
  'Summarize what\'s happening with the Meridian Health partnership',
  'What are my most urgent tasks this week?',
  'Prepare me for my investor call on September 17th',
  'What should I know before the Singapore trip?',
  'What is BrightWave AI doing and how should we respond?',
  'Show me all emails from Amanda Foster',
  'Draft a reply to Marcus Rivera about the launch timeline',
  'What are the open items for the Series B data room?',
  'How is Project Atlas tracking against the October feature freeze?',
  'What\'s the competitive landscape in our space right now?',
  'Find all overdue tasks',
  'Summarize the Vertex Labs due diligence status',
];

// ─── Mock Web Search Results ───────────────────────────────────────────────────

export const mockWebSearchResults: WebSearchResult[] = [
  {
    id: 'sr-001',
    title: 'BrightWave AI Launches Enterprise Tier at $199/Seat — TechCrunch',
    url: 'https://techcrunch.com/2026/09/08/brightwave-ai-enterprise-tier/',
    displayUrl: 'techcrunch.com',
    snippet: 'BrightWave AI, the AI-powered productivity startup, today launched its enterprise tier at $199 per seat per month, significantly undercutting incumbents. The company claims 40% reduction in email processing time for enterprise teams.',
    publishedAt: '2026-09-08T10:00:00Z',
    faviconUrl: 'https://techcrunch.com/favicon.ico',
    imageUrl: null,
    sourceName: 'TechCrunch',
    relevanceScore: 0.97,
  },
  {
    id: 'sr-002',
    title: 'Gartner Magic Quadrant 2026: Enterprise AI Productivity Platforms',
    url: 'https://www.gartner.com/en/documents/enterprise-ai-productivity-2026',
    displayUrl: 'gartner.com',
    snippet: 'TechCorp has moved to the Leaders quadrant, ranking #2 in enterprise AI productivity. BrightWave AI enters the Challengers quadrant. Notion maintains its position in Leaders following its enterprise pivot.',
    publishedAt: '2026-08-15T08:00:00Z',
    faviconUrl: 'https://gartner.com/favicon.ico',
    imageUrl: null,
    sourceName: 'Gartner',
    relevanceScore: 0.95,
  },
  {
    id: 'sr-003',
    title: 'BrightWave AI Secures $22M Series A to Accelerate Enterprise Push — VentureBeat',
    url: 'https://venturebeat.com/2026/07/22/brightwave-ai-series-a/',
    displayUrl: 'venturebeat.com',
    snippet: 'BrightWave AI has raised $22M Series A led by Andreessen Horowitz. The company plans to invest heavily in enterprise sales and expand its AI automation capabilities to compete with established players.',
    publishedAt: '2026-07-22T09:00:00Z',
    faviconUrl: 'https://venturebeat.com/favicon.ico',
    imageUrl: null,
    sourceName: 'VentureBeat',
    relevanceScore: 0.91,
  },
  {
    id: 'sr-004',
    title: 'Notion for Enterprise: How the Productivity Giant Is Targeting Large Organizations',
    url: 'https://www.wsj.com/articles/notion-enterprise-strategy-2026',
    displayUrl: 'wsj.com',
    snippet: 'Notion\'s enterprise pivot is showing results, with Fortune 500 customers up 180% year-over-year. However, analysts note its weak integration with email and calendar workflows remains a differentiation gap versus specialized AI tools.',
    publishedAt: '2026-08-30T11:00:00Z',
    faviconUrl: 'https://wsj.com/favicon.ico',
    imageUrl: null,
    sourceName: 'Wall Street Journal',
    relevanceScore: 0.88,
  },
  {
    id: 'sr-005',
    title: 'Enterprise AI Productivity: The Battle for the Knowledge Worker — McKinsey',
    url: 'https://www.mckinsey.com/business-functions/mckinsey-digital/our-insights/enterprise-ai-productivity-2026',
    displayUrl: 'mckinsey.com',
    snippet: 'AI-powered productivity tools are projected to save knowledge workers 4-6 hours per week by 2027. The key differentiator in enterprise adoption is data governance and compliance, which 73% of CISOs cite as their primary evaluation criterion.',
    publishedAt: '2026-09-01T08:00:00Z',
    faviconUrl: 'https://mckinsey.com/favicon.ico',
    imageUrl: null,
    sourceName: 'McKinsey & Company',
    relevanceScore: 0.85,
  },
  {
    id: 'sr-006',
    title: 'BrightWave AI Wins Major Healthcare Customer — Healthcare IT News',
    url: 'https://www.healthcareitnews.com/news/brightwave-ai-healthcare-win-2026',
    displayUrl: 'healthcareitnews.com',
    snippet: 'BrightWave AI announced a partnership with a major regional hospital network, signaling its push into healthcare AI productivity. The company cited its upcoming HIPAA compliance certification expected in Q1 2027.',
    publishedAt: '2026-09-05T09:00:00Z',
    faviconUrl: null,
    imageUrl: null,
    sourceName: 'Healthcare IT News',
    relevanceScore: 0.82,
  },
];

// ─── Mock Chat Responses Map ───────────────────────────────────────────────────

export const mockChatResponses: Record<string, string> = {
  meridian: `**Meridian Health Partnership Summary**

The Meridian partnership is one of your most active and time-sensitive deals right now.

**Contract Status:** Priya Nair sent redlined Partnership Agreement v3 on September 10th. Three sections are marked up: section 4.2 (data governance — US jurisdiction requirement), section 7.1 (SLA commitments), and Exhibit C (pricing schedule). A legal review call needs to happen before September 19th.

**Integration Timeline (confirmed):**
- October 5: Sandbox environment + API credentials
- October 20: Integration spec finalized
- November 15: Technical integration complete
- November 30: UAT sign-off
- **December 10: Production go-live (HARD DEADLINE)**

⚠️ The December 10 go-live is a hard deadline due to Meridian's IT system freeze December 10–24. Missing this date means January at the earliest.

**Active Blocker:** Rachel Kim's API sandbox credentials are 2 days overdue — engineering team is blocked on integration testing.

**What needs your attention today:**
1. Chase Rachel Kim for API sandbox credentials (engineering is blocked)
2. Schedule legal review call for Thursday or Friday this week
3. Review contract redlines by September 17th`,

  investor: `**Investor Call Prep — September 17th, 2:00 PM PT**

You have a Series B investor call in 7 days with Amanda Foster (Sequoia, $15M lead) and David Chen (Horizon Ventures, $8M co-lead).

**What you need to prepare:**
1. **15-slide investor deck** covering Q3 performance, Atlas roadmap, and Q4 GTM
2. **1-page metrics summary** with ARR, NRR, CAC, and LTV — to share in advance

**Key metrics to highlight:**
- ARR: $8.4M (up 14% month-over-month in August)
- NPS: 61 (up from 58 in July)
- Churn: 0 this quarter
- Gartner ranking: #2 in enterprise AI productivity (up from #4 in Q1)

**Amanda's strategic priorities** (from her recent email):
- Enterprise security depth (consider FedRAMP for government vertical)
- Vertical focus on healthcare and fintech
- Developer API + marketplace roadmap for H2 2027

**BREAKING:** David Chen confirmed the term sheet is arriving this Friday, September 12th. Target signed term sheet: September 22nd.

**Suggested action:** Alert your legal counsel today to prepare for expedited review.`,

  atlas: `**Project Atlas — Status Update**

Project Atlas v1.0 is on track for the November 15th public launch. Here's the current picture:

**Engineering Progress:**
- Backend API: 87% complete (Kevin Zhao's team)
- Frontend dashboard: Complete ✅
- Settings pages: In review
- Mobile responsive layout: 60%
- ML recommendations (model v2): Training complete, A/B framework ready

**Active Blockers:**
1. Staging environment instability (Raj's team investigating, ETA tomorrow)
2. Meridian API sandbox credentials overdue (Rachel Kim)

**Upcoming Milestones:**
- Feature freeze: **October 10th** (no changes after this date)
- Beta UAT kickoff: **October 20th** (50 users, 5 enterprise customers confirmed)
- Public launch: **November 15th**

**Architecture Decisions Finalized (September 10):**
- Notifications: Server-Sent Events (SSE)
- Offline: Read-only cache in v1.0
- Push provider: Firebase Cloud Messaging
- Data retention: 90-day default, configurable for enterprise
- Language: English only in v1.0 (Spanish/French in v1.1)

**What needs your attention:**
- Approve Figma prototype by Thursday EOD (engineering handoff Friday)
- Provide 3 remaining product decisions to James and Kevin by September 15th`,

  tasks: `**Your Open Tasks — Priority View**

You have **17 open tasks** and **1 overdue task**. Here are the most urgent:

🔴 **OVERDUE**
- Follow up with Rachel Kim — Meridian API sandbox credentials (was due Sept 8)

🔴 **Due this week (High Priority)**
1. Approve engineering JDs → due Friday, Sept 12
2. Alert legal about term sheet arriving Friday → due today, Sept 10
3. Review Figma prototype → due Thursday, Sept 11

🟡 **Due next week (High Priority)**
1. Add product KRs to Q4 OKR draft → due Sept 15
2. Provide architecture decisions to James and Kevin → due Sept 15 (Tuesday morning)
3. Review Vertex Labs LOI draft → due Sept 15
4. Board meeting product section → due Sept 19

**Tasks that are at risk:**
- Update Atlas sales deck for Cascade demo (Sept 16) — depends on getting Natalie's screenshots first
- Prepare investor deck for Sept 17 call — needs to be sent before the call`,

  singapore: `**Singapore Trip — October 14–17 Briefing**

Your Singapore business trip is confirmed. Here's everything you need to know:

**Travel Details:**
- Outbound: SFO → SIN, Singapore Airlines SQ32, Oct 14, 11:30 PM (Business)
- Return: SIN → SFO, Singapore Airlines SQ31, Oct 18, 1:15 AM (Business)
- Hotel: Marriott Tang Plaza, 320 Orchard Road

**Meetings:**
1. **Oct 14, 10AM SGT — DBS Bank** (IT leadership team)
   Sophie Laurent facilitating. DBS is the largest bank in Southeast Asia. Lead with data governance story and research packs for investment workflows.

2. **Oct 15, 2PM SGT — Changi Airport Group**
   Digital transformation team. ~1,800 management-level potential users.

3. **Oct 16, 11AM SGT — GIC Private Limited**
   Singapore sovereign wealth fund. Highly security-conscious. Research pack angle for investment research.

4. **Oct 14 (evening) — EDB Dinner**
   Singapore Economic Development Board. Potential market entry grant up to S$200K (~$150K USD).

**Key prep needed:**
- Research each company's recent news
- Prepare APAC-specific pitch materials
- Research EDB grant requirements before the dinner
- Bring printed one-pagers (Singapore business culture appreciates physical materials)`,

  series_b: `**Series B Fundraising — Current Status**

**The big news today:** David Chen (Horizon Ventures) confirmed the term sheet is arriving **this Friday, September 12th.** You need your legal counsel on standby for an expedited review.

**Expected terms:**
- Sequoia Capital: $15M
- Horizon Ventures: $8M
- Strategic investors: $5M reserved
- **Total raise: ~$28M**
- Sequoia gets 1 board seat; Horizon gets observer rights
- Target signed term sheet: September 22nd
- Target close: December 31, 2026

**Data Room:** Amanda Foster opened the Sequoia data room on September 9th. You need to upload 5 document categories by September 25th:
1. FY2024 + FY2025 YTD audited financials
2. Fully diluted cap table
3. Top 10 customer contracts by ARR
4. 18 months of board minutes
5. IP ownership certificates

**Investor Call: September 17th, 2PM PT**
15-slide deck + 1-page metrics summary required.

**Key risk:** BrightWave AI is reportedly closing their own Series B in Q4, which could create competition for the same investor pool.`,

  brightwave: `**BrightWave AI Competitive Update**

BrightWave AI made a significant move on September 8th: they launched their enterprise tier at **$199/seat/month** — 31% below TechCorp's $290/seat pricing.

**What we know:**
- Enterprise tier launched September 8th
- Features overlap directly with Atlas's core value proposition
- Raised $22M Series A (Andreessen Horowitz) in July 2026
- Rumored healthcare customer win (Tom Weston's intel from ProductSummit)
- HIPAA compliance expected Q1 2027 (they're pursuing it, but not there yet)

**Where we're stronger:**
- Native calendar integration (BrightWave has none)
- Research packs (unique in market — no competitor has this)
- SOC 2 Type II already in process (BrightWave doesn't have it yet)
- Established Gartner positioning (#2 vs. not yet in Leaders quadrant)
- Healthcare compliance story is ahead of BrightWave's

**Recommended actions:**
1. Update competitive battle card with new pricing data
2. Brief sales team before Cascade Financial demo (September 18th)
3. Emphasize data governance and compliance story — BrightWave can't match this yet
4. Accelerate Atlas launch to establish market position before BrightWave's Series B`,

  default: `I can help you with that. Here's what I found across your emails, calendar, tasks, and research packs.

Based on your current context, the most relevant information is in your active research packs: **Project Atlas** (November 15th launch), **Meridian Health Partnership** (December 10th deadline), and **Series B Fundraising** (term sheet arriving Friday).

What would you like to dive deeper into? You can ask me to:
- Summarize any email thread or research pack
- Draft a reply or a new message
- Find all tasks related to a specific project
- Prepare you for an upcoming meeting
- Search the web for competitive intelligence`,
};

// ─── Initial Chat Session ──────────────────────────────────────────────────────

const suggestedActionsForWelcome: ChatSuggestedAction[] = [
  {
    id: 'action-001',
    label: 'What\'s urgent today?',
    description: null,
    actionType: 'summarize',
    payload: { query: 'urgent tasks and emails today' },
    isPrimary: true,
  },
  {
    id: 'action-002',
    label: 'Catch me up on Meridian',
    description: null,
    actionType: 'summarize',
    payload: { researchPackId: 'rp-002' },
    isPrimary: false,
  },
  {
    id: 'action-003',
    label: 'Prepare for investor call',
    description: null,
    actionType: 'summarize',
    payload: { query: 'Series B investor call preparation' },
    isPrimary: false,
  },
];

export const mockInitialChatSession: ChatSession = {
  id: 'session-001',
  userId: 'user-001',
  title: 'Morning Briefing — September 10',
  messages: [
    {
      id: 'msg-001',
      sessionId: 'session-001',
      role: 'assistant',
      type: 'text',
      textContent: `Good morning, Sarah. Here's your briefing for **September 10th**.

**Urgent today (3 items):**
1. 🔴 Meridian API sandbox credentials are overdue — Rachel Kim needs to send these, engineering is blocked
2. 🔴 Term sheet arrives Friday — alert your legal counsel today
3. 🟡 Figma prototype review due by Thursday EOD (Natalie is waiting for your approval)

**New emails since yesterday (5 unread):**
- Marcus Rivera has concerns about the Oct 15 deadline → wants a call this week
- Priya Nair sent redlined contract (sections 4.2, 7.1, Exhibit C)
- David Chen: Series B term sheet arriving Friday — Sequoia $15M + Horizon $8M
- Kevin Zhao: Atlas architecture decisions needed (3 open items, due by Sept 15)
- Tom Weston: All 5 beta customers confirmed for Oct 20 UAT

**On your calendar today:**
- 9:00 AM — Daily Atlas Engineering Standup
- 10:00 AM — 1:1 with James Okafor

What would you like to work on?`,
      isStreaming: false,
      createdAt: '2026-09-10T08:00:00Z',
      tokensUsed: 312,
      modelId: 'claude-sonnet-4-6',
      error: null,
      suggestedActions: suggestedActionsForWelcome,
    },
    {
      id: 'msg-002',
      sessionId: 'session-001',
      role: 'user',
      type: 'text',
      textContent: 'Tell me more about the Meridian contract situation. What exactly are the redlines?',
      isStreaming: false,
      createdAt: '2026-09-10T08:02:00Z',
      error: null,
    },
    {
      id: 'msg-003',
      sessionId: 'session-001',
      role: 'assistant',
      type: 'text',
      textContent: `**Meridian Contract Redlines — Summary**

Priya Nair sent Partnership Agreement v3 at 6:15 AM this morning. Here's what their legal team marked up:

**Section 4.2 — Data Governance (Most Significant)**
Meridian requires that all patient data remain within US jurisdictions. This could affect your planned multi-region deployment architecture. You'll need James and Kevin to confirm whether this is feasible without significant engineering rework.

**Section 7.1 — SLA Commitments**
Meridian's legal team marked up the SLA thresholds. The technical requirements you received from Rachel Kim on September 2nd specify **99.9% monthly uptime** — legal needs to confirm this is mirrored in the contract language.

**Exhibit C — Pricing Schedule**
Meridian redlined the entire pricing schedule. This is the commercial negotiation piece — likely around the single-tenant environment pricing (Rachel Kim mentioned they prefer dedicated PHI infrastructure).

**What Priya is asking for:**
A legal review call before **September 19th**. She specifically mentioned Thursday or Friday as options.

**My recommendation:**
1. Read sections 4.2 and 7.1 yourself before the legal call
2. Check with James whether multi-region deployment is mandatory for v1.0 or can be deferred
3. Reply to Priya to confirm Thursday or Friday for the legal call

Would you like me to draft a reply to Priya?`,
      isStreaming: false,
      createdAt: '2026-09-10T08:02:30Z',
      tokensUsed: 428,
      modelId: 'claude-sonnet-4-6',
      error: null,
    },
    {
      id: 'msg-004',
      sessionId: 'session-001',
      role: 'user',
      type: 'text',
      textContent: 'Yes, draft a reply to Priya confirming Thursday for the legal review call',
      isStreaming: false,
      createdAt: '2026-09-10T08:03:30Z',
      error: null,
    },
    {
      id: 'msg-005',
      sessionId: 'session-001',
      role: 'assistant',
      type: 'artifact',
      textContent: 'Here\'s a draft reply to Priya Nair. Review and send when ready:',
      artifact: {
        id: 'artifact-001',
        type: 'email-draft',
        title: 'Reply to Priya Nair — Legal Review Call',
        contentMarkdown: `**To:** Priya Nair <priya.nair@meridianhealth.com>
**CC:** Rachel Kim <rachel.kim@meridianhealth.com>
**Subject:** Re: Meridian Partnership — Contract Redlines for Review

Hi Priya,

Thank you for the redlined contract — I've received it and will have our legal team review sections 4.2, 7.1, and Exhibit C ahead of our call.

**Thursday afternoon works well on our end.** Would **2:00–3:00 PM ET** work for you and Rachel? If you have a different time in mind, please suggest what works best.

A few quick notes ahead of the call:

1. **Section 4.2 (data governance):** I'm having our engineering team assess the multi-region deployment implications this week. We'll come to the call with a clear answer.

2. **Section 7.1 (SLA):** Our technical requirements confirmed 99.9% monthly uptime — I'll ensure this is reflected in the revised contract language.

3. **One pressing item:** Our engineering team is still waiting on the API sandbox credentials from your IT team. Could you follow up with Rachel to unblock this? We're eager to begin integration testing as planned.

Looking forward to Thursday.

Best regards,
Sarah Chen
Senior Product Manager, TechCorp`,
        linkedEntityId: 'email-002',
        linkedEntityType: 'email',
        createdAt: '2026-09-10T08:03:45Z',
        isEditable: true,
      },
      isStreaming: false,
      createdAt: '2026-09-10T08:03:45Z',
      tokensUsed: 387,
      modelId: 'claude-sonnet-4-6',
      error: null,
    },
    {
      id: 'msg-006',
      sessionId: 'session-001',
      role: 'user',
      type: 'text',
      textContent: 'What are competitors doing in our space? Search the web for Project Atlas competitor analysis.',
      isStreaming: false,
      createdAt: '2026-09-10T08:05:00Z',
      error: null,
    },
    {
      id: 'msg-007',
      sessionId: 'session-001',
      role: 'assistant',
      type: 'search-results',
      textContent: `I searched the web for "Project Atlas competitor analysis enterprise AI productivity 2026". Here are the most relevant results:

**Key takeaway:** BrightWave AI is the most aggressive competitive threat right now — they launched enterprise pricing at $199/seat on September 8th (31% below your $290/seat). However, your data governance story, calendar integration, and research packs remain strong differentiators that BrightWave doesn't yet offer.

TechCorp is now ranked **#2 in the Gartner Magic Quadrant** for enterprise AI productivity (Gartner, August 2026), up from #4 in Q1. This should be prominently featured in your September 17th investor call deck.`,
      searchResults: mockWebSearchResults,
      isStreaming: false,
      createdAt: '2026-09-10T08:05:30Z',
      tokensUsed: 524,
      modelId: 'claude-sonnet-4-6',
      error: null,
    },
  ] as ChatMessage[],
  contextResearchPackId: 'rp-001',
  isArchived: false,
  createdAt: '2026-09-10T08:00:00Z',
  updatedAt: '2026-09-10T08:05:30Z',
  lastMessageAt: '2026-09-10T08:05:30Z',
  totalMessages: 7,
};
