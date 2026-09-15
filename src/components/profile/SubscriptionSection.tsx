import { useState } from 'react';
import { Check, ExternalLink, Minus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useSettingsStore } from '@/store/settingsStore';
import type { BillingCycle, PlanId } from '@/store/settingsStore';
import { useUIStore } from '@/store/uiStore';
import { cn, formatDate } from '@/lib/utils';
import * as t from '@/lib/theme';

// =============================================================================
// Subscription
// =============================================================================

/** Discount applied to every paid tier when billed annually. */
const ANNUAL_DISCOUNT = 0.2;

interface Tier {
  id: PlanId;
  name: string;
  /** Monthly list price in USD. */
  monthlyPrice: number;
  tagline: string;
}

const TIERS: Tier[] = [
  { id: 'free', name: 'Free', monthlyPrice: 0, tagline: 'One inbox, the basics, no AI drafting.' },
  { id: 'pro', name: 'Pro', monthlyPrice: 9, tagline: 'Everything Busy can do, for one person.' },
  {
    id: 'business',
    name: 'Business',
    monthlyPrice: 25,
    tagline: 'Shared research packs and team seats.',
  },
];

interface FeatureRow {
  label: string;
  free: boolean;
  pro: boolean;
  business: boolean;
}

const FEATURES: FeatureRow[] = [
  { label: 'Connected inboxes', free: true, pro: true, business: true },
  { label: 'Tasks, notes and calendar', free: true, pro: true, business: true },
  { label: 'AI drafting and summaries', free: false, pro: true, business: true },
  { label: 'Waiting-on chases', free: false, pro: true, business: true },
  { label: 'Research packs', free: false, pro: true, business: true },
  { label: 'Web research in chat', free: false, pro: true, business: true },
  { label: 'Shared packs and seats', free: false, pro: false, business: true },
  { label: 'Priority support', free: false, pro: false, business: true },
];

function priceFor(tier: Tier, cycle: BillingCycle): number {
  if (tier.monthlyPrice === 0) return 0;
  return cycle === 'annual' ? tier.monthlyPrice * (1 - ANNUAL_DISCOUNT) : tier.monthlyPrice;
}

function formatUsd(value: number): string {
  return value % 1 === 0 ? `$${value}` : `$${value.toFixed(2)}`;
}

const CYCLES: { id: BillingCycle; label: string }[] = [
  { id: 'monthly', label: 'Monthly' },
  { id: 'annual', label: 'Annual · save 20%' },
];

export function SubscriptionSection() {
  const subscription = useSettingsStore((s) => s.subscription);
  const updateSubscription = useSettingsStore((s) => s.updateSubscription);
  const trackEvent = useSettingsStore((s) => s.trackEvent);
  const addToast = useUIStore((s) => s.addToast);

  const [isConfirmingCancel, setConfirmingCancel] = useState(false);

  const currentTier = TIERS.find((tier) => tier.id === subscription.planId) ?? TIERS[0];
  const isPaid = currentTier.monthlyPrice > 0;

  const handleCycleChange = (cycle: BillingCycle) => {
    if (cycle === subscription.billingCycle) return;
    updateSubscription({ billingCycle: cycle });
    trackEvent('settings_change', { setting: 'billing_cycle', value: cycle });
  };

  const handleChoosePlan = (planId: PlanId) => {
    if (planId === subscription.planId) return;
    updateSubscription({ planId, isCancelled: false });
    trackEvent('subscription_start', { plan: planId, cycle: subscription.billingCycle });
    addToast({
      variant: 'success',
      title: 'Plan updated',
      message: `You are now on ${TIERS.find((tier) => tier.id === planId)?.name}.`,
    });
  };

  const handleCancel = () => {
    updateSubscription({ planId: 'free', isCancelled: true });
    trackEvent('subscription_cancel', { from: subscription.planId });
    setConfirmingCancel(false);
    addToast({
      variant: 'info',
      title: 'Subscription cancelled',
      message: 'You have been moved to the Free plan.',
    });
  };

  return (
    <div className={t.sectionGap}>
      {/* ── Current plan ────────────────────────────────────────────────── */}
      <section className={cn(t.border, t.radius, 'p-4')}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={cn(t.label, 'uppercase tracking-wide')}>Current plan</p>
            <p className="mt-1 text-xl font-semibold text-gray-900">{currentTier.name}</p>
          </div>

          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600">
            <span
              aria-hidden="true"
              className={cn(
                'h-2 w-2 rounded-full',
                subscription.isCancelled ? t.statusDot.warning : t.statusDot.success,
              )}
            />
            {subscription.isCancelled ? 'Cancelled' : 'Active'}
          </span>
        </div>

        <dl className="mt-4 flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-3">
            <dt className={t.body}>Billing</dt>
            <dd className="text-sm font-medium capitalize text-gray-900">
              {isPaid ? subscription.billingCycle : 'No charge'}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className={t.body}>
              {subscription.isCancelled ? 'Access ends' : 'Renews'}
            </dt>
            <dd className="text-sm font-medium text-gray-900">
              {formatDate(subscription.renewsAt, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </dd>
          </div>
          {isPaid && (
            <div className="flex items-baseline justify-between gap-3">
              <dt className={t.body}>Price</dt>
              <dd className="text-sm font-medium text-gray-900">
                {formatUsd(priceFor(currentTier, subscription.billingCycle))}/mo
              </dd>
            </div>
          )}
        </dl>
      </section>

      {/* ── Billing cycle ───────────────────────────────────────────────── */}
      <section>
        <h2 className={cn(t.label, 'mb-2 px-1 uppercase tracking-wide')}>Billing cycle</h2>
        <div
          role="radiogroup"
          aria-label="Billing cycle"
          className={cn('grid grid-cols-2 gap-2')}
        >
          {CYCLES.map((cycle) => {
            const isActive = subscription.billingCycle === cycle.id;
            return (
              <button
                key={cycle.id}
                type="button"
                role="radio"
                aria-checked={isActive}
                onClick={() => handleCycleChange(cycle.id)}
                className={cn(
                  'rounded-lg border border-gray-100 px-3 py-3 text-sm font-medium',
                  t.touchTarget,
                  t.pressable,
                  t.focusRing,
                  isActive ? 'bg-gray-900 text-white' : 'bg-white text-gray-600',
                )}
              >
                {cycle.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Tiers ───────────────────────────────────────────────────────── */}
      <section>
        <h2 className={cn(t.label, 'mb-2 px-1 uppercase tracking-wide')}>Plans</h2>
        <div className={t.listGap}>
          {TIERS.map((tier) => {
            const isCurrent = tier.id === subscription.planId;
            const price = priceFor(tier, subscription.billingCycle);

            return (
              <div
                key={tier.id}
                className={cn(t.border, t.radius, 'p-4', isCurrent && 'bg-gray-50')}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      {tier.name}
                      {isCurrent && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500">
                          <span
                            aria-hidden="true"
                            className={cn('h-1.5 w-1.5 rounded-full', t.statusDot.success)}
                          />
                          Current
                        </span>
                      )}
                    </p>
                    <p className={cn(t.meta, 'mt-1 leading-relaxed')}>{tier.tagline}</p>
                  </div>

                  <p className="shrink-0 text-right">
                    <span className="text-lg font-semibold tabular-nums text-gray-900">
                      {formatUsd(price)}
                    </span>
                    <span className={cn(t.meta, 'block')}>
                      {tier.monthlyPrice === 0 ? 'forever' : 'per month'}
                    </span>
                  </p>
                </div>

                {tier.monthlyPrice > 0 && subscription.billingCycle === 'annual' && (
                  <p className={cn(t.meta, 'mt-2')}>
                    {formatUsd(Number((price * 12).toFixed(2)))} billed yearly · 20% off{' '}
                    {formatUsd(tier.monthlyPrice)}/mo
                  </p>
                )}

                {!isCurrent && (
                  <Button
                    fullWidth
                    variant={tier.monthlyPrice > currentTier.monthlyPrice ? 'primary' : 'outline'}
                    size="sm"
                    className="mt-3"
                    onClick={() => handleChoosePlan(tier.id)}
                  >
                    {tier.monthlyPrice > currentTier.monthlyPrice
                      ? `Upgrade to ${tier.name}`
                      : `Switch to ${tier.name}`}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Feature comparison ──────────────────────────────────────────── */}
      <section>
        <h2 className={cn(t.label, 'mb-2 px-1 uppercase tracking-wide')}>What you get</h2>
        <div className={cn(t.border, t.radius, 'overflow-hidden')}>
          <div
            className={cn(
              'grid grid-cols-[1fr_repeat(3,40px)] items-center gap-2 px-3.5 py-2',
              'bg-gray-50 text-[11px] font-semibold uppercase tracking-wide text-gray-500',
            )}
          >
            <span>Feature</span>
            {TIERS.map((tier) => (
              <span key={tier.id} className="text-center">
                {tier.name.slice(0, 3)}
              </span>
            ))}
          </div>

          {FEATURES.map((feature) => (
            <div
              key={feature.label}
              className={cn(
                'grid grid-cols-[1fr_repeat(3,40px)] items-center gap-2 px-3.5 py-2.5',
                t.divider,
              )}
            >
              <span className="min-w-0 text-sm text-gray-700">{feature.label}</span>
              {([feature.free, feature.pro, feature.business] as const).map((included, index) => (
                <span key={TIERS[index].id} className="flex justify-center">
                  {included ? (
                    <Check className="h-4 w-4 text-gray-900" aria-label="Included" />
                  ) : (
                    <Minus className="h-4 w-4 text-gray-300" aria-label="Not included" />
                  )}
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ── Manage / cancel ─────────────────────────────────────────────── */}
      <section className="flex flex-col gap-2">
        <Button
          fullWidth
          variant="outline"
          rightIcon={<ExternalLink />}
          onClick={() =>
            addToast({
              variant: 'info',
              title: 'Opening billing portal',
              message: 'Invoices and payment methods live with our payment provider.',
            })
          }
        >
          Manage billing
        </Button>

        {isPaid && (
          <Button
            fullWidth
            variant="outline"
            className="border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50"
            onClick={() => setConfirmingCancel(true)}
          >
            Cancel subscription
          </Button>
        )}
      </section>

      <ConfirmDialog
        open={isConfirmingCancel}
        title={`Cancel ${currentTier.name}?`}
        description={`You'll drop to the Free plan and lose AI drafting, waiting-on chases and research packs. Your data stays put.`}
        confirmLabel="Cancel plan"
        cancelLabel="Keep plan"
        onConfirm={handleCancel}
        onCancel={() => setConfirmingCancel(false)}
      />
    </div>
  );
}

export default SubscriptionSection;
