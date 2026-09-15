import type { Email } from '@/types/index';

export const mockEmails: Email[] = [
  // ─── UNREAD / HIGH PRIORITY ────────────────────────────────────────────────
  {
    id: 'email-001',
    connectorId: 'gmail',
    threadId: 'thread-001',
    messageId: '<msg-001@acmecorp.com>',
    subject: 'Re: Project Atlas — Q4 Launch Timeline Review',
    snippet: 'Sarah, after reviewing the updated roadmap you sent over, I have a few concerns about the October 15th hard deadline...',
    bodyHtml: null,
    bodyText: `Sarah,

After reviewing the updated roadmap you sent over, I have a few concerns about the October 15th hard deadline. Our procurement team needs at least 3 weeks for vendor onboarding, which puts pressure on the November 1st go-live.

Can we get on a call this week to walk through the critical path? I'd like James and Rachel on as well so we can align on the integration milestones before we finalize the contract timeline.

Looking forward to discussing,
Marcus`,
    from: { name: 'Marcus Rivera', email: 'marcus.rivera@acmecorp.com' },
    to: [{ name: 'Sarah Chen', email: 'sarah.chen@techcorp.com' }],
    cc: [],
    bcc: [],
    replyTo: null,
    date: '2026-09-10T07:42:00Z',
    receivedAt: '2026-09-10T07:42:18Z',
    status: 'unread',
    category: 'primary',
    labels: ['project-atlas', 'important'],
    attachments: [],
    isStarred: true,
    isImportant: true,
    aiSummary: 'Marcus has concerns about the October 15th deadline and wants a call this week with James and Rachel to align on integration milestones.',
    aiActionItems: ['Schedule call with Marcus, James, and Rachel this week', 'Review critical path dependencies', 'Confirm contract timeline with legal'],
    hasCalendarInvite: false,
    spamScore: 0,
  },
  {
    id: 'email-002',
    connectorId: 'gmail',
    threadId: 'thread-002',
    messageId: '<msg-002@meridianhealth.com>',
    subject: 'Meridian Partnership — Contract Redlines for Review',
    snippet: 'Hi Sarah, attached please find the redlined version of the partnership agreement. Legal has marked up sections 4.2, 7.1, and the entire Exhibit C...',
    bodyHtml: null,
    bodyText: `Hi Sarah,

Attached please find the redlined version of the partnership agreement. Our legal team has marked up sections 4.2 (data governance), 7.1 (SLA commitments), and the entire Exhibit C (pricing schedule).

The most significant change is to section 4.2 — Meridian requires that all patient data remain within US jurisdictions, which may affect your planned multi-region deployment. Rachel Kim can provide additional technical context if needed.

We'd like to schedule a legal review call before September 19th to resolve the open items. Does Thursday or Friday afternoon work on your end?

Best,
Priya Nair
VP of Strategic Partnerships, Meridian Health`,
    from: { name: 'Priya Nair', email: 'priya.nair@meridianhealth.com' },
    to: [{ name: 'Sarah Chen', email: 'sarah.chen@techcorp.com' }],
    cc: [{ name: 'Rachel Kim', email: 'rachel.kim@meridianhealth.com' }],
    bcc: [],
    replyTo: null,
    date: '2026-09-10T06:15:00Z',
    receivedAt: '2026-09-10T06:15:44Z',
    status: 'unread',
    category: 'primary',
    labels: ['meridian', 'legal', 'important'],
    attachments: [
      {
        id: 'att-001',
        filename: 'Partnership_Agreement_Redlined_v3.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        sizeBytes: 287340,
        isInline: false,
      },
    ],
    isStarred: true,
    isImportant: true,
    aiSummary: 'Priya sent redlined contract. Key changes in sections 4.2 (data governance — US jurisdiction requirement) and 7.1 (SLA). Legal call needed before Sept 19.',
    aiActionItems: ['Review contract redlines by Sept 17', 'Check multi-region deployment implications for section 4.2', 'Schedule legal review call for Thursday or Friday'],
    hasCalendarInvite: false,
    spamScore: 0,
  },
  {
    id: 'email-003',
    connectorId: 'gmail',
    threadId: 'thread-003',
    messageId: '<msg-003@sequoiacap.com>',
    subject: 'Series B — Due Diligence Data Room Access',
    snippet: 'Sarah, the data room is now live. Please share the link with your CFO and legal team only...',
    bodyHtml: null,
    bodyText: `Sarah,

The Series B data room is now live at the secure link below. Please share access only with your CFO and legal counsel — we'd like to keep the circle tight at this stage.

We'll need the following items uploaded by September 25th:
1. Audited financials for FY2024 and FY2025 YTD
2. Cap table (fully diluted, including option pool)
3. Customer contracts for your top 10 accounts by ARR
4. Board minutes from the past 18 months
5. IP ownership certificates

Our technical team will also schedule a separate call to complete their product review. David Chen from Horizon will coordinate that separately.

We're very excited about where TechCorp is headed and look forward to a smooth process.

Best,
Amanda Foster
Managing Partner, Sequoia Capital`,
    from: { name: 'Amanda Foster', email: 'amanda.foster@sequoiacap.com' },
    to: [{ name: 'Sarah Chen', email: 'sarah.chen@techcorp.com' }],
    cc: [{ name: 'David Chen', email: 'd.chen@horizonventures.vc' }],
    bcc: [],
    replyTo: null,
    date: '2026-09-09T18:30:00Z',
    receivedAt: '2026-09-09T18:30:52Z',
    status: 'unread',
    category: 'primary',
    labels: ['series-b', 'important', 'investor'],
    attachments: [
      {
        id: 'att-002',
        filename: 'DataRoom_AccessInstructions.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 142000,
        isInline: false,
      },
    ],
    isStarred: true,
    isImportant: true,
    aiSummary: 'Sequoia\'s Series B data room is live. 5 document categories due by September 25th. Technical product review to be scheduled by David Chen.',
    aiActionItems: ['Upload audited financials by Sept 25', 'Prepare cap table', 'Gather top 10 customer contracts', 'Coordinate with CFO and legal on data room access'],
    hasCalendarInvite: false,
    spamScore: 0,
  },
  {
    id: 'email-004',
    connectorId: 'gmail',
    threadId: 'thread-004',
    messageId: '<msg-004@techcorp.com>',
    subject: 'Q4 Planning — OKR Draft for Review',
    snippet: 'Hi Sarah, I\'ve put together the first draft of Q4 OKRs for Product and Engineering...',
    bodyHtml: null,
    bodyText: `Hi Sarah,

I've put together the first draft of Q4 OKRs for Product and Engineering. Key objectives are:

O1: Ship Project Atlas v1.0 on time and on budget
  KR1: Feature complete by October 15th
  KR2: Beta customer onboarding complete by October 31st
  KR3: Zero P0 bugs at launch

O2: Grow ARR through the Meridian partnership
  KR1: Signed contract by September 30th
  KR2: Integration live by November 30th
  KR3: 3 additional health system pilots committed by Q4 end

O3: Scale engineering team for 2027
  KR1: 3 senior engineers hired by November 30th
  KR2: Onboarding playbook documented by October 15th

Can you review and add any product-specific KRs? I'd like to present to the exec team by September 15th.

James`,
    from: { name: 'James Okafor', email: 'james.okafor@techcorp.com' },
    to: [{ name: 'Sarah Chen', email: 'sarah.chen@techcorp.com' }],
    cc: [],
    bcc: [],
    replyTo: null,
    date: '2026-09-09T15:20:00Z',
    receivedAt: '2026-09-09T15:20:31Z',
    status: 'unread',
    category: 'primary',
    labels: ['q4-planning', 'okr'],
    attachments: [
      {
        id: 'att-003',
        filename: 'Q4_OKRs_Draft_v1.xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        sizeBytes: 54200,
        isInline: false,
      },
    ],
    isStarred: false,
    isImportant: true,
    aiSummary: 'James drafted Q4 OKRs covering Project Atlas launch, Meridian partnership ARR growth, and engineering hiring. Needs Sarah\'s product KRs by Sept 15.',
    aiActionItems: ['Review Q4 OKR draft', 'Add product-specific KRs', 'Confirm availability for exec presentation on Sept 15'],
    hasCalendarInvite: false,
    spamScore: 0,
  },
  {
    id: 'email-005',
    connectorId: 'gmail',
    threadId: 'thread-005',
    messageId: '<msg-005@techcorp.com>',
    subject: 'Project Atlas — Design Review Feedback Needed',
    snippet: 'Sarah, the Figma prototype for the Atlas dashboard is ready for your review...',
    bodyHtml: null,
    bodyText: `Sarah,

The Figma prototype for the Atlas dashboard is ready for your review. I've addressed all the feedback from our last session and made the following updates:

- Redesigned the data visualization widgets to support drill-down interactions
- Simplified the onboarding flow from 7 steps to 4 steps
- Added the bulk action toolbar you requested
- Resolved the accessibility issues flagged in the WCAG audit

I'd love to get your sign-off before we handoff to Kevin's team on Friday. Could you take a look by Thursday EOD? I've linked the prototype in the Figma file shared below.

One open question: should the empty-state screens use illustrated characters or abstract geometric art? I have two versions ready — happy to walk through them together.

Natalie`,
    from: { name: 'Natalie Brooks', email: 'n.brooks@techcorp.com' },
    to: [{ name: 'Sarah Chen', email: 'sarah.chen@techcorp.com' }],
    cc: [{ name: 'Kevin Zhao', email: 'k.zhao@techcorp.com' }],
    bcc: [],
    replyTo: null,
    date: '2026-09-09T14:05:00Z',
    receivedAt: '2026-09-09T14:05:19Z',
    status: 'unread',
    category: 'primary',
    labels: ['project-atlas', 'design'],
    attachments: [],
    isStarred: false,
    isImportant: false,
    aiSummary: 'Natalie\'s design updates are complete. Needs sign-off by Thursday EOD before Friday engineering handoff. Open question on empty-state art style.',
    aiActionItems: ['Review Figma prototype by Thursday EOD', 'Decide on empty-state art direction', 'Approve for Friday engineering handoff'],
    hasCalendarInvite: false,
    spamScore: 0,
  },
  {
    id: 'email-006',
    connectorId: 'gmail',
    threadId: 'thread-006',
    messageId: '<msg-006@vertexlabs.io>',
    subject: 'Vertex Labs — Technical Architecture Q&A Responses',
    snippet: 'Sarah, please find attached our detailed responses to the 23-question technical questionnaire...',
    bodyHtml: null,
    bodyText: `Sarah,

Please find attached our detailed responses to the 23-question technical architecture questionnaire submitted during due diligence. I've also included system architecture diagrams for our core platform, the data pipeline, and the security model.

A few items I want to highlight:
- Our infrastructure runs entirely on AWS us-east-1 and us-west-2 — fully compatible with your regional requirements
- We have SOC 2 Type II certification (report attached) — valid through March 2027
- The ML models are trained on proprietary data only; no third-party datasets with restrictive licenses

The only open item is question #14 regarding our disaster recovery RTO — we're targeting 4 hours but have not yet formally tested that. We expect to complete a DR drill before year-end.

Please let me know if you'd like to schedule a follow-up technical call.

Daniel Park
CTO, Vertex Labs`,
    from: { name: 'Daniel Park', email: 'd.park@vertexlabs.io' },
    to: [{ name: 'Sarah Chen', email: 'sarah.chen@techcorp.com' }],
    cc: [{ name: 'James Okafor', email: 'james.okafor@techcorp.com' }],
    bcc: [],
    replyTo: null,
    date: '2026-09-09T11:30:00Z',
    receivedAt: '2026-09-09T11:30:07Z',
    status: 'read',
    category: 'primary',
    labels: ['vertex', 'acquisition', 'due-diligence'],
    attachments: [
      {
        id: 'att-004',
        filename: 'Vertex_TechQA_Responses_v1.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1243000,
        isInline: false,
      },
      {
        id: 'att-005',
        filename: 'Vertex_SOC2_TypeII_Report.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 892000,
        isInline: false,
      },
    ],
    isStarred: true,
    isImportant: true,
    aiSummary: 'Vertex responded to all 23 due diligence questions. AWS infrastructure is compatible. SOC 2 Type II valid until March 2027. One open item: DR RTO at 4 hours, not yet formally tested.',
    aiActionItems: ['Review Vertex tech Q&A responses', 'Note DR RTO open item for follow-up', 'Share SOC 2 report with security team'],
    hasCalendarInvite: false,
    spamScore: 0,
  },
  {
    id: 'email-007',
    connectorId: 'gmail',
    threadId: 'thread-007',
    messageId: '<msg-007@techcorp.com>',
    subject: 'Re: Sales Demo — Need Updated Atlas Slides',
    snippet: 'Sarah, we have a major prospect demo with Cascade Financial scheduled for September 18th...',
    bodyHtml: null,
    bodyText: `Sarah,

We have a major prospect demo with Cascade Financial scheduled for September 18th — this is a $480K ARR opportunity, our largest Q4 prospect.

I need updated Atlas slides that include:
1. The new dashboard screenshots (Natalie's latest designs)
2. The integration capability slide — Cascade uses Salesforce, Workday, and SAP
3. Our healthcare customer case study (Meridian reference if it's approved)
4. Updated pricing page for enterprise tier

The current deck has outdated UI mockups from June and the prospect will notice. Can we get this done by September 16th at the latest?

I'm happy to jump on a 30-min call to align on messaging if that helps.

Tom Weston
Head of Sales`,
    from: { name: 'Tom Weston', email: 't.weston@techcorp.com' },
    to: [{ name: 'Sarah Chen', email: 'sarah.chen@techcorp.com' }],
    cc: [{ name: 'Olivia Hartman', email: 'olivia.hartman@techcorp.com' }],
    bcc: [],
    replyTo: null,
    date: '2026-09-09T09:45:00Z',
    receivedAt: '2026-09-09T09:45:55Z',
    status: 'read',
    category: 'primary',
    labels: ['sales', 'project-atlas'],
    attachments: [],
    isStarred: false,
    isImportant: true,
    aiSummary: 'Tom needs updated Atlas sales deck by Sept 16 for a $480K Cascade Financial demo on Sept 18. Requires new UI screenshots, integration slide, and updated enterprise pricing.',
    aiActionItems: ['Update Atlas sales deck by Sept 16', 'Coordinate with Natalie for new screenshots', 'Confirm Meridian as approved case study reference', 'Review enterprise pricing page'],
    hasCalendarInvite: false,
    spamScore: 0,
  },
  {
    id: 'email-008',
    connectorId: 'gmail',
    threadId: 'thread-008',
    messageId: '<msg-008@horizonventures.vc>',
    subject: 'Series B — Investor Call Confirmed for Sept 17',
    snippet: 'Hi Sarah, just confirming our Series B investor call for Wednesday September 17th at 2pm PT...',
    bodyHtml: null,
    bodyText: `Hi Sarah,

Just confirming our Series B investor call for Wednesday, September 17th at 2:00 PM PT / 5:00 PM ET. Amanda Foster will join from Sequoia, and I'll be presenting from Horizon Ventures.

Agenda:
1. Q3 financial performance review (15 min)
2. Product roadmap update — Project Atlas (20 min)
3. Q4 go-to-market strategy (15 min)
4. Q&A (10 min)

Please prepare a 15-slide deck. I'll send a calendar invite with the Zoom link separately.

One request: can you also prepare a one-page summary of TechCorp's key metrics (ARR, NRR, CAC, LTV) to share in advance? This will help Amanda's team prepare good questions.

Looking forward to it.

David Chen
Principal, Horizon Ventures`,
    from: { name: 'David Chen', email: 'd.chen@horizonventures.vc' },
    to: [{ name: 'Sarah Chen', email: 'sarah.chen@techcorp.com' }],
    cc: [{ name: 'Amanda Foster', email: 'amanda.foster@sequoiacap.com' }],
    bcc: [],
    replyTo: null,
    date: '2026-09-08T20:15:00Z',
    receivedAt: '2026-09-08T20:15:33Z',
    status: 'read',
    category: 'primary',
    labels: ['series-b', 'investor', 'important'],
    attachments: [],
    isStarred: true,
    isImportant: true,
    aiSummary: 'Investor call confirmed for Sept 17, 2pm PT. Need 15-slide deck and a one-page metrics summary (ARR, NRR, CAC, LTV) to share in advance.',
    aiActionItems: ['Prepare 15-slide investor deck', 'Create one-page metrics summary', 'Send in advance of Sept 17 call'],
    hasCalendarInvite: true,
    spamScore: 0,
  },
  {
    id: 'email-009',
    connectorId: 'gmail',
    threadId: 'thread-009',
    messageId: '<msg-009@techcorp.com>',
    subject: 'Engineering Weekly Standup — Notes Sept 9',
    snippet: 'Team, here are the notes from today\'s engineering standup. Atlas backend: API endpoints 87% complete...',
    bodyHtml: null,
    bodyText: `Team,

Here are the notes from today's engineering standup (Sept 9):

**Project Atlas Progress:**
- Backend API: 87% complete (Kevin's team). Remaining: bulk export endpoint, webhook integration
- Frontend: Dashboard component complete, settings pages in review, mobile responsive layout 60% done
- ML/Recommendations: Model v2 training complete, A/B test framework ready for beta
- QA: 142 test cases written, 98 passing. Blocker: staging environment intermittently unreachable

**Blockers:**
- Staging env instability — Raj's team investigating (ETA: tomorrow)
- Waiting on Meridian API sandbox credentials — Rachel Kim to follow up

**Next milestone:** Feature freeze October 10th

Full notes in Confluence. Let me know if you have questions.

Kevin Zhao`,
    from: { name: 'Kevin Zhao', email: 'k.zhao@techcorp.com' },
    to: [{ name: 'Sarah Chen', email: 'sarah.chen@techcorp.com' }, { name: 'James Okafor', email: 'james.okafor@techcorp.com' }],
    cc: [{ name: 'Raj Patel', email: 'raj.patel@techcorp.com' }, { name: 'Natalie Brooks', email: 'n.brooks@techcorp.com' }],
    bcc: [],
    replyTo: null,
    date: '2026-09-09T17:00:00Z',
    receivedAt: '2026-09-09T17:00:20Z',
    status: 'read',
    category: 'primary',
    labels: ['project-atlas', 'engineering'],
    attachments: [],
    isStarred: false,
    isImportant: false,
    aiSummary: 'Atlas backend 87% complete. Two blockers: staging env instability and missing Meridian API sandbox credentials. Feature freeze is Oct 10.',
    aiActionItems: ['Follow up on staging env ETA', 'Chase Rachel Kim for Meridian API sandbox credentials'],
    hasCalendarInvite: false,
    spamScore: 0,
  },
  {
    id: 'email-010',
    connectorId: 'gmail',
    threadId: 'thread-010',
    messageId: '<msg-010@techcorp.com>',
    subject: 'APAC Expansion — Market Entry Proposal',
    snippet: 'Hi Sarah, I\'ve finalized the market entry proposal for Southeast Asia. The three priority markets are Singapore, Australia, and Japan...',
    bodyHtml: null,
    bodyText: `Hi Sarah,

I've finalized the market entry proposal for Southeast Asia. Based on our research and conversations with Sophie Laurent at APAC Growth Partners, the three priority markets for FY2027 are:

1. Singapore — Regulatory-friendly, strong enterprise adoption, ideal beachhead
2. Australia — Large addressable market, no language barrier, familiar legal frameworks
3. Japan — High-growth potential but requires localization investment (12-18 months)

We recommend starting with Singapore, targeting 5 enterprise logos in Q1 2027 via Sophie's network. Total investment required: $1.2M over 12 months (including a Singapore entity and one regional sales hire).

Attached is the full proposal including competitive landscape, pricing strategy, and hiring plan. Would love a 45-minute call to walk through it with you and Olivia.

Best,
Sophie Laurent`,
    from: { name: 'Sophie Laurent', email: 's.laurent@apacgrowth.com' },
    to: [{ name: 'Sarah Chen', email: 'sarah.chen@techcorp.com' }],
    cc: [],
    bcc: [],
    replyTo: null,
    date: '2026-09-08T04:30:00Z',
    receivedAt: '2026-09-08T04:30:11Z',
    status: 'read',
    category: 'primary',
    labels: ['apac', 'expansion'],
    attachments: [
      {
        id: 'att-006',
        filename: 'APAC_MarketEntry_Proposal_v2.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1876000,
        isInline: false,
      },
    ],
    isStarred: false,
    isImportant: false,
    aiSummary: 'Sophie recommends Singapore as APAC beachhead, then Australia and Japan. $1.2M investment for 12 months. Wants a call with Sarah and Olivia to review.',
    aiActionItems: ['Read APAC market entry proposal', 'Schedule 45-min call with Sophie and Olivia', 'Share proposal with exec team for budget approval'],
    hasCalendarInvite: false,
    spamScore: 0,
  },
  {
    id: 'email-011',
    connectorId: 'gmail',
    threadId: 'thread-011',
    messageId: '<msg-011@techcorp.com>',
    subject: 'Competitive Intel — BrightWave AI Launches Enterprise Tier',
    snippet: 'Sarah, just a heads up — BrightWave AI announced their enterprise tier this morning with pricing that significantly undercuts ours...',
    bodyHtml: null,
    bodyText: `Sarah,

Just a heads up — BrightWave AI announced their enterprise tier this morning at $199/seat/month (we're at $290). Their press release highlights AI-powered automation features that overlap directly with Atlas's core value prop.

I spoke briefly with Elena at the ProductSummit last week and she hinted at a major customer win in the healthcare space — worth monitoring.

Key differences from our product (from what I can see):
- No native calendar integration (we have an advantage here)
- No research summarization feature (we're differentiated)
- Weaker data governance story — no SOC 2 yet

Recommend we update our competitive battle card and brief the sales team before the Cascade Financial demo.

Tom`,
    from: { name: 'Tom Weston', email: 't.weston@techcorp.com' },
    to: [{ name: 'Sarah Chen', email: 'sarah.chen@techcorp.com' }],
    cc: [{ name: 'Olivia Hartman', email: 'olivia.hartman@techcorp.com' }],
    bcc: [],
    replyTo: null,
    date: '2026-09-08T11:00:00Z',
    receivedAt: '2026-09-08T11:00:44Z',
    status: 'read',
    category: 'primary',
    labels: ['competitive-intel'],
    attachments: [],
    isStarred: false,
    isImportant: true,
    aiSummary: 'BrightWave AI launched enterprise tier at $199/seat vs our $290. Overlapping features with Atlas. Recommend updating battle card before Cascade Financial demo.',
    aiActionItems: ['Update competitive battle card for BrightWave AI', 'Brief sales team on competitive differentiation', 'Monitor BrightWave healthcare customer wins'],
    hasCalendarInvite: false,
    spamScore: 0,
  },
  {
    id: 'email-012',
    connectorId: 'gmail',
    threadId: 'thread-012',
    messageId: '<msg-012@techcorp.com>',
    subject: 'Re: Engineering Hiring — JD Sign-off Needed',
    snippet: 'Hi Sarah, we\'ve had three candidates ask whether these roles are remote-friendly...',
    bodyHtml: null,
    bodyText: `Hi Sarah,

We've had three candidates ask whether these roles are remote-friendly. I need updated JDs that clarify the work arrangement before we post them on LinkedIn and Greenhouse.

Also, for the Staff Backend Engineer role — the hiring committee wants to know if the preference is for someone with fintech experience or healthcare data experience, given both Atlas and the Meridian integration are in play.

I'd appreciate your input by EOD Friday. Pipeline is strong (22 applications for Staff BE, 14 for Senior Frontend) but we're losing candidates to faster-moving companies.

Michael Torres
Talent Acquisition Lead`,
    from: { name: 'Michael Torres', email: 'm.torres@techcorp.com' },
    to: [{ name: 'Sarah Chen', email: 'sarah.chen@techcorp.com' }],
    cc: [{ name: 'James Okafor', email: 'james.okafor@techcorp.com' }],
    bcc: [],
    replyTo: null,
    date: '2026-09-08T09:30:00Z',
    receivedAt: '2026-09-08T09:30:28Z',
    status: 'read',
    category: 'primary',
    labels: ['hiring', 'engineering'],
    attachments: [
      {
        id: 'att-007',
        filename: 'JD_StaffBackendEngineer_draft.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        sizeBytes: 38400,
        isInline: false,
      },
    ],
    isStarred: false,
    isImportant: false,
    aiSummary: 'Michael needs JD sign-off by Friday EOD. Key questions: remote policy and fintech vs. healthcare experience preference for Staff BE role.',
    aiActionItems: ['Review and update JDs by Friday EOD', 'Decide on remote work policy for engineering roles', 'Specify domain experience preference for Staff BE'],
    hasCalendarInvite: false,
    spamScore: 0,
  },
  {
    id: 'email-013',
    connectorId: 'gmail',
    threadId: 'thread-013',
    messageId: '<msg-013@techcorp.com>',
    subject: 'Q4 Marketing Plan — Product-Led Growth Strategy',
    snippet: 'Sarah, I\'ve drafted the Q4 marketing plan with a heavy focus on product-led growth for the Atlas launch...',
    bodyHtml: null,
    bodyText: `Sarah,

I've drafted the Q4 marketing plan with a heavy focus on product-led growth for the Atlas launch. Highlights include:

- Freemium tier launch on November 1st (requires product confirmation of feature gates)
- Targeted LinkedIn campaign to 12,000 product managers and ops leaders
- 3 joint case studies: Meridian Health (pending), Acme Corp (confirmed), and one TBD
- Product Hunt launch on November 15th — aiming for #1 Product of the Day
- Partnership with 2 industry analysts (Gartner and Forrester) for independent reviews

Budget: $340K for Q4 (pending exec approval at Tuesday's meeting).

I need the final feature list for Atlas v1.0 to finalize campaign messaging. When can we sync this week?

Olivia`,
    from: { name: 'Olivia Hartman', email: 'olivia.hartman@techcorp.com' },
    to: [{ name: 'Sarah Chen', email: 'sarah.chen@techcorp.com' }],
    cc: [{ name: 'Tom Weston', email: 't.weston@techcorp.com' }],
    bcc: [],
    replyTo: null,
    date: '2026-09-07T16:45:00Z',
    receivedAt: '2026-09-07T16:45:09Z',
    status: 'read',
    category: 'primary',
    labels: ['marketing', 'q4-planning', 'project-atlas'],
    attachments: [
      {
        id: 'att-008',
        filename: 'Q4_MarketingPlan_v2_Draft.pptx',
        mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        sizeBytes: 4521000,
        isInline: false,
      },
    ],
    isStarred: false,
    isImportant: false,
    aiSummary: 'Olivia drafted Q4 marketing plan focused on PLG, freemium launch, analyst partnerships, and Product Hunt. Needs final Atlas feature list and a sync this week.',
    aiActionItems: ['Share final Atlas v1.0 feature list with Olivia', 'Schedule sync with Olivia this week', 'Confirm Meridian as approved case study reference'],
    hasCalendarInvite: false,
    spamScore: 0,
  },
  {
    id: 'email-014',
    connectorId: 'gmail',
    threadId: 'thread-014',
    messageId: '<msg-014@meridianhealth.com>',
    subject: 'Re: Integration Timeline — Meridian Health Partnership',
    snippet: 'Sarah, Rachel and I reviewed your proposed integration milestones...',
    bodyHtml: null,
    bodyText: `Sarah,

Rachel and I reviewed your proposed integration milestones. We can commit to the following:

- October 5th: Meridian sandbox environment ready and API credentials delivered
- October 20th: Integration spec document finalized (joint effort)
- November 15th: Technical integration complete and QA ready
- November 30th: UAT sign-off
- December 10th: Production go-live

One concern: our IT change management process requires a 14-day freeze window in December (Dec 10–24) for holiday system stability. The December 10th go-live date is our absolute latest.

Let's schedule a project kick-off call week of September 22nd with both technical teams. Rachel will send an invite.

Priya`,
    from: { name: 'Priya Nair', email: 'priya.nair@meridianhealth.com' },
    to: [{ name: 'Sarah Chen', email: 'sarah.chen@techcorp.com' }],
    cc: [{ name: 'Rachel Kim', email: 'rachel.kim@meridianhealth.com' }, { name: 'James Okafor', email: 'james.okafor@techcorp.com' }],
    bcc: [],
    replyTo: null,
    date: '2026-09-07T14:00:00Z',
    receivedAt: '2026-09-07T14:00:17Z',
    status: 'read',
    category: 'primary',
    labels: ['meridian', 'integration'],
    attachments: [],
    isStarred: false,
    isImportant: true,
    aiSummary: 'Meridian confirmed integration milestones: sandbox Oct 5, integration complete Nov 15, go-live Dec 10 (hard deadline due to IT freeze Dec 10-24). Kickoff call week of Sept 22.',
    aiActionItems: ['Block Dec 10 as hard go-live deadline in project plan', 'Confirm kickoff call week of Sept 22'],
    hasCalendarInvite: false,
    spamScore: 0,
  },
  {
    id: 'email-015',
    connectorId: 'gmail',
    threadId: 'thread-015',
    messageId: '<msg-015@techcorp.com>',
    subject: 'ML Recommendation Engine — Feature Requirements Needed',
    snippet: 'Hi Sarah, the model v2 training is complete and results look promising (18% CTR improvement in offline eval)...',
    bodyHtml: null,
    bodyText: `Hi Sarah,

The model v2 training is complete and results look promising — 18% click-through improvement in offline evaluation compared to the rule-based baseline. We're ready to move into the A/B test framework.

Before we launch the first experiment, I need your input on two things:

1. Personalization features scope: What user signals should drive recommendations? (Email open patterns? Calendar density? Task completion rate?)
2. Cold start strategy: For new users with no history, should we use industry benchmarks or ask them to self-select interests during onboarding?

I'd also flag that the current data pipeline processes emails and calendar events but not tasks. If tasks should influence recommendations, we need to extend the pipeline — that's ~3 weeks of work.

Can we set up a 30-minute product review next week?

Raj Patel
Data Science Manager`,
    from: { name: 'Raj Patel', email: 'raj.patel@techcorp.com' },
    to: [{ name: 'Sarah Chen', email: 'sarah.chen@techcorp.com' }],
    cc: [],
    bcc: [],
    replyTo: null,
    date: '2026-09-06T15:30:00Z',
    receivedAt: '2026-09-06T15:30:22Z',
    status: 'read',
    category: 'primary',
    labels: ['project-atlas', 'ml', 'product'],
    attachments: [],
    isStarred: false,
    isImportant: false,
    aiSummary: 'ML model v2 shows 18% CTR improvement. Raj needs product decisions: personalization signals and cold-start strategy. Task-based recommendations would require 3 additional weeks.',
    aiActionItems: ['Define personalization signals for recommendations', 'Decide cold-start strategy for new users', 'Schedule 30-min product review with Raj next week'],
    hasCalendarInvite: false,
    spamScore: 0,
  },
  {
    id: 'email-016',
    connectorId: 'gmail',
    threadId: 'thread-016',
    messageId: '<msg-016@acmecorp.com>',
    subject: 'Acme Corp — Renewal Discussion',
    snippet: 'Hi Sarah, our current TechCorp contract expires on January 31st and I\'d like to get ahead of the renewal conversation...',
    bodyHtml: null,
    bodyText: `Hi Sarah,

Our current TechCorp contract expires on January 31st and I'd like to get ahead of the renewal conversation. We've been very happy with the platform — our team saves an estimated 6 hours/week per user.

A few things we'd like to explore in the renewal:

1. Pricing: Can we negotiate a volume discount? We're planning to expand from 45 to 120 seats in 2027.
2. Atlas access: We'd love to be in the first wave of Atlas enterprise beta customers.
3. Dedicated CSM: Given our expanded deployment, we'd need a dedicated customer success manager.

Happy to get on a call anytime in the next 2 weeks. Our procurement timeline requires a signed renewal by December 1st.

Best,
Marcus Rivera`,
    from: { name: 'Marcus Rivera', email: 'marcus.rivera@acmecorp.com' },
    to: [{ name: 'Sarah Chen', email: 'sarah.chen@techcorp.com' }],
    cc: [],
    bcc: [],
    replyTo: null,
    date: '2026-09-05T18:00:00Z',
    receivedAt: '2026-09-05T18:00:31Z',
    status: 'read',
    category: 'primary',
    labels: ['acme', 'renewal', 'important'],
    attachments: [],
    isStarred: true,
    isImportant: true,
    aiSummary: 'Acme renewing Jan 31. Want volume discount (45→120 seats), Atlas beta access, and dedicated CSM. Signed renewal needed by Dec 1.',
    aiActionItems: ['Schedule renewal call with Marcus within 2 weeks', 'Prepare volume pricing proposal', 'Confirm Atlas beta customer criteria with James', 'Loop in Sales and CS on Acme expansion'],
    hasCalendarInvite: false,
    spamScore: 0,
  },
  {
    id: 'email-017',
    connectorId: 'gmail',
    threadId: 'thread-017',
    messageId: '<msg-017@techcorp.com>',
    subject: 'Product Spec Review — Atlas Notification System',
    snippet: 'Sarah, I\'ve reviewed the notification system spec. A few concerns about the proposed real-time WebSocket implementation...',
    bodyHtml: null,
    bodyText: `Sarah,

I've reviewed the notification system spec. A few concerns about the proposed real-time WebSocket implementation:

1. Connection overhead: Maintaining persistent WebSocket connections for 10K+ concurrent users will require significant infrastructure scaling. I'd recommend considering Server-Sent Events (SSE) for this use case.
2. Offline handling: The spec doesn't address what happens when users reconnect after being offline. We need a queuing mechanism.
3. Mobile push: The spec mentions push notifications but doesn't specify the provider — Firebase or APNs? This affects implementation approach.

Can we discuss in Tuesday's architecture review? I've added it to the agenda.

Kevin`,
    from: { name: 'Kevin Zhao', email: 'k.zhao@techcorp.com' },
    to: [{ name: 'Sarah Chen', email: 'sarah.chen@techcorp.com' }],
    cc: [{ name: 'James Okafor', email: 'james.okafor@techcorp.com' }],
    bcc: [],
    replyTo: null,
    date: '2026-09-05T10:15:00Z',
    receivedAt: '2026-09-05T10:15:44Z',
    status: 'read',
    category: 'primary',
    labels: ['project-atlas', 'engineering', 'spec'],
    attachments: [],
    isStarred: false,
    isImportant: false,
    aiSummary: 'Kevin flagged 3 technical concerns on notification spec: WebSocket scalability, offline reconnect handling, and push notification provider selection.',
    aiActionItems: ['Review WebSocket vs SSE tradeoffs before Tuesday architecture review', 'Define offline notification queuing behavior in spec', 'Decide on push notification provider (Firebase vs APNs)'],
    hasCalendarInvite: false,
    spamScore: 0,
  },
  {
    id: 'email-018',
    connectorId: 'gmail',
    threadId: 'thread-018',
    messageId: '<msg-018@techcorp.com>',
    subject: 'Atlas Beta Program — Customer Nomination List',
    snippet: 'Hi Sarah, per our last discussion, here are my nominations for the Atlas closed beta program (10 slots available)...',
    bodyHtml: null,
    bodyText: `Hi Sarah,

Per our last discussion, here are my nominations for the Atlas closed beta program (10 slots available):

Tier 1 (Priority, all committed verbally):
1. Acme Corp — Marcus Rivera confirmed strong interest
2. Meridian Health — Rachel Kim enthusiastic pending contract
3. Cascade Financial — demo Sept 18th, strong prospect
4. NovaCare Systems — existing customer, high engagement
5. Orion Manufacturing — CTO specifically requested early access

Tier 2 (Warm, need outreach):
6–10: Submitted separately in the CRM.

I'd recommend starting with Tier 1 only for the initial 60-day beta period to ensure we can provide white-glove support. Shall I draft the beta invitation emails?

Tom`,
    from: { name: 'Tom Weston', email: 't.weston@techcorp.com' },
    to: [{ name: 'Sarah Chen', email: 'sarah.chen@techcorp.com' }],
    cc: [],
    bcc: [],
    replyTo: null,
    date: '2026-09-04T14:00:00Z',
    receivedAt: '2026-09-04T14:00:06Z',
    status: 'read',
    category: 'primary',
    labels: ['project-atlas', 'beta', 'sales'],
    attachments: [],
    isStarred: false,
    isImportant: false,
    aiSummary: 'Tom nominated 5 Tier 1 beta customers: Acme, Meridian, Cascade Financial, NovaCare, and Orion Manufacturing. Recommends limiting initial beta to Tier 1 for 60 days.',
    aiActionItems: ['Approve Tier 1 beta customer list', 'Confirm beta start date with engineering', 'Ask Tom to draft beta invitation emails'],
    hasCalendarInvite: false,
    spamScore: 0,
  },
  {
    id: 'email-019',
    connectorId: 'gmail',
    threadId: 'thread-019',
    messageId: '<msg-019@techcorp.com>',
    subject: '1:1 Notes — September 5th',
    snippet: 'Sarah, here are the action items from our 1:1 today. You committed to reviewing the Atlas spec by Wednesday...',
    bodyHtml: null,
    bodyText: `Sarah,

Here are the action items from our 1:1 today (Sept 5):

Sarah's commitments:
- Review Atlas notification spec → by Sept 10
- Provide input on Q4 OKRs → by Sept 15
- Approve JDs for three engineering hires → by Sept 12
- Schedule alignment meeting with Olivia re: marketing feature list → this week

Topics for next 1:1 (Sept 19):
- Q4 roadmap risk review
- Meridian partnership status
- Budget review for APAC expansion

See you in two weeks!

James`,
    from: { name: 'James Okafor', email: 'james.okafor@techcorp.com' },
    to: [{ name: 'Sarah Chen', email: 'sarah.chen@techcorp.com' }],
    cc: [],
    bcc: [],
    replyTo: null,
    date: '2026-09-05T17:30:00Z',
    receivedAt: '2026-09-05T17:30:15Z',
    status: 'read',
    category: 'primary',
    labels: ['1-1', 'action-items'],
    attachments: [],
    isStarred: false,
    isImportant: false,
    aiSummary: 'James captured 4 action items from 1:1: Atlas spec review, OKR input, JD approval, and marketing alignment meeting. Next 1:1 Sept 19.',
    aiActionItems: [],
    hasCalendarInvite: false,
    spamScore: 0,
  },
  {
    id: 'email-020',
    connectorId: 'gmail',
    threadId: 'thread-020',
    messageId: '<msg-020@apacgrowth.com>',
    subject: 'Re: APAC Expansion — Singapore Trip Planning',
    snippet: 'Hi Sarah, I\'ve identified three enterprise prospect meetings in Singapore for your October visit...',
    bodyHtml: null,
    bodyText: `Hi Sarah,

I've identified three enterprise prospect meetings for your October Singapore visit (October 14–17):

1. DBS Bank — IT leadership team, 10AM Oct 14
2. Changi Airport Group — Digital transformation team, 2PM Oct 15
3. GIC Private Limited — Ops efficiency team, 11AM Oct 16

I'd also recommend a dinner with the Singapore EDB (Economic Development Board) on Oct 14 evening — they offer market entry grants that could offset up to S$200K of your setup costs.

Please confirm travel plans so I can finalize bookings. Singapore visa is not required for US passport holders.

Sophie Laurent`,
    from: { name: 'Sophie Laurent', email: 's.laurent@apacgrowth.com' },
    to: [{ name: 'Sarah Chen', email: 'sarah.chen@techcorp.com' }],
    cc: [],
    bcc: [],
    replyTo: null,
    date: '2026-09-04T03:00:00Z',
    receivedAt: '2026-09-04T03:00:41Z',
    status: 'read',
    category: 'primary',
    labels: ['apac', 'travel'],
    attachments: [],
    isStarred: false,
    isImportant: false,
    aiSummary: 'Sophie identified 3 prospect meetings in Singapore Oct 14-17. EDB dinner on Oct 14 could unlock S$200K grant. Needs travel confirmation.',
    aiActionItems: ['Confirm Singapore trip Oct 14-17', 'Book flights and hotel', 'Prepare enterprise pitch materials for Singapore prospects'],
    hasCalendarInvite: false,
    spamScore: 0,
  },
  // ─── ADDITIONAL READ EMAILS ────────────────────────────────────────────────
  {
    id: 'email-021',
    connectorId: 'gmail',
    threadId: 'thread-021',
    messageId: '<msg-021@techcorp.com>',
    subject: 'Q3 OKR Retrospective — Lessons Learned',
    snippet: 'Team, attached is the Q3 OKR retrospective. Overall score: 71%. Highlights and misses inside...',
    bodyHtml: null,
    bodyText: `Team,

Attached is the Q3 OKR retrospective. Overall attainment: 71% (above our 70% internal target for a "stretch" OKR set).

Highlights:
- Exceeded ARR growth target by 8%
- Delivered 4 of 5 product features on time
- NPS improved from 42 to 58

Misses:
- Engineering hiring: 2 of 4 roles filled (market is competitive)
- International sales pipeline: behind by ~$800K ARR

Detailed breakdown and lessons learned in the attached document. These will inform our Q4 OKR setting.

James`,
    from: { name: 'James Okafor', email: 'james.okafor@techcorp.com' },
    to: [{ name: 'Sarah Chen', email: 'sarah.chen@techcorp.com' }],
    cc: [],
    bcc: [],
    replyTo: null,
    date: '2026-09-03T09:00:00Z',
    receivedAt: '2026-09-03T09:00:26Z',
    status: 'read',
    category: 'primary',
    labels: ['q3-review', 'okr'],
    attachments: [
      {
        id: 'att-009',
        filename: 'Q3_OKR_Retrospective_Final.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 524000,
        isInline: false,
      },
    ],
    isStarred: false,
    isImportant: false,
    aiSummary: 'Q3 OKR attainment 71%. NPS up from 42 to 58. Engineering hiring and international pipeline were misses.',
    aiActionItems: [],
    hasCalendarInvite: false,
    spamScore: 0,
  },
  {
    id: 'email-022',
    connectorId: 'gmail',
    threadId: 'thread-022',
    messageId: '<msg-022@meridianhealth.com>',
    subject: 'Meridian Health — Technical Requirements Document',
    snippet: 'Sarah, attached is our technical requirements document for the integration. The key requirements are HIPAA compliance, HL7 FHIR support...',
    bodyHtml: null,
    bodyText: `Sarah,

Attached is our technical requirements document for the integration. Our four non-negotiable requirements are:

1. HIPAA compliance with full audit logging
2. HL7 FHIR R4 support for patient data exchange
3. Data residency within US regions only
4. 99.9% uptime SLA (measured monthly)

We also prefer a dedicated Meridian environment (not multi-tenant) for PHI workloads, though we understand this may affect pricing.

Please have your engineering team review and confirm feasibility within 10 business days.

Rachel Kim
Director of Product Integration, Meridian Health`,
    from: { name: 'Rachel Kim', email: 'rachel.kim@meridianhealth.com' },
    to: [{ name: 'Sarah Chen', email: 'sarah.chen@techcorp.com' }, { name: 'James Okafor', email: 'james.okafor@techcorp.com' }],
    cc: [],
    bcc: [],
    replyTo: null,
    date: '2026-09-02T13:00:00Z',
    receivedAt: '2026-09-02T13:00:54Z',
    status: 'read',
    category: 'primary',
    labels: ['meridian', 'technical', 'compliance'],
    attachments: [
      {
        id: 'att-010',
        filename: 'Meridian_TechRequirements_v1.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 734000,
        isInline: false,
      },
    ],
    isStarred: false,
    isImportant: true,
    aiSummary: 'Meridian\'s non-negotiable requirements: HIPAA with audit logs, HL7 FHIR R4, US data residency, 99.9% SLA. Also prefer single-tenant PHI environment.',
    aiActionItems: ['Engineering team to review and confirm feasibility within 10 business days', 'Assess single-tenant environment pricing impact'],
    hasCalendarInvite: false,
    spamScore: 0,
  },
  {
    id: 'email-023',
    connectorId: 'gmail',
    threadId: 'thread-023',
    messageId: '<msg-023@brightwave.ai>',
    subject: 'Catching up — Coffee next week?',
    snippet: 'Hi Sarah! Hope you\'re well. I\'ll be in SF next week and would love to grab coffee and catch up...',
    bodyHtml: null,
    bodyText: `Hi Sarah!

Hope you're well. I'll be in SF next week (Sept 15-19) and would love to grab coffee and catch up — it's been too long since our old TechCorp days.

No agenda, just a friendly catch-up. Though I'll confess, I'm always curious how things are going with your new product. We're in a fascinating space right now.

Let me know if Tuesday or Wednesday works for you. I'm flexible on timing.

Best,
Elena`,
    from: { name: 'Elena Vasquez', email: 'elena.vasquez@brightwave.ai' },
    to: [{ name: 'Sarah Chen', email: 'sarah.chen@techcorp.com' }],
    cc: [],
    bcc: [],
    replyTo: null,
    date: '2026-09-07T20:00:00Z',
    receivedAt: '2026-09-07T20:00:18Z',
    status: 'unread',
    category: 'primary',
    labels: ['personal', 'competitor'],
    attachments: [],
    isStarred: false,
    isImportant: false,
    aiSummary: 'Elena (BrightWave CPO, former TechCorp colleague) wants coffee in SF Sept 15-19. Friendly but worth noting competitive context.',
    aiActionItems: ['Decide whether to accept coffee meeting with Elena — be mindful of competitive sensitivity'],
    hasCalendarInvite: false,
    spamScore: 0,
  },
  {
    id: 'email-024',
    connectorId: 'gmail',
    threadId: 'thread-024',
    messageId: '<msg-024@techcorp.com>',
    subject: 'Vertex Acquisition — LOI Draft for Review',
    snippet: 'Sarah, legal has prepared the first draft of the Letter of Intent for the Vertex Labs acquisition...',
    bodyHtml: null,
    bodyText: `Sarah,

Legal has prepared the first draft of the Letter of Intent for the Vertex Labs acquisition. The key terms are:

- Proposed acquisition price: $18M (80% cash, 20% TechCorp stock)
- Exclusivity period: 45 days from signing
- Employee retention: All 23 Vertex employees to receive 2-year retention packages
- Expected closing: December 31, 2026

The LOI is non-binding on price but binding on exclusivity. Daniel Park has been informed and is receptive.

Please review and return your comments by September 15th so we can present to the board before month-end.

(sent from corporate counsel)`,
    from: { name: 'TechCorp Legal', email: 'legal@techcorp.com' },
    to: [{ name: 'Sarah Chen', email: 'sarah.chen@techcorp.com' }],
    cc: [],
    bcc: [],
    replyTo: null,
    date: '2026-09-06T08:00:00Z',
    receivedAt: '2026-09-06T08:00:03Z',
    status: 'read',
    category: 'primary',
    labels: ['vertex', 'acquisition', 'legal', 'confidential'],
    attachments: [
      {
        id: 'att-011',
        filename: 'Vertex_LOI_Draft_v1_CONFIDENTIAL.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 188000,
        isInline: false,
      },
    ],
    isStarred: true,
    isImportant: true,
    aiSummary: 'LOI draft for Vertex acquisition at $18M (80% cash / 20% stock), 45-day exclusivity, 23 employees with retention packages. Closing target Dec 31. Comments needed by Sept 15.',
    aiActionItems: ['Review LOI draft', 'Return comments to legal by Sept 15', 'Prepare for board presentation before month-end'],
    hasCalendarInvite: false,
    spamScore: 0,
  },
  {
    id: 'email-025',
    connectorId: 'gmail',
    threadId: 'thread-025',
    messageId: '<msg-025@techcorp.com>',
    subject: 'Design System — Atlas Component Library v1.0 Released',
    snippet: 'The Atlas component library v1.0 is now published to npm. This release includes 47 components...',
    bodyHtml: null,
    bodyText: `Hi team,

The Atlas component library v1.0 is now published to our internal npm registry. This release includes 47 production-ready components with:
- Full dark mode support
- WCAG 2.1 AA accessibility compliance
- Storybook documentation for all components
- Unit test coverage at 94%

Changelog and migration guide linked below. All teams building on Atlas should upgrade from the beta library by October 1st.

Natalie Brooks`,
    from: { name: 'Natalie Brooks', email: 'n.brooks@techcorp.com' },
    to: [{ name: 'Sarah Chen', email: 'sarah.chen@techcorp.com' }],
    cc: [{ name: 'Kevin Zhao', email: 'k.zhao@techcorp.com' }, { name: 'James Okafor', email: 'james.okafor@techcorp.com' }],
    bcc: [],
    replyTo: null,
    date: '2026-09-04T11:00:00Z',
    receivedAt: '2026-09-04T11:00:29Z',
    status: 'read',
    category: 'updates',
    labels: ['design', 'project-atlas', 'engineering'],
    attachments: [],
    isStarred: false,
    isImportant: false,
    aiSummary: 'Atlas component library v1.0 released. 47 components, WCAG 2.1 AA, 94% test coverage. Teams must migrate from beta by Oct 1.',
    aiActionItems: [],
    hasCalendarInvite: false,
    spamScore: 0,
  },
  {
    id: 'email-026',
    connectorId: 'gmail',
    threadId: 'thread-026',
    messageId: '<msg-026@techcorp.com>',
    subject: 'Company All-Hands — September 24th Agenda',
    snippet: 'Hi everyone, the September All-Hands is scheduled for Wednesday September 24th at 2PM PT...',
    bodyHtml: null,
    bodyText: `Hi everyone,

The September All-Hands is scheduled for Wednesday, September 24th at 2:00 PM PT. Zoom link will be distributed the morning of.

Agenda:
1. Q3 results and celebration — CEO (15 min)
2. Project Atlas launch update — Sarah Chen (10 min)
3. Series B update — CEO (5 min, high level)
4. New hires and announcements (5 min)
5. Q&A (25 min)

Sarah — can you please share your slide outline with me by September 19th? Keep it to 5 slides max, executive-level messaging.

— People Ops`,
    from: { name: 'People Operations', email: 'people-ops@techcorp.com' },
    to: [{ name: 'Sarah Chen', email: 'sarah.chen@techcorp.com' }],
    cc: [],
    bcc: [],
    replyTo: null,
    date: '2026-09-03T14:00:00Z',
    receivedAt: '2026-09-03T14:00:11Z',
    status: 'read',
    category: 'updates',
    labels: ['all-hands', 'company'],
    attachments: [],
    isStarred: false,
    isImportant: false,
    aiSummary: 'All-Hands Sept 24 at 2PM PT. Sarah presenting Atlas update (10 min, 5 slides max). Slide outline due Sept 19 to People Ops.',
    aiActionItems: ['Prepare 5-slide Atlas update for All-Hands', 'Send slide outline to People Ops by Sept 19'],
    hasCalendarInvite: true,
    spamScore: 0,
  },
  {
    id: 'email-027',
    connectorId: 'gmail',
    threadId: 'thread-027',
    messageId: '<msg-027@techcorp.com>',
    subject: 'Re: Product Roadmap — 2027 Planning Input',
    snippet: 'Sarah, I\'ve reviewed the 2027 product themes you shared. The market opportunity for AI workflow automation is significant...',
    bodyHtml: null,
    bodyText: `Sarah,

I've reviewed the 2027 product themes you shared. The market opportunity for AI workflow automation is significant — our TAM analysis suggests a $12B market by 2028. A few strategic inputs:

1. Double down on enterprise-grade security. Our enterprise sales cycles are blocked 40% of the time by security reviews. SOC 2 Type II is table stakes now; consider FedRAMP for government vertical.

2. Vertical focus for 2027: Healthcare (Meridian traction) and financial services (Cascade prospect) show the highest willingness to pay. Don't spread thin.

3. Platform/ecosystem play: Consider launching a developer API and marketplace in H2 2027. This is where competitors like BrightWave are not yet investing.

Happy to discuss further in our next sync.

Amanda`,
    from: { name: 'Amanda Foster', email: 'amanda.foster@sequoiacap.com' },
    to: [{ name: 'Sarah Chen', email: 'sarah.chen@techcorp.com' }],
    cc: [],
    bcc: [],
    replyTo: null,
    date: '2026-09-02T09:00:00Z',
    receivedAt: '2026-09-02T09:00:33Z',
    status: 'read',
    category: 'primary',
    labels: ['investor', 'strategy', 'roadmap'],
    attachments: [],
    isStarred: true,
    isImportant: true,
    aiSummary: 'Amanda recommends: enterprise security depth (consider FedRAMP), vertical focus on healthcare and fintech, and a developer API/marketplace in H2 2027.',
    aiActionItems: ['Incorporate Amanda\'s strategic inputs into 2027 planning doc'],
    hasCalendarInvite: false,
    spamScore: 0,
  },
  {
    id: 'email-028',
    connectorId: 'gmail',
    threadId: 'thread-028',
    messageId: '<msg-028@techcorp.com>',
    subject: 'APAC — Regulatory Research Summary',
    snippet: 'Hi Sarah, I\'ve compiled a summary of the data protection regulations across our three target APAC markets...',
    bodyHtml: null,
    bodyText: `Hi Sarah,

I've compiled a summary of data protection regulations across our three target APAC markets:

Singapore (PDPA 2012, amended 2021): Mandatory breach notification within 3 days, data portability rights, strong enforcement. Broadly compatible with our existing GDPR posture.

Australia (Privacy Act 1988 + APP): Stricter data localization requirements under proposed reforms. Cross-border transfer rules are evolving — consult local counsel before go-live.

Japan (APPI 2022): Requires explicit opt-in consent for sensitive data. Third-party data transfers require individual consent or whitelist arrangements. Localization is required for a subset of data categories.

Recommend engaging a Singapore-based data privacy firm before entity formation.

Sophie`,
    from: { name: 'Sophie Laurent', email: 's.laurent@apacgrowth.com' },
    to: [{ name: 'Sarah Chen', email: 'sarah.chen@techcorp.com' }],
    cc: [],
    bcc: [],
    replyTo: null,
    date: '2026-09-01T05:30:00Z',
    receivedAt: '2026-09-01T05:30:19Z',
    status: 'read',
    category: 'primary',
    labels: ['apac', 'compliance', 'legal'],
    attachments: [],
    isStarred: false,
    isImportant: false,
    aiSummary: 'Sophie summarized APAC data privacy regulations. Singapore PDPA is most compatible. Australia and Japan require additional legal review before go-live.',
    aiActionItems: ['Engage Singapore-based data privacy firm for entity formation advice'],
    hasCalendarInvite: false,
    spamScore: 0,
  },
  {
    id: 'email-029',
    connectorId: 'gmail',
    threadId: 'thread-029',
    messageId: '<msg-029@techcorp.com>',
    subject: 'Engineering Weekly — Sept 2 Notes',
    snippet: 'Team, sprint 18 is complete. Atlas API is 72% done, CI/CD pipeline stabilized...',
    bodyHtml: null,
    bodyText: `Team,

Sprint 18 complete. Atlas backend API: 72% complete. CI/CD pipeline stabilized after last week's outage — all builds green. Frontend dashboard nearing completion (85% done).

Upcoming sprint 19 focus:
- Bulk export API endpoint
- Webhook listener for third-party integrations
- Begin integration testing with Meridian sandbox (credentials pending)

Velocity: 48 story points delivered (target was 45). Team morale is high.

Kevin`,
    from: { name: 'Kevin Zhao', email: 'k.zhao@techcorp.com' },
    to: [{ name: 'Sarah Chen', email: 'sarah.chen@techcorp.com' }, { name: 'James Okafor', email: 'james.okafor@techcorp.com' }],
    cc: [{ name: 'Raj Patel', email: 'raj.patel@techcorp.com' }],
    bcc: [],
    replyTo: null,
    date: '2026-09-02T17:00:00Z',
    receivedAt: '2026-09-02T17:00:07Z',
    status: 'read',
    category: 'primary',
    labels: ['engineering', 'project-atlas'],
    attachments: [],
    isStarred: false,
    isImportant: false,
    aiSummary: 'Sprint 18 complete, 48 story points delivered. API 72% done. Sprint 19 focuses on bulk export, webhooks, and Meridian integration testing.',
    aiActionItems: [],
    hasCalendarInvite: false,
    spamScore: 0,
  },
  {
    id: 'email-030',
    connectorId: 'gmail',
    threadId: 'thread-030',
    messageId: '<msg-030@techcorp.com>',
    subject: 'Investor Update — August 2026',
    snippet: 'Dear investors, please find our August 2026 monthly update attached...',
    bodyHtml: null,
    bodyText: `Dear Investors,

Please find our August 2026 monthly update attached.

Highlights:
- ARR: $8.4M (up 14% MoM) — ahead of plan
- New customers: 7 (3 SMB, 4 enterprise)
- Churn: 0 this month (YTD: 2 customers, both SMB)
- NPS: 61 (up from 58 in July)
- Headcount: 48 (4 open roles)

Key projects: Project Atlas on track for October feature freeze. Series B process underway (target close: December).

Full report attached.

Sarah Chen`,
    from: { name: 'Sarah Chen', email: 'sarah.chen@techcorp.com' },
    to: [{ name: 'Amanda Foster', email: 'amanda.foster@sequoiacap.com' }, { name: 'David Chen', email: 'd.chen@horizonventures.vc' }],
    cc: [],
    bcc: [],
    replyTo: null,
    date: '2026-09-01T10:00:00Z',
    receivedAt: '2026-09-01T10:00:00Z',
    status: 'sent',
    category: 'primary',
    labels: ['investor-update', 'series-b'],
    attachments: [
      {
        id: 'att-012',
        filename: 'TechCorp_InvestorUpdate_Aug2026.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 312000,
        isInline: false,
      },
    ],
    isStarred: false,
    isImportant: false,
    aiSummary: 'August investor update sent. ARR $8.4M, 14% MoM growth, 0 churn, NPS 61. Atlas on track. Series B targeting December close.',
    aiActionItems: [],
    hasCalendarInvite: false,
    spamScore: 0,
  },
  {
    id: 'email-031',
    connectorId: 'gmail',
    threadId: 'thread-031',
    messageId: '<msg-031@techcorp.com>',
    subject: 'Security Audit — September Scheduled Scan Results',
    snippet: 'Your monthly automated security scan is complete. 0 critical vulnerabilities, 2 medium severity items...',
    bodyHtml: null,
    bodyText: `Automated Security Scan Complete — TechCorp Production Environment

Scan Date: September 8, 2026
Result Summary:
- Critical: 0
- High: 0
- Medium: 2 (details in attached report)
- Low: 7
- Informational: 14

Medium severity items require attention within 14 days per your security policy. Please review the attached report and assign remediation owners.

Security Team`,
    from: { name: 'Security Notifications', email: 'security@techcorp.com' },
    to: [{ name: 'Sarah Chen', email: 'sarah.chen@techcorp.com' }],
    cc: [{ name: 'James Okafor', email: 'james.okafor@techcorp.com' }, { name: 'Kevin Zhao', email: 'k.zhao@techcorp.com' }],
    bcc: [],
    replyTo: null,
    date: '2026-09-08T06:00:00Z',
    receivedAt: '2026-09-08T06:00:44Z',
    status: 'read',
    category: 'updates',
    labels: ['security', 'compliance'],
    attachments: [
      {
        id: 'att-013',
        filename: 'SecurityScan_Sept2026_Report.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 448000,
        isInline: false,
      },
    ],
    isStarred: false,
    isImportant: false,
    aiSummary: 'Sept security scan: 0 critical/high, 2 medium (need remediation within 14 days), 7 low.',
    aiActionItems: ['Review 2 medium severity security findings', 'Assign remediation owners within 14 days'],
    hasCalendarInvite: false,
    spamScore: 0,
  },
  {
    id: 'email-032',
    connectorId: 'gmail',
    threadId: 'thread-032',
    messageId: '<msg-032@techcorp.com>',
    subject: 'Horizon Ventures — Term Sheet Arriving Friday',
    snippet: 'Sarah, we\'re planning to send the Series B term sheet by end of business this Friday...',
    bodyHtml: null,
    bodyText: `Sarah,

We're planning to send the Series B term sheet by end of business this Friday (September 12th). Amanda and I have aligned on the commercial terms, which I believe will be favorable.

Key economics to expect:
- Valuation: Pre-money in the range we've discussed
- Lead: Sequoia $15M, Horizon $8M, with $5M reserved for strategic investors
- Board seat: Sequoia will request one seat; Horizon will take observer rights
- Standard pro-rata rights for existing investors

Please have your counsel review on an expedited basis — we'd like a signed term sheet by September 22nd to stay on the December close timeline.

David Chen`,
    from: { name: 'David Chen', email: 'd.chen@horizonventures.vc' },
    to: [{ name: 'Sarah Chen', email: 'sarah.chen@techcorp.com' }],
    cc: [],
    bcc: [],
    replyTo: null,
    date: '2026-09-10T08:00:00Z',
    receivedAt: '2026-09-10T08:00:09Z',
    status: 'unread',
    category: 'primary',
    labels: ['series-b', 'investor', 'important', 'confidential'],
    attachments: [],
    isStarred: true,
    isImportant: true,
    aiSummary: 'Term sheet arriving Friday Sept 12. Sequoia $15M + Horizon $8M + $5M strategic. 1 Sequoia board seat. Signed term sheet expected by Sept 22.',
    aiActionItems: ['Alert counsel to prepare for expedited term sheet review', 'Clear calendar for term sheet discussions week of Sept 15', 'Confirm target close remains December'],
    hasCalendarInvite: false,
    spamScore: 0,
  },
  {
    id: 'email-033',
    connectorId: 'gmail',
    threadId: 'thread-033',
    messageId: '<msg-033@techcorp.com>',
    subject: 'Product Analytics — August Dashboard',
    snippet: 'Hi Sarah, the August product analytics dashboard is ready...',
    bodyHtml: null,
    bodyText: `Hi Sarah,

The August product analytics dashboard is ready. Key metrics:

DAU/MAU ratio: 0.54 (healthy; target is 0.5+)
Avg session duration: 23 minutes (up 12% MoM)
Feature adoption:
  - Email management: 89% of users
  - Calendar: 76%
  - Tasks: 62%
  - Notes: 41%
  - Research packs (beta): 28%

Top user complaints (NPS detractors):
1. Mobile app performance (mentioned in 34% of detractor responses)
2. Search accuracy for older emails
3. Missing Outlook connector

These insights should inform Q4 prioritization. Full dashboard linked below.

Raj`,
    from: { name: 'Raj Patel', email: 'raj.patel@techcorp.com' },
    to: [{ name: 'Sarah Chen', email: 'sarah.chen@techcorp.com' }],
    cc: [],
    bcc: [],
    replyTo: null,
    date: '2026-09-02T11:00:00Z',
    receivedAt: '2026-09-02T11:00:21Z',
    status: 'read',
    category: 'primary',
    labels: ['analytics', 'product'],
    attachments: [],
    isStarred: false,
    isImportant: false,
    aiSummary: 'August analytics: DAU/MAU 0.54, sessions up 12%. Top detractor issues: mobile performance, search accuracy, missing Outlook connector.',
    aiActionItems: ['Review full analytics dashboard', 'Add mobile app performance to Q4 backlog consideration'],
    hasCalendarInvite: false,
    spamScore: 0,
  },
  {
    id: 'email-034',
    connectorId: 'gmail',
    threadId: 'thread-034',
    messageId: '<msg-034@techcorp.com>',
    subject: 'Travel Booking Confirmation — Singapore Oct 14-18',
    snippet: 'Your travel booking is confirmed. Outbound SFO-SIN Oct 14, return SIN-SFO Oct 18...',
    bodyHtml: null,
    bodyText: `Hello Sarah Chen,

Your travel booking is confirmed:

Outbound: SFO → SIN | Oct 14, 11:30 PM | Singapore Airlines SQ 32 | Business Class
Arrival: Oct 16, 06:40 AM (Singapore time)

Return: SIN → SFO | Oct 18, 01:15 AM | Singapore Airlines SQ 31 | Business Class
Arrival: Oct 18, 00:35 AM (San Francisco time)

Hotel: Marriott Tang Plaza, 320 Orchard Road, Singapore | Check-in Oct 16, Check-out Oct 18

Total cost: $6,840 (expenseable per T&E policy; attach this confirmation).

Travel Booking System`,
    from: { name: 'TechCorp Travel', email: 'travel@techcorp.com' },
    to: [{ name: 'Sarah Chen', email: 'sarah.chen@techcorp.com' }],
    cc: [],
    bcc: [],
    replyTo: null,
    date: '2026-09-09T13:00:00Z',
    receivedAt: '2026-09-09T13:00:02Z',
    status: 'read',
    category: 'updates',
    labels: ['travel', 'apac'],
    attachments: [
      {
        id: 'att-014',
        filename: 'TravelConfirmation_SIN_Oct2026.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 145000,
        isInline: false,
      },
    ],
    isStarred: false,
    isImportant: false,
    aiSummary: 'Singapore trip confirmed Oct 14-18. Business class SQ32/SQ31. Marriott Tang Plaza hotel. Total: $6,840.',
    aiActionItems: ['Save travel confirmation for expense report'],
    hasCalendarInvite: false,
    spamScore: 0,
  },
  {
    id: 'email-035',
    connectorId: 'gmail',
    threadId: 'thread-035',
    messageId: '<msg-035@techcorp.com>',
    subject: 'Re: Atlas Beta — NovaCare Systems Feedback',
    snippet: 'Sarah, NovaCare completed their first week in the Atlas beta. Overall sentiment is very positive...',
    bodyHtml: null,
    bodyText: `Sarah,

NovaCare completed their first week in the Atlas beta. Overall sentiment is very positive — their ops team has already automated 3 recurring workflows. Their key feedback:

Loves:
- The research pack feature is a "game changer" for their ops team (direct quote from their Head of Operations)
- Email threading and AI summaries are significantly reducing inbox time
- Calendar integration is seamless

Improvement requests:
1. Bulk task assignment (high priority for their team)
2. Custom notification rules per project
3. Export to CSV for board reporting

No P0 or P1 bugs reported. Planning a case study interview next week.

Tom`,
    from: { name: 'Tom Weston', email: 't.weston@techcorp.com' },
    to: [{ name: 'Sarah Chen', email: 'sarah.chen@techcorp.com' }],
    cc: [],
    bcc: [],
    replyTo: null,
    date: '2026-09-09T16:00:00Z',
    receivedAt: '2026-09-09T16:00:38Z',
    status: 'read',
    category: 'primary',
    labels: ['beta', 'project-atlas', 'customer-feedback'],
    attachments: [],
    isStarred: false,
    isImportant: false,
    aiSummary: 'NovaCare beta feedback is very positive. Research packs called a "game changer." Top requests: bulk task assignment, custom notifications, CSV export.',
    aiActionItems: ['Add NovaCare feedback to product backlog', 'Schedule case study interview with NovaCare', 'Consider bulk task assignment for v1.1 scope'],
    hasCalendarInvite: false,
    spamScore: 0,
  },
  {
    id: 'email-036',
    connectorId: 'gmail',
    threadId: 'thread-036',
    messageId: '<msg-036@techcorp.com>',
    subject: 'Finance — Q3 Expense Report Reminder',
    snippet: 'Hi Sarah, this is a reminder that Q3 expense reports are due by September 15th...',
    bodyHtml: null,
    bodyText: `Hi Sarah,

This is a reminder that Q3 expense reports are due by September 15th. Please submit all receipts for the period July 1 – September 30 via the Expensify portal.

Outstanding items we've flagged:
- August 14 – Dinner with investors ($412, missing receipt)
- September 2 – Conference registration ($895, missing GL code)

Please resolve these items before submission to avoid payment delays.

Finance Team`,
    from: { name: 'Finance Team', email: 'finance@techcorp.com' },
    to: [{ name: 'Sarah Chen', email: 'sarah.chen@techcorp.com' }],
    cc: [],
    bcc: [],
    replyTo: null,
    date: '2026-09-08T08:00:00Z',
    receivedAt: '2026-09-08T08:00:16Z',
    status: 'read',
    category: 'updates',
    labels: ['finance', 'admin'],
    attachments: [],
    isStarred: false,
    isImportant: false,
    aiSummary: 'Q3 expense report due Sept 15. Two flagged items: missing receipt for Aug 14 dinner and missing GL code for Sept 2 conference.',
    aiActionItems: ['Submit Q3 expense report by Sept 15', 'Find receipt for Aug 14 dinner', 'Add GL code for Sept 2 conference registration'],
    hasCalendarInvite: false,
    spamScore: 0,
  },
  {
    id: 'email-037',
    connectorId: 'gmail',
    threadId: 'thread-037',
    messageId: '<msg-037@techcorp.com>',
    subject: 'Atlas Architecture Review — Decisions Needed',
    snippet: 'Hi Sarah, we\'ve reached a few decisions that require product alignment before we can proceed...',
    bodyHtml: null,
    bodyText: `Hi Sarah,

We've reached three architectural decisions that require product alignment before engineering can proceed:

1. Data retention: How long should we retain email/calendar data for inactive users? (GDPR recommends 90 days; some enterprise customers may want longer)

2. Offline mode: Should v1.0 support full offline mode or read-only offline cache? Full offline requires 3 additional weeks.

3. Multi-language: v1.0 target: English only, or should we include Spanish and French? Marketing is asking.

Please provide decisions by Tuesday morning (Sept 15) so we can update the sprint plan.

James & Kevin`,
    from: { name: 'James Okafor', email: 'james.okafor@techcorp.com' },
    to: [{ name: 'Sarah Chen', email: 'sarah.chen@techcorp.com' }],
    cc: [{ name: 'Kevin Zhao', email: 'k.zhao@techcorp.com' }],
    bcc: [],
    replyTo: null,
    date: '2026-09-08T15:00:00Z',
    receivedAt: '2026-09-08T15:00:54Z',
    status: 'unread',
    category: 'primary',
    labels: ['project-atlas', 'engineering', 'decisions'],
    attachments: [],
    isStarred: false,
    isImportant: true,
    aiSummary: 'Three product decisions needed by Tuesday morning: data retention policy, offline mode scope, and v1.0 language support.',
    aiActionItems: ['Decide data retention policy (90 days vs. configurable)', 'Decide offline mode scope for v1.0', 'Decide language support for v1.0 (English-only or multilingual)', 'Reply to James and Kevin by Tuesday morning'],
    hasCalendarInvite: false,
    spamScore: 0,
  },
  {
    id: 'email-038',
    connectorId: 'gmail',
    threadId: 'thread-038',
    messageId: '<msg-038@techcorp.com>',
    subject: 'Competitive Analysis — Q3 2026 Market Report',
    snippet: 'Hi Sarah, the Q3 competitive analysis report is complete. Key finding: we\'re now #2 in the enterprise productivity space...',
    bodyHtml: null,
    bodyText: `Hi Sarah,

The Q3 competitive analysis report is complete. Key findings:

Market Position: TechCorp is now ranked #2 in enterprise AI productivity (Gartner Magic Quadrant, August 2026), up from #4 in Q1.

Top Competitors:
1. Notion (enterprise pivot) — leading on collaboration features
2. BrightWave AI — aggressive pricing, growing fast in mid-market
3. Asana AI — strong in workflow automation but weak on email integration

Our Differentiation (per analyst feedback):
- Best-in-class email/calendar AI integration
- Superior data governance story
- Research pack capability is unique in market

Recommended response: Accelerate Atlas launch and publish competitive positioning before BrightWave completes their Series B (estimated Q4).

Raj`,
    from: { name: 'Raj Patel', email: 'raj.patel@techcorp.com' },
    to: [{ name: 'Sarah Chen', email: 'sarah.chen@techcorp.com' }],
    cc: [{ name: 'Olivia Hartman', email: 'olivia.hartman@techcorp.com' }, { name: 'Tom Weston', email: 't.weston@techcorp.com' }],
    bcc: [],
    replyTo: null,
    date: '2026-09-07T10:00:00Z',
    receivedAt: '2026-09-07T10:00:12Z',
    status: 'read',
    category: 'primary',
    labels: ['competitive-intel', 'strategy'],
    attachments: [
      {
        id: 'att-015',
        filename: 'Q3_CompetitiveAnalysis_2026.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 2140000,
        isInline: false,
      },
    ],
    isStarred: false,
    isImportant: false,
    aiSummary: 'TechCorp moved to #2 in Gartner enterprise AI productivity. Key threats: BrightWave pricing, Notion collaboration. Recommendation: accelerate Atlas launch before BrightWave Series B.',
    aiActionItems: ['Read Q3 competitive analysis report', 'Align Atlas launch messaging with competitive differentiation'],
    hasCalendarInvite: false,
    spamScore: 0,
  },
  {
    id: 'email-039',
    connectorId: 'gmail',
    threadId: 'thread-039',
    messageId: '<msg-039@techcorp.com>',
    subject: 'Board Meeting — Pre-Read Materials Due Sept 19',
    snippet: 'Sarah, the quarterly board meeting is October 2nd. Pre-read package due to board members by September 19th...',
    bodyHtml: null,
    bodyText: `Sarah,

The quarterly board meeting is October 2nd, 2PM PT (virtual). Pre-read package must be distributed to board members by September 19th.

Required sections for your submission:
- Product and Engineering update (your section, 5 pages max)
- Q4 roadmap and resource plan
- Key risks and mitigations

Amanda will present the Series B status. Please coordinate with her on any overlapping sections.

Let me know if you have any questions.

— Board Admin`,
    from: { name: 'Board Secretary', email: 'board-admin@techcorp.com' },
    to: [{ name: 'Sarah Chen', email: 'sarah.chen@techcorp.com' }],
    cc: [],
    bcc: [],
    replyTo: null,
    date: '2026-09-05T12:00:00Z',
    receivedAt: '2026-09-05T12:00:00Z',
    status: 'read',
    category: 'primary',
    labels: ['board', 'q4-planning'],
    attachments: [],
    isStarred: true,
    isImportant: true,
    aiSummary: 'Board meeting Oct 2. Sarah\'s section (5 pages: product update, Q4 roadmap, risks) due Sept 19. Coordinate with Amanda on Series B sections.',
    aiActionItems: ['Write board meeting product section by Sept 19', 'Prepare Q4 roadmap section (5 pages max)', 'Coordinate with Amanda Foster on Series B section'],
    hasCalendarInvite: false,
    spamScore: 0,
  },
  {
    id: 'email-040',
    connectorId: 'gmail',
    threadId: 'thread-040',
    messageId: '<msg-040@techcorp.com>',
    subject: 'Re: Atlas UAT Kickoff — Beta Customers Confirmed',
    snippet: 'Sarah, great news — all five Tier 1 beta customers have confirmed participation...',
    bodyHtml: null,
    bodyText: `Sarah,

Great news — all five Tier 1 beta customers have confirmed their participation for the Atlas UAT program starting October 20th:

1. Acme Corp — 10 users (power users from operations team)
2. Meridian Health — 8 users (IT + business admin team, pending contract signature)
3. NovaCare Systems — 15 users (full ops department)
4. Cascade Financial — 5 users (executive team pilot)
5. Orion Manufacturing — 12 users (supply chain team)

Total beta users: 50. I'll coordinate onboarding schedules and send welcome materials the week of October 13th.

Tom`,
    from: { name: 'Tom Weston', email: 't.weston@techcorp.com' },
    to: [{ name: 'Sarah Chen', email: 'sarah.chen@techcorp.com' }],
    cc: [{ name: 'James Okafor', email: 'james.okafor@techcorp.com' }, { name: 'Natalie Brooks', email: 'n.brooks@techcorp.com' }],
    bcc: [],
    replyTo: null,
    date: '2026-09-10T09:00:00Z',
    receivedAt: '2026-09-10T09:00:44Z',
    status: 'unread',
    category: 'primary',
    labels: ['beta', 'project-atlas', 'customer'],
    attachments: [],
    isStarred: false,
    isImportant: false,
    aiSummary: 'All 5 Tier 1 beta customers confirmed for Oct 20 UAT kickoff. 50 total beta users. Tom coordinating onboarding week of Oct 13.',
    aiActionItems: ['Review beta onboarding plan', 'Confirm Meridian\'s participation is contingent on contract signature'],
    hasCalendarInvite: false,
    spamScore: 0,
  },
];
