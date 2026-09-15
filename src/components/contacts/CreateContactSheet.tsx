import { useEffect, useState } from 'react';
import type { Contact, ContactEmailEntry, ContactPhoneEntry } from '@/types/index';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useContactStore } from '@/store/contactStore';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';
import * as t from '@/lib/theme';
import { primaryEmail, primaryPhone } from './ContactCard';

// =============================================================================
// CreateContactSheet — used for both creating and editing a contact
// =============================================================================

export interface CreateContactSheetProps {
  open: boolean;
  onClose: () => void;
  /** When provided the sheet edits this contact instead of creating a new one. */
  contact?: Contact | null;
  /** Called with the saved contact after a successful write. */
  onSaved?: (contact: Contact) => void;
}

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
  company: string;
  website: string;
  birthday: string;
  street: string;
  city: string;
  country: string;
  notes: string;
}

type FieldErrors = Partial<Record<'firstName' | 'email' | 'website', string>>;

const EMPTY_FORM: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  jobTitle: '',
  company: '',
  website: '',
  birthday: '',
  street: '',
  city: '',
  country: '',
  notes: '',
};

/**
 * Pragmatic email shape check: one `@`, a dot-bearing domain, no whitespace.
 * Deliberately not RFC-complete — it only needs to catch typos.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

function formFromContact(contact: Contact): FormState {
  return {
    firstName: contact.firstName,
    lastName: contact.lastName,
    email: primaryEmail(contact) ?? '',
    phone: primaryPhone(contact) ?? '',
    jobTitle: contact.jobTitle ?? '',
    company: contact.company ?? '',
    website: contact.websiteUrl ?? '',
    birthday: contact.birthday ?? '',
    street: contact.address?.street ?? '',
    city: contact.address?.city ?? '',
    country: contact.address?.country ?? '',
    notes: contact.notes ?? '',
  };
}

function validate(form: FormState): FieldErrors {
  const errors: FieldErrors = {};

  if (!form.firstName.trim() && !form.lastName.trim()) {
    errors.firstName = 'Enter at least a first or last name.';
  }

  const email = form.email.trim();
  if (email && !EMAIL_PATTERN.test(email)) {
    errors.email = "That doesn't look like a valid email address.";
  }

  return errors;
}

/** Adds a scheme so the stored URL is safe to hand to an anchor tag. */
function normaliseWebsite(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

const fieldLabel = 'text-sm font-medium text-gray-700';

export function CreateContactSheet({
  open,
  onClose,
  contact,
  onSaved,
}: CreateContactSheetProps) {
  const createContact = useContactStore((s) => s.createContact);
  const updateContact = useContactStore((s) => s.updateContact);
  const addToast = useUIStore((s) => s.addToast);

  const isEditing = Boolean(contact);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  // Re-seed the draft every time the sheet opens so a cancelled edit is discarded.
  useEffect(() => {
    if (!open) return;
    setForm(contact ? formFromContact(contact) : EMPTY_FORM);
    setErrors({});
    setIsSaving(false);
  }, [open, contact]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear the inline error as soon as the user edits the offending field.
    if (key === 'firstName' || key === 'lastName') {
      setErrors((prev) => ({ ...prev, firstName: undefined }));
    } else if (key === 'email') {
      setErrors((prev) => ({ ...prev, email: undefined }));
    }
  };

  const handleSubmit = async () => {
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const displayName = [firstName, lastName].filter(Boolean).join(' ');
    const email = form.email.trim();
    const phone = form.phone.trim();

    // Preserve the label the contact already used; default to work for new rows.
    const existingEmail = contact?.emails.find((e) => e.isPrimary) ?? contact?.emails[0];
    const existingPhone = contact?.phones.find((p) => p.isPrimary) ?? contact?.phones[0];

    const emails: ContactEmailEntry[] = email
      ? [{ label: existingEmail?.label ?? 'work', email, isPrimary: true }]
      : [];
    const phones: ContactPhoneEntry[] = phone
      ? [{ label: existingPhone?.label ?? 'mobile', number: phone, isPrimary: true }]
      : [];

    const hasAddress = Boolean(form.street.trim() || form.city.trim() || form.country.trim());

    const payload: Partial<Contact> = {
      firstName,
      lastName,
      displayName,
      emails,
      phones,
      jobTitle: form.jobTitle.trim() || null,
      company: form.company.trim() || null,
      websiteUrl: normaliseWebsite(form.website),
      birthday: form.birthday || null,
      address: hasAddress
        ? {
            street: form.street.trim() || null,
            city: form.city.trim() || null,
            country: form.country.trim() || null,
          }
        : null,
      notes: form.notes.trim() || null,
    };

    setIsSaving(true);
    try {
      if (contact) {
        await updateContact(contact.id, payload);
        addToast({ variant: 'success', title: 'Contact updated', message: displayName });
        onSaved?.({ ...contact, ...payload } as Contact);
      } else {
        const created = await createContact(payload);
        addToast({ variant: 'success', title: 'Contact added', message: displayName });
        onSaved?.(created);
      }
      onClose();
    } catch {
      addToast({
        variant: 'error',
        title: isEditing ? "Couldn't save changes" : "Couldn't add contact",
        message: 'Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={isEditing ? 'Edit contact' : 'New contact'}
    >
      <div className="flex flex-col gap-5 px-5 pb-6 pt-4">
        {/* ── Name ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="First name"
            required
            autoFocus
            value={form.firstName}
            error={errors.firstName}
            placeholder="Priya"
            onChange={(e) => setField('firstName', e.target.value)}
          />
          <Input
            label="Last name"
            value={form.lastName}
            placeholder="Nair"
            onChange={(e) => setField('lastName', e.target.value)}
          />
        </div>

        {/* ── Reachability ──────────────────────────────────────────────── */}
        <Input
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={form.email}
          error={errors.email}
          placeholder="priya.nair@meridianhealth.com"
          onChange={(e) => setField('email', e.target.value)}
        />

        <Input
          label="Phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={form.phone}
          placeholder="+1 (617) 555-0278"
          onChange={(e) => setField('phone', e.target.value)}
        />

        {/* ── Work ──────────────────────────────────────────────────────── */}
        <Input
          label="Job title"
          value={form.jobTitle}
          placeholder="VP of Strategic Partnerships"
          onChange={(e) => setField('jobTitle', e.target.value)}
        />

        <Input
          label="Company"
          value={form.company}
          placeholder="Meridian Health"
          onChange={(e) => setField('company', e.target.value)}
        />

        <Input
          label="Website"
          inputMode="url"
          value={form.website}
          helperText="We'll add https:// if you leave it off."
          placeholder="meridianhealth.com"
          onChange={(e) => setField('website', e.target.value)}
        />

        <Input
          label="Birthday"
          type="date"
          value={form.birthday}
          onChange={(e) => setField('birthday', e.target.value)}
        />

        {/* ── Address ───────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          <span className={fieldLabel}>Address</span>
          <Input
            aria-label="Street"
            value={form.street}
            placeholder="Street"
            onChange={(e) => setField('street', e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              aria-label="City"
              value={form.city}
              placeholder="City"
              onChange={(e) => setField('city', e.target.value)}
            />
            <Input
              aria-label="Country"
              value={form.country}
              placeholder="Country"
              onChange={(e) => setField('country', e.target.value)}
            />
          </div>
        </div>

        {/* ── Notes ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-1.5">
          <label className={fieldLabel} htmlFor="contact-notes">
            Notes
          </label>
          <textarea
            id="contact-notes"
            rows={3}
            value={form.notes}
            onChange={(e) => setField('notes', e.target.value)}
            placeholder="How you met, what they care about…"
            className={cn(
              'w-full resize-y bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400',
              t.border,
              t.radius,
              'focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40',
            )}
          />
        </div>

        {/* ── Actions ───────────────────────────────────────────────────── */}
        <div className="flex gap-3 pt-1">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleSubmit} isLoading={isSaving}>
            {isEditing ? 'Save changes' : 'Add contact'}
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}

export default CreateContactSheet;
