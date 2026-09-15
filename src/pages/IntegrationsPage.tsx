import { useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { BookOpen, House, Images, PlugZap } from 'lucide-react';
import type { Connector, ConnectorType } from '@/types/index';
import { PageHeader } from '@/components/layout/PageHeader';
import { FilterBar } from '@/components/ui/FilterBar';
import type { FilterItem } from '@/components/ui/FilterBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ListSkeleton } from '@/components/ui/LoadingState';
import {
  ConnectorCard,
  connectorOrder,
  isConnectorBusy,
} from '@/components/integrations/ConnectorCard';
import { ConnectorHealthPanel } from '@/components/integrations/ConnectorHealthPanel';
import { ConnectorDetailSheet } from '@/components/integrations/ConnectorDetailSheet';
import { useConnectorStore } from '@/store/connectorStore';
import { cn } from '@/lib/utils';
import * as t from '@/lib/theme';

// =============================================================================
// Filters
// =============================================================================

type ViewFilter = 'all' | 'connected' | 'attention' | 'available';

const FILTERS: { id: ViewFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'connected', label: 'Connected' },
  { id: 'attention', label: 'Needs attention' },
  { id: 'available', label: 'Available' },
];

function matchesFilter(connector: Connector, filter: ViewFilter): boolean {
  switch (filter) {
    case 'connected':
      return ['connected', 'syncing'].includes(connector.status);
    case 'attention':
      return connector.status === 'expired' || connector.status === 'error';
    case 'available':
      return ['disconnected', 'connecting', 'oauth_consent', 'authorising'].includes(
        connector.status,
      );
    case 'all':
    default:
      return true;
  }
}

// =============================================================================
// Simulated, non-OAuth modules
//
// These are product surfaces that exist in the demo but have no provider to
// authorise against — they are always on, and labelled as simulated so nobody
// mistakes them for a live integration.
// =============================================================================

interface SimulatedModule {
  id: string;
  label: string;
  description: string;
  detail: string;
  icon: LucideIcon;
}

const SIMULATED_MODULES: SimulatedModule[] = [
  {
    id: 'local-files',
    label: 'Local Photos & Files',
    description: 'On-device photos and documents Busy.me can attach to tasks and emails.',
    detail: '128 files indexed · 12 photos this week',
    icon: Images,
  },
  {
    id: 'knowledge-bases',
    label: 'Knowledge Bases',
    description: 'Research packs and saved notes the assistant reads before answering.',
    detail: '4 packs · 62 sources indexed',
    icon: BookOpen,
  },
  {
    id: 'rental-properties',
    label: 'Rental Properties',
    description: 'Tenancies, rent dates and maintenance jobs tracked alongside your inbox.',
    detail: '2 properties · next rent due 1 Oct',
    icon: House,
  },
];

// =============================================================================
// Pieces
// =============================================================================

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className={cn('px-1', t.label)}>{title}</h2>
      {description && <p className={cn('mt-0.5 px-1', t.meta)}>{description}</p>}
      <div className={cn('mt-2', t.listGap)}>{children}</div>
    </section>
  );
}

function SimulatedModuleCard({ module }: { module: SimulatedModule }) {
  const Icon = module.icon;
  return (
    <div className={cn('flex items-start gap-3 bg-white p-4', t.border, t.radius)}>
      <span
        aria-hidden="true"
        className={cn(
          'flex h-10 w-10 flex-shrink-0 items-center justify-center bg-gray-100 text-gray-500',
          t.radius,
        )}
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className={cn('truncate', t.title)}>{module.label}</h3>
          <span className="flex flex-shrink-0 items-center gap-1.5">
            <span aria-hidden="true" className={cn('h-1.5 w-1.5 rounded-full', t.statusDot.neutral)} />
            <span className={t.meta}>Simulated</span>
          </span>
        </div>
        <p className={cn('mt-1 leading-relaxed', t.body)}>{module.description}</p>
        <p className={cn('mt-1.5', t.meta)}>{module.detail}</p>
      </div>
    </div>
  );
}

// =============================================================================
// Page
// =============================================================================

const EMAIL_CONNECTORS: ConnectorType[] = ['gmail', 'google-calendar', 'outlook'];
const MESSAGING_CONNECTORS: ConnectorType[] = ['slack'];

export default function IntegrationsPage() {
  const connectors = useConnectorStore((s) => s.connectors);
  const isLoading = useConnectorStore((s) => s.isLoading);
  const error = useConnectorStore((s) => s.error);
  const fetchConnectors = useConnectorStore((s) => s.fetchConnectors);

  const [filter, setFilter] = useState<ViewFilter>('all');
  const [detailType, setDetailType] = useState<ConnectorType | null>(null);

  useEffect(() => {
    void fetchConnectors();
  }, [fetchConnectors]);

  const counts = useMemo(
    () =>
      FILTERS.reduce<Record<string, number>>((acc, { id }) => {
        acc[id] = connectorOrder.filter((type) => matchesFilter(connectors[type], id)).length;
        return acc;
      }, {}),
    [connectors],
  );

  const filterItems: FilterItem[] = useMemo(
    () => FILTERS.map(({ id, label }) => ({ id, label, count: counts[id] ?? 0 })),
    [counts],
  );

  // A connector mid-flow always stays on screen, whatever the filter says —
  // otherwise switching filters could unmount the card owning the consent
  // screen and strand the connect journey half-finished.
  const visible = (types: ConnectorType[]) =>
    types.filter(
      (type) => isConnectorBusy(connectors[type]) || matchesFilter(connectors[type], filter),
    );

  const emailVisible = visible(EMAIL_CONNECTORS);
  const messagingVisible = visible(MESSAGING_CONNECTORS);
  const hasVisibleConnectors = emailVisible.length + messagingVisible.length > 0;

  const connectedCount = connectorOrder.filter((type) =>
    ['connected', 'syncing'].includes(connectors[type].status),
  ).length;

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Integrations"
        subtitle={`${connectedCount} of ${connectorOrder.length} connected`}
        showBack
      />

      <div className="flex-shrink-0 border-b border-gray-100 bg-white px-4 pb-3 pt-2">
        <FilterBar
          filters={filterItems}
          active={filter}
          onChange={(id) => setFilter(id as ViewFilter)}
          aria-label="Connector filters"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 pt-3">
        {isLoading ? (
          <ListSkeleton count={4} showAvatar />
        ) : error ? (
          <ErrorState
            title="Could not load integrations"
            description="Your connectors could not be reached. Check your connection and try again."
            detail={error}
            onRetry={() => void fetchConnectors()}
          />
        ) : (
          <div className={t.sectionGap}>
            {hasVisibleConnectors ? (
              <>
                {emailVisible.length > 0 && (
                  <Section
                    title="Email & Calendar"
                    description="Mail and calendar accounts Busy.me reads to triage your day."
                  >
                    {emailVisible.map((type) => (
                      <ConnectorCard
                        key={type}
                        connector={connectors[type]}
                        onOpenDetails={setDetailType}
                      />
                    ))}
                  </Section>
                )}

                {messagingVisible.length > 0 && (
                  <Section
                    title="Messaging"
                    description="Chat workspaces that feed requests into your task list."
                  >
                    {messagingVisible.map((type) => (
                      <ConnectorCard
                        key={type}
                        connector={connectors[type]}
                        onOpenDetails={setDetailType}
                      />
                    ))}
                  </Section>
                )}
              </>
            ) : (
              <EmptyState
                icon={<PlugZap />}
                title="No matching connectors"
                description={
                  filter === 'attention'
                    ? 'Every connector is healthy — nothing needs your attention right now.'
                    : 'No connector matches this filter. Show all to see the full list.'
                }
                action={{ label: 'Show all', onClick: () => setFilter('all') }}
              />
            )}

            <Section
              title="Other modules"
              description="Always-on demo modules — no provider sign-in required."
            >
              {SIMULATED_MODULES.map((module) => (
                <SimulatedModuleCard key={module.id} module={module} />
              ))}
            </Section>

            <Section title="Connector health">
              <ConnectorHealthPanel />
            </Section>
          </div>
        )}
      </div>

      <ConnectorDetailSheet
        type={detailType}
        open={detailType !== null}
        onClose={() => setDetailType(null)}
      />
    </div>
  );
}
