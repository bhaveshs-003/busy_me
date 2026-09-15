import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useSettingsStore } from '@/store/settingsStore';
import type { AIPersonality } from '@/store/settingsStore';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';
import * as t from '@/lib/theme';
import { fieldLabel, textareaClass } from './SettingsRow';

// =============================================================================
// AI Preferences
// =============================================================================

/** Name used when the field is left blank. */
const DEFAULT_ASSISTANT_NAME = 'Busy';

const PERSONALITIES: { id: AIPersonality; label: string; description: string }[] = [
  {
    id: 'professional',
    label: 'Professional',
    description: 'Measured and neutral. Reads like a good chief of staff.',
  },
  {
    id: 'friendly',
    label: 'Friendly',
    description: 'Warmer and more conversational, still on point.',
  },
  {
    id: 'concise',
    label: 'Concise',
    description: 'Shortest useful answer. No preamble, no sign-off.',
  },
];

const MAX_INSTRUCTIONS = 600;

export function AIPreferencesSection() {
  const preferences = useSettingsStore((s) => s.aiPreferences);
  const updateAIPreferences = useSettingsStore((s) => s.updateAIPreferences);
  const trackEvent = useSettingsStore((s) => s.trackEvent);
  const addToast = useUIStore((s) => s.addToast);

  const [name, setName] = useState(preferences.assistantName);
  const [personality, setPersonality] = useState<AIPersonality>(preferences.personality);
  const [email, setEmail] = useState(preferences.communicationEmail);
  const [instructions, setInstructions] = useState(preferences.instructions);

  useEffect(() => {
    setName(preferences.assistantName);
    setPersonality(preferences.personality);
    setEmail(preferences.communicationEmail);
    setInstructions(preferences.instructions);
  }, [preferences]);

  const emailError =
    email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
      ? 'Enter a valid email address.'
      : undefined;

  const isDirty =
    name !== preferences.assistantName ||
    personality !== preferences.personality ||
    email !== preferences.communicationEmail ||
    instructions !== preferences.instructions;

  const handleSave = () => {
    if (emailError) return;
    updateAIPreferences({
      assistantName: name.trim() || DEFAULT_ASSISTANT_NAME,
      personality,
      communicationEmail: email.trim(),
      instructions: instructions.trim(),
    });
    trackEvent('settings_change', { setting: 'ai_preferences', personality });
    addToast({ variant: 'success', title: 'AI preferences saved' });
  };

  return (
    <div className={t.sectionGap}>
      <section className="flex flex-col gap-4">
        <Input
          label="AI name"
          value={name}
          placeholder={DEFAULT_ASSISTANT_NAME}
          onChange={(e) => setName(e.target.value)}
          helperText={`What you call your assistant in chat. Defaults to ${DEFAULT_ASSISTANT_NAME}.`}
        />

        <div className="flex flex-col gap-2">
          <span className={fieldLabel} id="ai-personality-label">
            Personality
          </span>
          <div role="radiogroup" aria-labelledby="ai-personality-label" className={t.listGap}>
            {PERSONALITIES.map((option) => {
              const isActive = personality === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  onClick={() => setPersonality(option.id)}
                  className={cn(
                    'flex w-full items-start gap-3 px-3.5 py-3 text-left',
                    t.border,
                    t.radius,
                    t.touchTarget,
                    t.pressable,
                    t.focusRing,
                    isActive ? 'bg-gray-50' : 'bg-white',
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2',
                      isActive ? 'border-gray-900' : 'border-gray-100',
                    )}
                  >
                    {isActive && <span className="h-2 w-2 rounded-full bg-gray-900" />}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-gray-900">{option.label}</span>
                    <span className={cn(t.meta, 'mt-0.5 block leading-relaxed')}>
                      {option.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <Input
          label="Communication email"
          type="email"
          value={email}
          error={emailError}
          onChange={(e) => setEmail(e.target.value)}
          helperText={
            emailError ? undefined : 'The address Busy sends from when it replies on your behalf.'
          }
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="ai-instructions" className={fieldLabel}>
            Additional instructions
          </label>
          <textarea
            id="ai-instructions"
            rows={6}
            value={instructions}
            maxLength={MAX_INSTRUCTIONS}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Tell Busy how you want it to work — tone, what to prioritise, what to never do."
            className={textareaClass}
          />
          <p className={cn(t.meta, 'text-right tabular-nums')}>
            {instructions.length}/{MAX_INSTRUCTIONS}
          </p>
        </div>
      </section>

      <Button
        fullWidth
        size="lg"
        disabled={!isDirty || Boolean(emailError)}
        onClick={handleSave}
      >
        Save changes
      </Button>
    </div>
  );
}

export default AIPreferencesSection;
