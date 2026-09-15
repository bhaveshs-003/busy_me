import type { Note } from '@/types/index';

export const mockNotes: Note[] = [
  {
    id: 'note-001',
    title: 'Project Atlas — Product Requirements Summary',
    bodyMarkdown: `# Project Atlas v1.0 — Core Requirements

## Must-Have Features (v1.0)
- **Email management**: AI-powered inbox, threading, smart labels, bulk actions
- **Calendar integration**: Event creation, RSVP management, conflict detection
- **Task management**: Create, assign, checklist, prioritize, link to emails
- **Research packs**: Aggregate emails, events, tasks, notes, and contacts into a topic view
- **AI summarization**: Per-email, per-thread, and per-research-pack AI summaries
- **Connectors**: Gmail, Google Calendar (v1.0); Outlook, Slack (v1.1)

## Out of Scope (v1.0 → pushed to v1.1)
- Full offline mode (read-only cache only in v1.0)
- Spanish and French localization
- Mobile push notifications (web push only)
- Developer API / marketplace

## Key Non-Functional Requirements
- 99.9% uptime SLA
- HIPAA compliance with full audit logging
- SOC 2 Type II certification (by Q1 2027)
- WCAG 2.1 AA accessibility
- Data residency: US regions only (enterprise tier)

## Open Decisions
- Data retention period for inactive users (90 days vs. configurable)
- Cold-start personalization strategy for new users
- Push notification provider (Firebase vs. APNs)`,
    bodyText: 'Project Atlas v1.0 core requirements, out-of-scope items, non-functional requirements, and open decisions.',
    tags: ['project-atlas', 'prd', 'requirements'],
    isPinned: true,
    isArchived: false,
    color: '#4285F4',
    createdAt: '2026-09-01T10:00:00Z',
    updatedAt: '2026-09-09T15:00:00Z',
    linkedResearchPackId: 'rp-001',
    attachments: [],
    wordCount: 187,
    createdByAI: false,
  },
  {
    id: 'note-002',
    title: 'Meridian Partnership — Key Terms & Redlines',
    bodyMarkdown: `# Meridian Health Partnership — Contract Notes

## Non-Negotiable Requirements (from Rachel Kim)
1. **HIPAA compliance** with full audit logging
2. **HL7 FHIR R4** support for patient data exchange
3. **US data residency** only — affects multi-region deployment plan
4. **99.9% monthly uptime SLA**
5. Prefer **single-tenant environment** for PHI workloads (pricing TBD)

## Open Redlines (Priya's markup, v3)
- Section 4.2: Data governance — US jurisdiction requirement (engineering to confirm feasibility)
- Section 7.1: SLA commitments — legal review needed
- Exhibit C: Pricing schedule — redlined by Meridian legal team

## Integration Timeline (Confirmed)
| Milestone | Date |
|-----------|------|
| Sandbox environment + API credentials | Oct 5 |
| Integration spec finalized | Oct 20 |
| Technical integration complete | Nov 15 |
| UAT sign-off | Nov 30 |
| Production go-live (HARD DEADLINE) | Dec 10 |

## Risk: Dec freeze
Meridian IT freeze Dec 10–24. Missing Dec 10 go-live means January at the earliest.

## Action: Legal review call before Sept 19`,
    bodyText: 'Meridian partnership key terms, contract redlines, integration timeline, and risk notes.',
    tags: ['meridian', 'partnership', 'legal', 'contract'],
    isPinned: true,
    isArchived: false,
    color: '#DB4437',
    createdAt: '2026-09-09T11:00:00Z',
    updatedAt: '2026-09-10T07:30:00Z',
    linkedResearchPackId: 'rp-002',
    linkedEmailId: 'email-002',
    attachments: [],
    wordCount: 194,
    createdByAI: false,
  },
  {
    id: 'note-003',
    title: 'Series B — Fundraising Strategy Notes',
    bodyMarkdown: `# Series B Fundraising Notes

## Deal Structure (Expected)
- **Total raise**: ~$28M
- **Lead**: Sequoia Capital — $15M
- **Co-lead**: Horizon Ventures — $8M
- **Strategic**: $5M reserved (TBD)
- **Valuation**: Pre-money in the range discussed verbally (undisclosed)
- **Board**: Sequoia requests 1 board seat; Horizon takes observer rights

## Key Milestones
- Data room docs uploaded: **Sept 25**
- Signed term sheet target: **Sept 22**
- Closing target: **Dec 31, 2026**

## Amanda Foster's Strategic Inputs
1. Double down on enterprise security — FedRAMP for government vertical (2027)
2. Vertical focus: healthcare and fintech (highest WTP)
3. Developer API + marketplace in H2 2027

## Data Room Checklist
- [ ] FY2024 audited financials
- [ ] FY2025 YTD financials
- [ ] Fully diluted cap table
- [ ] Top 10 customer contracts by ARR
- [ ] 18 months of board minutes
- [ ] IP ownership certificates

## Risks
- BrightWave AI reportedly closing their own Series B in Q4 — could distract same investor pool
- December close is tight given legal review timeline`,
    bodyText: 'Series B fundraising strategy, deal structure, milestones, and data room checklist.',
    tags: ['series-b', 'investor', 'fundraising'],
    isPinned: true,
    isArchived: false,
    color: '#F4B400',
    createdAt: '2026-09-08T21:00:00Z',
    updatedAt: '2026-09-10T08:30:00Z',
    linkedResearchPackId: 'rp-003',
    attachments: [],
    wordCount: 231,
    createdByAI: false,
  },
  {
    id: 'note-004',
    title: 'BrightWave AI Competitive Analysis — Sept 2026',
    bodyMarkdown: `# BrightWave AI — Competitive Analysis

## Recent Moves
- Launched enterprise tier: **$199/seat/month** (vs TechCorp $290)
- Reportedly closing their own Series A → B
- Suspected healthcare customer win (Tom Weston intel from ProductSummit)
- Growing fast in mid-market (per Gartner Q3 report)

## Their Weaknesses (Differentiation Opportunities)
| Area | BrightWave | TechCorp Advantage |
|------|------------|---------------------|
| Calendar integration | None | Native, bi-directional |
| Research packs | None | Unique in market |
| Data governance | No SOC 2 yet | SOC 2 Type II (by Q1 2027) |
| Enterprise pricing | $199/seat | $290 but better value story |
| HIPAA | Unknown | In progress |

## Recommended Response
1. Update competitive battle card with new pricing/features
2. Brief sales team before Cascade Financial demo (Sept 18)
3. Publish competitive positioning before BrightWave completes their Series B
4. Accelerate Atlas launch timeline to establish market position

## Market Context (Gartner Q3 2026)
- TechCorp: #2 in enterprise AI productivity (up from #4 in Q1)
- BrightWave: growing rapidly but not yet in top quadrant
- Top threat: BrightWave's aggressive pricing + enterprise sales investment`,
    bodyText: 'BrightWave AI competitive analysis including pricing, feature gaps, and recommended strategic response.',
    tags: ['competitive-intel', 'brightwave', 'strategy'],
    isPinned: false,
    isArchived: false,
    color: null,
    createdAt: '2026-09-08T12:00:00Z',
    updatedAt: '2026-09-08T12:00:00Z',
    linkedEmailId: 'email-011',
    attachments: [],
    wordCount: 228,
    createdByAI: true,
  },
  {
    id: 'note-005',
    title: 'Meeting Notes — Meridian Integration Kickoff (Sept 22)',
    bodyMarkdown: `# Meeting Notes: Meridian Integration Kickoff
**Date:** September 22, 2026
**Attendees:** Sarah Chen, James Okafor, Kevin Zhao (TechCorp); Priya Nair, Rachel Kim (Meridian)

## Key Decisions Made
- TechCorp will provision a dedicated Meridian environment (single-tenant) for PHI workloads
- HL7 FHIR R4 adapter will be built as a separate microservice
- Kevin Zhao is assigned as integration tech lead on TechCorp side
- Weekly integration sync every Tuesday at 11AM PT

## Technical Blockers Raised
- HIPAA audit log format specification not yet agreed — Rachel to send spec by Sept 29
- Meridian's sandbox has legacy auth (OAuth 1.0) — Kevin will build compatibility layer
- FHIR R4 test data set not yet available from Meridian IT

## Action Items
| Owner | Action | Due |
|-------|--------|-----|
| Rachel Kim | Send HIPAA audit log spec | Sept 29 |
| Kevin Zhao | Build OAuth 1.0 compat layer | Oct 10 |
| Sarah Chen | Confirm SLA thresholds in contract | Sept 25 |
| Priya Nair | Deliver sandbox credentials | Oct 5 |

## Next Meeting
Oct 5, 11AM PT — Sandbox environment review`,
    bodyText: 'Meeting notes from Meridian Health integration kickoff on September 22, 2026.',
    tags: ['meridian', 'meeting-notes', 'integration'],
    isPinned: false,
    isArchived: false,
    color: null,
    createdAt: '2026-09-22T12:30:00Z',
    updatedAt: '2026-09-22T12:30:00Z',
    linkedResearchPackId: 'rp-002',
    linkedEventId: 'event-008',
    linkedContactId: 'contact-002',
    attachments: [],
    wordCount: 214,
    createdByAI: false,
  },
  {
    id: 'note-006',
    title: 'Q4 Planning — OKR Notes and Open Items',
    bodyMarkdown: `# Q4 2026 OKR Planning Notes

## Objectives Confirmed
**O1:** Ship Project Atlas v1.0 on time and on budget
**O2:** Grow ARR through the Meridian Health partnership
**O3:** Scale engineering team for 2027

## Sarah's Product KRs (to add to James's draft)
- KR: Atlas achieves NPS ≥ 50 within 60 days of public launch
- KR: ≥ 80% of beta users complete week-1 core workflow (email + task creation)
- KR: Feature utilization rate ≥ 60% for research packs within 30 days

## Key Dependencies
- O1 depends on Oct 10 feature freeze (engineering)
- O2 depends on Meridian contract signature by Sept 30
- O3 depends on JD approvals by Sept 12

## Risks to Flag in Exec Presentation
1. Meridian contract delay could push O2 ARR targets
2. BrightWave pricing pressure may affect new logo win rates
3. Engineering hiring delays (2/4 Q3 roles not filled) carry into Q4`,
    bodyText: 'Q4 OKR planning notes including product KRs, dependencies, and risks.',
    tags: ['q4-planning', 'okr'],
    isPinned: false,
    isArchived: false,
    color: null,
    createdAt: '2026-09-09T16:00:00Z',
    updatedAt: '2026-09-09T16:30:00Z',
    linkedEmailId: 'email-004',
    attachments: [],
    wordCount: 186,
    createdByAI: false,
  },
  {
    id: 'note-007',
    title: 'Investor Call Prep — September 17th',
    bodyMarkdown: `# Investor Call Prep — Sept 17, 2026
**Attendees:** Sarah Chen, Amanda Foster (Sequoia), David Chen (Horizon)
**Format:** 15 slides + 1-page metrics summary

## Slide Outline
1. Company overview (1 slide)
2. Q3 financial performance — ARR $8.4M, 14% MoM growth (2 slides)
3. Customer highlights — NPS 61, 0 churn, key wins (1 slide)
4. Project Atlas update — status, timeline, beta feedback (4 slides)
5. Q4 go-to-market — Meridian, Cascade demo, APAC trip (3 slides)
6. Series B use of funds (2 slides)
7. Q&A (no slide needed)

## 1-Page Metrics to Prepare
- ARR: $8.4M (as of Aug 31)
- NRR (Net Revenue Retention): ~118% (estimate)
- CAC: ~$8,200 enterprise, ~$2,100 SMB (estimate)
- LTV: ~$96,000 enterprise (estimate)
- Gross margin: ~73% (estimate)
- Burn multiple: 1.4x

## Talking Points — Amanda's Strategic Asks
1. Enterprise security roadmap — SOC 2 Type II by Q1 2027, exploring FedRAMP
2. Vertical focus confirmed: healthcare (Meridian) and fintech (Cascade Financial)
3. Developer platform roadmap: API + marketplace planned for H2 2027`,
    bodyText: 'Preparation notes for September 17th Series B investor call with Sequoia and Horizon Ventures.',
    tags: ['series-b', 'investor', 'prep'],
    isPinned: false,
    isArchived: false,
    color: '#F4B400',
    createdAt: '2026-09-09T21:00:00Z',
    updatedAt: '2026-09-10T07:00:00Z',
    linkedResearchPackId: 'rp-003',
    linkedEventId: 'event-005',
    attachments: [],
    wordCount: 255,
    createdByAI: false,
  },
  {
    id: 'note-008',
    title: 'APAC Expansion — Market Research Snippets',
    bodyMarkdown: `# APAC Expansion Research Notes

## Market Sizing
- Total APAC enterprise software market: ~$210B by 2027 (IDC)
- Productivity software segment in APAC: $12B TAM
- Singapore enterprise market: well-penetrated, high WTP, English-language

## Singapore — Priority Market
- PDPA 2012 (amended 2021) — compatible with GDPR posture
- Mandatory breach notification: within 3 days
- EDB market entry grants: up to S$200K
- Sophie's network: 3 warm intros confirmed (DBS, Changi, GIC)
- Regulatory: no localization requirement for SaaS

## Australia — Secondary Market
- Privacy Act + APP — evolving data localization rules
- Cross-border transfer rules uncertain (proposed reforms in progress)
- Recommend local counsel before go-live
- Market size: ~2x Singapore

## Japan — Long-Term
- APPI 2022: explicit opt-in consent for sensitive data
- Requires localization (Japanese language UI, local entity)
- Timeline: 18+ months
- Highest revenue potential of three markets

## Hiring Plan (from Sophie's proposal)
- Year 1: 1 regional sales director (Singapore-based)
- Year 2: Add 2 pre-sales engineers and 1 customer success manager
- Compensation: ~$180K-$220K USD equivalent

## Investment Required
- Entity formation + legal: ~$120K
- Year 1 payroll (Singapore hire): ~$220K
- Marketing and travel: ~$100K
- Subtotal Year 1: ~$440K
- 3-year total (Sophie's estimate): $1.2M`,
    bodyText: 'APAC expansion market research notes covering Singapore, Australia, and Japan opportunities.',
    tags: ['apac', 'expansion', 'research'],
    isPinned: false,
    isArchived: false,
    color: null,
    createdAt: '2026-09-05T09:00:00Z',
    updatedAt: '2026-09-08T15:00:00Z',
    linkedResearchPackId: 'rp-008',
    linkedContactId: 'contact-014',
    attachments: [],
    wordCount: 291,
    createdByAI: false,
  },
  {
    id: 'note-009',
    title: 'Vertex Labs Due Diligence — Open Items Tracker',
    bodyMarkdown: `# Vertex Labs Acquisition — Due Diligence Open Items

## Completed
- [x] Technical architecture Q&A (23 questions, all answered)
- [x] SOC 2 Type II report received (valid through March 2027)
- [x] AWS infrastructure review — compatible with TechCorp requirements
- [x] ML model IP ownership confirmed — proprietary data only

## Open Items
- [ ] DR (Disaster Recovery) RTO: 4-hour target, not formally tested → Vertex to complete DR drill by year-end
- [ ] Employee contracts review (23 employees with retention packages) → legal ETA Sept 20
- [ ] IP assignment agreements — 2 of 23 employees missing signed copies
- [ ] Revenue recognition audit — pending from Vertex's auditors
- [ ] LOI comments due to legal → **Sept 15**

## LOI Key Terms (to confirm)
- Acquisition price: $18M (80% cash, 20% TechCorp stock)
- Exclusivity: 45 days
- All 23 employees: 2-year retention packages
- Expected closing: Dec 31, 2026

## Contact
Daniel Park, CTO — d.park@vertexlabs.io — responsive via email`,
    bodyText: 'Vertex Labs acquisition due diligence open items tracker and LOI key terms.',
    tags: ['vertex', 'acquisition', 'due-diligence'],
    isPinned: false,
    isArchived: false,
    color: null,
    createdAt: '2026-09-07T09:00:00Z',
    updatedAt: '2026-09-09T11:00:00Z',
    linkedResearchPackId: 'rp-004',
    linkedEmailId: 'email-006',
    linkedContactId: 'contact-003',
    attachments: [],
    wordCount: 214,
    createdByAI: false,
  },
  {
    id: 'note-010',
    title: 'Atlas Beta Feedback Synthesis — Round 1',
    bodyMarkdown: `# Atlas Closed Beta — Feedback Synthesis (Week 1)

## Participating Customers
- NovaCare Systems (15 users, 1 week in)

## Top Loved Features
1. **Research packs** — "game changer" (Head of Operations, NovaCare)
2. **Email AI summaries** — significant inbox time reduction
3. **Calendar integration** — "seamless"

## Top Improvement Requests
| # | Request | Frequency | Priority |
|---|---------|-----------|----------|
| 1 | Bulk task assignment | High | Should-have |
| 2 | Custom notification rules per project | Medium | Nice-to-have |
| 3 | Export to CSV for board reporting | Medium | Should-have |

## No P0 or P1 Bugs Reported (Week 1)

## Qualitative Themes
- Users appreciate research packs for "bringing context together"
- Some confusion about how to link emails to tasks — onboarding improvement needed
- Mobile experience praised but a few layout issues on smaller phones

## Next Steps
- Case study interview with NovaCare Head of Operations (Tom Weston scheduling)
- Collect week-2 feedback via in-app survey
- Add bulk task assignment to Atlas v1.1 backlog`,
    bodyText: 'Synthesis of Atlas closed beta feedback from NovaCare Systems (Week 1).',
    tags: ['project-atlas', 'beta', 'feedback'],
    isPinned: false,
    isArchived: false,
    color: '#0F9D58',
    createdAt: '2026-09-09T17:00:00Z',
    updatedAt: '2026-09-09T17:30:00Z',
    linkedResearchPackId: 'rp-001',
    linkedEmailId: 'email-035',
    attachments: [],
    wordCount: 231,
    createdByAI: true,
  },
  {
    id: 'note-011',
    title: '2027 Product Strategy — Early Ideas',
    bodyMarkdown: `# 2027 Product Strategy — Brainstorm Notes

## Amanda Foster's Input (from investor email)
- FedRAMP certification for government vertical
- Developer API + marketplace (H2 2027)
- Deepen healthcare and fintech vertical features

## Ideas from Internal Brainstorm (not vetted)
- Atlas AI assistant with proactive nudges ("You have a meeting with Marcus in 1 hour — here's a briefing")
- Auto-draft email responses based on research pack context
- Real-time co-editing of notes in research packs
- Slack integration for research pack updates (connect to Slack threads)
- Public API for third-party integrations (Salesforce, HubSpot, Jira)

## Market Opportunities
- TAM analysis suggests $12B market by 2028 (from Raj's research)
- Government vertical: FedRAMP could unlock $50M+ TAM
- APAC expansion: Singapore beachhead → Australia/Japan in 2028

## Questions to Resolve Before 2027 Planning
1. Do we stay horizontal (all verticals) or go deep on healthcare + fintech?
2. Platform play (API/marketplace) — build or partner?
3. Series B capital — how much allocated to 2027 engineering headcount?`,
    bodyText: 'Early brainstorm notes for 2027 product strategy including vertical focus and platform opportunities.',
    tags: ['strategy', 'roadmap', '2027'],
    isPinned: false,
    isArchived: false,
    color: null,
    createdAt: '2026-09-04T20:00:00Z',
    updatedAt: '2026-09-08T09:00:00Z',
    linkedEmailId: 'email-027',
    attachments: [],
    wordCount: 218,
    createdByAI: false,
  },
  {
    id: 'note-012',
    title: 'Engineering Hiring — Role Requirements',
    bodyMarkdown: `# Engineering Hiring Drive — Role Requirements

## Open Roles (Q4 2026)
1. **Staff Backend Engineer** (22 applicants in pipeline)
2. **Senior Frontend Engineer** (14 applicants in pipeline)
3. **Senior QA/Reliability Engineer** (to be posted)

## Key Decisions Pending from Sarah
- Remote work policy: fully remote or hybrid (2-3 days in SF)?
- Domain preference for Staff BE: fintech experience or healthcare data experience?

## Must-Have Skills (all roles)
- 5+ years professional software engineering
- Cloud-native experience (AWS preferred)
- Strong systems design skills

## Staff Backend Engineer — Nice-to-Have
- HL7 FHIR or healthcare data integration experience (given Meridian partnership)
- High-scale API development (10K+ concurrent connections)
- Python or Go

## Senior Frontend Engineer — Must-Have
- React 18+ expert
- Accessibility (WCAG 2.1 AA) experience
- Design systems / component library experience

## Timeline
- JDs approved: Sept 12 (pending Sarah's input)
- JDs posted: Sept 15
- Interviews: Sept 22 – Oct 10
- Offers: Oct 15
- Start dates: Nov 1 or Nov 15`,
    bodyText: 'Engineering hiring requirements for Q4 2026 open roles.',
    tags: ['hiring', 'engineering'],
    isPinned: false,
    isArchived: false,
    color: null,
    createdAt: '2026-09-08T10:00:00Z',
    updatedAt: '2026-09-08T10:00:00Z',
    linkedResearchPackId: 'rp-007',
    linkedEmailId: 'email-012',
    attachments: [],
    wordCount: 212,
    createdByAI: false,
  },
  {
    id: 'note-013',
    title: 'ML Recommendation Engine — Product Decisions',
    bodyMarkdown: `# ML Recommendation Engine — Product Decisions Needed

## Context
Raj's model v2 shows 18% CTR improvement in offline evaluation. Ready to launch A/B test framework.

## Decision 1: Personalization Signals
**Options:**
- Email open patterns (currently in pipeline)
- Calendar event density / busyness score
- Task completion rate
- Research pack engagement
- Contact interaction frequency

**Recommendation:** Start with email opens + calendar density (already in pipeline), add task signals in v1.1 (3 weeks extra scope).

## Decision 2: Cold-Start Strategy
**Options:**
A. Use industry benchmarks (e.g., productivity patterns from aggregate research)
B. Self-select during onboarding (user picks interest areas)
C. Hybrid: onboarding self-select + behavioral learning after 7 days

**Recommendation:** Option C (hybrid) — best UX without sacrificing quality.

## Decision 3: Task Pipeline Scope
- Adding tasks to the pipeline = **3 additional weeks** of work
- Recommend deferring to v1.1 to protect October feature freeze

## Summary of Decisions
| # | Decision | Recommendation |
|---|----------|----------------|
| 1 | Signals | Email + calendar (v1.0), tasks (v1.1) |
| 2 | Cold-start | Hybrid onboarding + behavioral |
| 3 | Task pipeline | Defer to v1.1 |`,
    bodyText: 'Product decisions needed for ML recommendation engine implementation.',
    tags: ['product', 'ml', 'project-atlas'],
    isPinned: false,
    isArchived: false,
    color: null,
    createdAt: '2026-09-06T16:30:00Z',
    updatedAt: '2026-09-09T10:00:00Z',
    linkedEmailId: 'email-015',
    linkedContactId: 'contact-013',
    attachments: [],
    wordCount: 245,
    createdByAI: false,
  },
  {
    id: 'note-014',
    title: 'Q3 Retrospective — Lessons Learned',
    bodyMarkdown: `# Q3 2026 OKR Retrospective — Key Lessons

## Overall Attainment: 71% (above 70% stretch target)

## What Worked Well
- ARR growth: exceeded target by 8%
- Product delivery: 4/5 features shipped on time
- NPS: 42 → 58 (significant improvement)
- Engineering execution: sprint velocity consistently above target
- Customer retention: 0 churn this quarter

## What Missed
- Engineering hiring: 2/4 roles filled (market is very competitive)
- International pipeline: ~$800K behind plan
- Research pack adoption: below internal targets for beta period

## Root Causes (Hiring Miss)
- JD requirements too narrow (fintech-only, missed candidates with adjacent skills)
- Compensation band uncompetitive with FAANG-adjacent companies
- Interview process too long (avg 6 weeks — candidates accepting elsewhere)

## Root Causes (International Miss)
- No local presence in any market
- Product not localized
- APAC expansion still in planning stage

## Lessons to Apply in Q4
1. Broaden hiring JD requirements immediately
2. Increase comp bands by 10–15%
3. Accelerate APAC strategy — Singapore entity by Q1 2027
4. Set lower international pipeline targets until APAC is established`,
    bodyText: 'Q3 2026 OKR retrospective with lessons learned and actions for Q4.',
    tags: ['q3-review', 'retrospective', 'lessons-learned'],
    isPinned: false,
    isArchived: false,
    color: null,
    createdAt: '2026-09-03T10:00:00Z',
    updatedAt: '2026-09-05T11:30:00Z',
    linkedResearchPackId: 'rp-006',
    linkedEmailId: 'email-021',
    attachments: [],
    wordCount: 241,
    createdByAI: false,
  },
  {
    id: 'note-015',
    title: 'Acme Corp — Account Strategy',
    bodyMarkdown: `# Acme Corp — Account Strategy Notes

## Current State
- Seats: 45
- Contract expires: January 31, 2027
- User sentiment: Very positive (6 hrs/user/week saved)
- NPS: Not measured individually, assumed high

## Renewal Goals
- Expand to 120 seats
- Volume discount structure needed
- Atlas beta access (Tier 1 — already nominated)
- Dedicated CSM

## Pricing Strategy
| Seats | Current Rate | Proposed Volume Rate |
|-------|-------------|---------------------|
| 1–50  | $290/seat | $290/seat |
| 51–100 | $290/seat | $240/seat |
| 101–150 | $290/seat | $210/seat |

Potential ARR impact: 120 seats × $210 = **$252K ARR** (vs current 45 × $290 = $130.5K ARR)
Net ARR increase: **+$121.5K**

## Risks
- Marcus wants renewal by Dec 1 — tight timeline with legal
- Dedicated CSM: need to confirm CS team capacity
- Atlas beta: Meridian contract signature may affect Acme inclusion (both can't have full white-glove)

## Sarah's Next Step
- Schedule renewal call with Marcus by Sept 19
- Loop in Tom Weston and CS lead`,
    bodyText: 'Acme Corp renewal account strategy notes including pricing model and next steps.',
    tags: ['acme', 'renewal', 'account-strategy'],
    isPinned: false,
    isArchived: false,
    color: null,
    createdAt: '2026-09-06T09:00:00Z',
    updatedAt: '2026-09-09T12:00:00Z',
    linkedEmailId: 'email-016',
    linkedContactId: 'contact-001',
    attachments: [],
    wordCount: 220,
    createdByAI: false,
  },
  {
    id: 'note-016',
    title: 'Atlas Architecture Decisions — Summary',
    bodyMarkdown: `# Atlas v1.0 Architecture Decisions

## Decision 1: Notification System — WebSocket vs SSE
**Context:** Maintaining persistent WebSocket connections for 10K+ concurrent users is expensive.
**Decision:** Use **Server-Sent Events (SSE)** for v1.0 (simpler, lower infrastructure cost).
**Trade-off:** SSE is one-directional; client-to-server actions use REST.

## Decision 2: Offline Mode
**Context:** Full offline requires 3 additional weeks. Read-only cache is already 80% complete.
**Decision:** **Read-only offline cache** for v1.0. Full offline in v1.1.
**Note:** Must add a clear "You're offline — read-only mode" indicator in UI.

## Decision 3: Push Notification Provider
**Decision:** **Firebase Cloud Messaging (FCM)** for v1.0 (supports web push + Android; iOS support via APNs bridge).
**Rationale:** Single SDK, free tier sufficient for initial scale.

## Decision 4: Data Retention
**Decision:** **90-day default** for inactive users, configurable up to 365 days for enterprise tier.
**GDPR compliance:** Add data deletion workflow for user requests.

## Decision 5: Language Support
**Decision:** **English only** for v1.0. Spanish + French in v1.1 (by Meridian go-live date).

_Recorded September 10, 2026 — approved by Sarah Chen and James Okafor_`,
    bodyText: 'Summary of Atlas v1.0 architecture decisions covering notifications, offline mode, push notifications, data retention, and language support.',
    tags: ['project-atlas', 'architecture', 'decisions'],
    isPinned: true,
    isArchived: false,
    color: '#4285F4',
    createdAt: '2026-09-10T11:00:00Z',
    updatedAt: '2026-09-10T11:00:00Z',
    linkedResearchPackId: 'rp-001',
    linkedEmailId: 'email-037',
    attachments: [],
    wordCount: 267,
    createdByAI: false,
  },
  {
    id: 'note-017',
    title: 'Singapore Trip — Meeting Briefing Notes',
    bodyMarkdown: `# Singapore Trip — Oct 14–17, 2026

## Meeting 1: DBS Bank
**Date:** Oct 14, 10AM SGT
**Attendees:** Sarah Chen, Sophie Laurent + DBS IT leadership team
**Goal:** Introduce TechCorp Atlas, understand DBS's enterprise productivity pain points
**Key Talking Points:**
- Data governance story (SOC 2, HIPAA posture)
- Research packs for investment team workflow
- Enterprise security and compliance roadmap
**DBS Context:** Largest bank in Southeast Asia. IT transformation budget ~S$400M annually.

## Meeting 2: Changi Airport Group (CAG)
**Date:** Oct 15, 2PM SGT
**Goal:** Digital transformation team — productivity tools evaluation
**CAG Context:** Manages Changi Airport operations. ~1,800 management-level staff who could use Atlas.

## Meeting 3: GIC Private Limited
**Date:** Oct 16, 11AM SGT
**Goal:** Ops efficiency focus — GIC manages Singapore's sovereign wealth fund
**GIC Context:** Highly regulated, security requirements will be strict. Research pack angle for investment research workflows.

## EDB Dinner (Oct 14 evening)
**Goal:** Market entry grant discussion (up to S$200K available)
**EDB Context:** Singapore Economic Development Board — facilitates market entry for foreign tech companies.

## General Prep
- Bring printed one-pagers (Singapore business culture appreciates physical materials)
- Research each company's recent news before each meeting
- Arrive 10 min early — punctuality is very important in Singapore business culture`,
    bodyText: 'Meeting briefing notes for Singapore business trip October 14-17, 2026.',
    tags: ['apac', 'singapore', 'travel', 'briefing'],
    isPinned: false,
    isArchived: false,
    color: null,
    createdAt: '2026-09-10T14:00:00Z',
    updatedAt: '2026-09-10T14:00:00Z',
    linkedResearchPackId: 'rp-008',
    linkedEventId: 'event-014',
    attachments: [],
    wordCount: 285,
    createdByAI: false,
  },
  {
    id: 'note-018',
    title: 'Board Meeting — Product Section Draft',
    bodyMarkdown: `# Board Meeting Product Section — Draft
*Q3 2026 Board Meeting, October 2nd*

## 1. Q3 Product Highlights
- 4 of 5 roadmap features shipped on time
- Research packs closed beta launched (NovaCare, positive feedback)
- Atlas component library v1.0 released — design system complete
- NPS improved from 42 (Q2) to 58 (Q3)
- Feature adoption: Email 89%, Calendar 76%, Tasks 62%, Notes 41%

## 2. Project Atlas Status
- **Overall status:** On track ✅
- Feature freeze: October 10th (no changes planned)
- Beta UAT kickoff: October 20th (5 customers, 50 users confirmed)
- Public launch: November 15th
- Key risks: Meridian API sandbox delay (resolved by Oct 5), notification system technical decisions (resolved Sept 15)

## 3. Q4 Roadmap
- October: Feature freeze, beta UAT
- November: Public launch + freemium tier
- December: Meridian integration go-live (Dec 10), Series B close (Dec 31)

## 4. Key Risks & Mitigations
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Meridian delay | Medium | High | Hard Dec 10 deadline with escalation path |
| BrightWave competition | High | Medium | Accelerate launch, update positioning |
| Engineering hiring | Medium | Medium | Broader JDs, increased comp bands |`,
    bodyText: 'Draft content for board meeting product and engineering section.',
    tags: ['board', 'q4-planning', 'product'],
    isPinned: false,
    isArchived: false,
    color: null,
    createdAt: '2026-09-10T15:00:00Z',
    updatedAt: '2026-09-10T15:00:00Z',
    linkedEmailId: 'email-039',
    linkedEventId: 'event-011',
    attachments: [],
    wordCount: 256,
    createdByAI: false,
  },
  {
    id: 'note-019',
    title: 'AI Research Snippet — Enterprise Productivity Market 2026',
    bodyMarkdown: `# AI Research — Enterprise Productivity Market 2026
*Generated by AI assistant from web search — Sept 9, 2026*

## Market Size
- Global enterprise productivity software market: $52B in 2026, growing at 14% CAGR
- AI-enhanced productivity tools: $8.2B segment, growing at 38% CAGR
- Enterprise AI adoption: 67% of Fortune 500 have at least one AI productivity pilot (Gartner 2026)

## Key Trends
1. **AI-first UX**: Users increasingly expect proactive AI assistance (not just reactive search)
2. **Context aggregation**: "Information silos" are the #1 productivity complaint in enterprise surveys
3. **Data governance**: Security and compliance are now the primary purchase blockers for enterprise
4. **Vertical specialization**: Healthcare, fintech, and legal are paying premium for vertical-specific features

## TechCorp Positioning Takeaways
- Research packs directly address "information silos" pain point — strong product-market fit signal
- Data governance story (HIPAA, SOC 2) is a meaningful differentiator in current market
- Atlas's integrated email+calendar+task+AI approach aligns with "AI-first UX" trend

## Sources
- Gartner Magic Quadrant for Enterprise Productivity Platforms (August 2026)
- IDC MarketScape: AI-Powered Collaboration Tools 2026
- McKinsey Global Survey: The State of AI in Enterprise (July 2026)`,
    bodyText: 'AI-generated research snippet on enterprise productivity market trends for 2026.',
    tags: ['research', 'market-analysis', 'ai-generated'],
    isPinned: false,
    isArchived: false,
    color: null,
    createdAt: '2026-09-09T12:00:00Z',
    updatedAt: '2026-09-09T12:00:00Z',
    linkedResearchPackId: 'rp-005',
    attachments: [],
    wordCount: 257,
    createdByAI: true,
  },
  {
    id: 'note-020',
    title: 'Engineering Velocity & Team Health — Sept 10 Snapshot',
    bodyMarkdown: `# Engineering Team Health — September 10 Snapshot

## Project Atlas Velocity
- Sprint 18: 48 story points (target: 45) ✅
- Cumulative velocity (last 8 sprints): avg 44 story points
- API completion: 87%
- Frontend: Dashboard ✅, Settings (in review), Mobile (60%)
- ML: Model v2 trained ✅, A/B framework ready ✅

## Current Blockers
1. **Staging environment instability** — Raj's team investigating, ETA Sept 11
2. **Meridian API credentials** — Rachel Kim follow-up needed (Sarah to chase)
3. **Architecture decisions** — 3 open items, decision needed by Sept 15

## Team Morale
- High (per Kevin's standup notes and 1:1 feedback)
- 0 departures or flight risk signals in last 30 days
- 4 open headcount positions still creating capacity pressure

## Upcoming Milestones
| Milestone | Target Date | Status |
|-----------|------------|--------|
| Feature freeze | Oct 10 | On track |
| Beta UAT start | Oct 20 | On track |
| Meridian sandbox ready | Oct 5 | Dependent on Meridian |
| Public launch | Nov 15 | On track |`,
    bodyText: 'Engineering team health and velocity snapshot for September 10, 2026.',
    tags: ['engineering', 'team-health', 'project-atlas'],
    isPinned: false,
    isArchived: false,
    color: null,
    createdAt: '2026-09-10T09:30:00Z',
    updatedAt: '2026-09-10T09:30:00Z',
    linkedResearchPackId: 'rp-001',
    linkedEmailId: 'email-009',
    attachments: [],
    wordCount: 212,
    createdByAI: true,
  },
];
