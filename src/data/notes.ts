import type { Note } from '@/types/index';

export const mockNotes: Note[] = [
  {
    id: 'note-001',
    title: 'Partnership Proposal — Key Points & Questions',
    bodyMarkdown: `## Key Points from Marcus's Proposal

- Revenue share: **20/80** (us/them) for first 12 months, then renegotiate
- Integration timeline: **8 weeks** (assumes our API is stable)
- Pilot period: **3 months** with 5 enterprise clients
- Exclusivity clause: 90-day window for APAC region

## Open Questions

1. What happens if integration slips beyond 8 weeks — who bears the cost?
2. Is the 20/80 split gross or net of infrastructure costs?
3. Which 5 enterprise clients are they proposing for the pilot?

## Action Items

- [ ] Draft reply email with these questions
- [ ] Review exclusivity clause with legal before responding
- [ ] Share with James for engineering feasibility check`,
    bodyText: "Key Points from Marcus's Proposal\n\nRevenue share: 20/80 for first 12 months. Integration timeline: 8 weeks. Pilot period: 3 months with 5 enterprise clients.",
    tags: ['partnership', 'acme', 'business'],
    isPinned: true,
    isArchived: false,
    color: '#6366f1',
    createdAt: '2026-09-08T10:00:00Z',
    updatedAt: '2026-09-09T09:00:00Z',
    linkedEmailId: 'email-001',
    wordCount: 142,
    createdByAI: false,
  },
  {
    id: 'note-002',
    title: 'Q4 Product Launch — Pricing Page Redesign Ideas',
    bodyMarkdown: `## Redesign Goals

- Simplify the three-tier structure (Free / Pro / Enterprise)
- Add a live **comparison table** mid-page
- Highlight the Pro tier with a visual badge and testimonial

## Copy Ideas

- Hero headline: *"Everything you need. Nothing you don't."*
- CTA: *"Start free — upgrade when ready"*
- Add social proof: quote from Marcus Rivera (Acme Corp) near CTA

## Design Notes

- Use bold dividers between tiers
- Mobile-first layout — most conversions from mobile
- Color: use accent purple for Pro tier highlight`,
    bodyText: 'Q4 Product Launch — Pricing Page Redesign Ideas. Simplify three-tier structure. Add comparison table. Highlight Pro tier.',
    tags: ['marketing', 'design', 'q4', 'launch'],
    isPinned: false,
    isArchived: false,
    color: null,
    createdAt: '2026-09-07T14:00:00Z',
    updatedAt: '2026-09-07T14:30:00Z',
    wordCount: 98,
    createdByAI: false,
  },
  {
    id: 'note-003',
    title: 'Meeting Recap — Product Roadmap Session (Sep 5)',
    bodyMarkdown: `## Attendees
Sarah Chen, James Okafor, Natalie Brooks, Kevin Zhao, Raj Patel

## Decisions Made

1. **Auth v2** ships in October — Natalie to finalize designs by Sep 20
2. **Mobile app** delayed to Q1 2027 — dependency on API stability
3. **EU Launch Campaign** — Olivia Hartman to lead; budget approved

## Blockers

- ML recommendation engine needs infra upgrade (Raj to open ticket)
- Design system tokens not finalized (blocking Natalie)

## Next Steps

- [ ] James: engineering estimate for Auth v2 by Sep 12
- [ ] Sarah: share roadmap deck with investors before Sep 15
- [ ] Natalie: design review for Auth v2 on Sep 20`,
    bodyText: 'Meeting Recap — Product Roadmap Session Sep 5. Decisions: Auth v2 in October, mobile app to Q1 2027, EU launch campaign approved.',
    tags: ['product', 'meeting', 'recap'],
    isPinned: true,
    isArchived: false,
    color: '#f59e0b',
    createdAt: '2026-09-05T16:00:00Z',
    updatedAt: '2026-09-05T16:45:00Z',
    linkedEventId: 'event-001',
    wordCount: 118,
    createdByAI: false,
  },
  {
    id: 'note-004',
    title: 'APAC Expansion Research — Initial Thoughts',
    bodyMarkdown: `## Markets to Evaluate

1. **Singapore** — strong SaaS adoption, favorable regulatory environment
2. **Japan** — large enterprise market, high willingness to pay
3. **Australia** — English-language, familiar legal framework
4. **India** — massive growth potential, price-sensitive

## Key Questions

- What is our localization cost for Japanese UI?
- Do we need a local entity for Singapore?
- Who is our primary competition in each market?

## Contacts

- Sophie Laurent (APAC Growth Partners) — intro call scheduled for Sep 17
- Need local legal counsel recommendations from Amanda

## Resources

- [APAC SaaS Market Report 2026](https://example.com) — download and add to research pack`,
    bodyText: 'APAC Expansion Research. Markets: Singapore, Japan, Australia, India. Sophie Laurent call scheduled Sep 17.',
    tags: ['apac', 'expansion', 'strategy', 'research'],
    isPinned: false,
    isArchived: false,
    color: '#10b981',
    createdAt: '2026-09-08T13:00:00Z',
    updatedAt: '2026-09-09T11:00:00Z',
    wordCount: 107,
    createdByAI: false,
  },
  {
    id: 'note-005',
    title: 'Books & Resources — AI & Productivity',
    bodyMarkdown: `## Books

- *Superintelligence* — Nick Bostrom (read)
- *Deep Work* — Cal Newport (in progress)
- *The Alignment Problem* — Brian Christian (to read)
- *Thinking in Systems* — Donella Meadows (to read)
- *AI Superpowers* — Kai-Fu Lee (to read)

## Newsletters & Blogs

- [Ben Thompson — Stratechery](https://stratechery.com)
- [The Pragmatic Engineer](https://newsletter.pragmaticengineer.com)
- [AI Breakfast](https://aibreakfast.beehiiv.com)

## Podcasts

- Lex Fridman Podcast (occasional)
- The Knowledge Project — Shane Parrish`,
    bodyText: 'Books & Resources — AI & Productivity. Reading list: Superintelligence, Deep Work, The Alignment Problem, Thinking in Systems.',
    tags: ['personal', 'reading', 'ai', 'learning'],
    isPinned: false,
    isArchived: false,
    color: null,
    createdAt: '2026-08-20T20:00:00Z',
    updatedAt: '2026-09-01T18:00:00Z',
    wordCount: 72,
    createdByAI: false,
  },
  {
    id: 'note-006',
    title: 'AI-Generated Summary: Series B Investor Update',
    bodyMarkdown: `## Summary (AI-generated)

The August investor update reports strong momentum:

- **ARR** up 22% month-over-month — now at $4.8M ARR
- **User retention** at 94% (up from 91% in July)
- **Gross margin** improved to 72% following infrastructure optimisations
- **Pipeline**: 3 enterprise deals in final negotiation stage

### Next Month Focus Areas

1. Close at least 1 enterprise deal
2. Launch Auth v2 for improved onboarding conversion
3. Begin APAC feasibility study`,
    bodyText: 'AI Summary: Series B Investor Update. ARR up 22% MoM to $4.8M. Retention 94%. Gross margin 72%.',
    tags: ['investor', 'series-b', 'ai-generated'],
    isPinned: false,
    isArchived: false,
    color: null,
    createdAt: '2026-09-08T14:30:00Z',
    updatedAt: '2026-09-08T14:30:00Z',
    linkedEmailId: 'email-004',
    wordCount: 89,
    createdByAI: true,
  },
];
