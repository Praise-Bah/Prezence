'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Camera } from 'lucide-react';
import type { UserProfile } from '@prezence/types';
import { Input, Textarea } from '../ui/input';
import { Button } from '../ui/button';
import { displayNameFromEmail } from '../../lib/user-display';
import { updateProfileAction } from '../../lib/actions/auth.actions';
import { cn } from '../../lib/utils';

const AVATAR = '/assets/placeholders/shared-user-avatar@72x72.webp';

const COUNTRIES: Array<{ code: string; label: string }> = [
  { code: 'CM', label: 'Cameroon' },
  { code: 'NG', label: 'Nigeria' },
  { code: 'GH', label: 'Ghana' },
  { code: 'KE', label: 'Kenya' },
  { code: 'SN', label: 'Senegal' },
  { code: 'CI', label: "Côte d'Ivoire" },
];

const LANGUAGES: Array<{ code: string; label: string }> = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
];

interface ProfileFormProps {
  user: UserProfile;
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ code: string; label: string }>;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-[#1a1a2e]">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'h-[39px] w-full rounded-[10px] border border-[rgba(26,26,46,0.1)] bg-[#f8f9fa] px-[13px] text-sm text-[#1a1a2e]',
          'focus:outline-none focus:ring-2 focus:ring-[#1d4e8a]',
        )}
      >
        {options.map((opt) => (
          <option key={opt.code} value={opt.code}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [fullName, setFullName] = useState(
    (user as unknown as Record<string, unknown>).name as string | undefined
    ?? displayNameFromEmail(user.email),
  );
  const [country, setCountry] = useState(user.country_code ?? 'CM');
  const [language, setLanguage] = useState<string>(user.language ?? 'en');
  const [bio, setBio] = useState(
    ((user as unknown as Record<string, unknown>).bio as string | undefined) ?? '',
  );
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setNotice(null);

    const result = await updateProfileAction({
      name: fullName,
      bio: bio || undefined,
      language,
    });

    setSaving(false);
    if (result.success) {
      setNotice({ type: 'success', text: result.success });
    } else {
      setNotice({ type: 'error', text: result.error ?? 'Something went wrong.' });
    }
    window.setTimeout(() => setNotice(null), 5000);
  }

  return (
    <form onSubmit={handleSave} className="rounded-[10px] border border-[rgba(26,26,46,0.1)] bg-[#f8f9fa] p-6">
      <h2 className="text-xl font-medium text-[#1a1a2e]">Profile Information</h2>

      <div className="mt-4 flex gap-4">
        <div className="relative shrink-0">
          <Image
            src={AVATAR}
            alt=""
            width={80}
            height={80}
            className="h-20 w-20 rounded-full object-cover"
          />
          <label
            htmlFor="profile-photo"
            className="absolute bottom-0 right-0 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-[#0f6e56] text-white shadow-sm"
          >
            <Camera className="h-4 w-4" aria-hidden />
            <input id="profile-photo" type="file" accept="image/*" className="sr-only" />
          </label>
        </div>
        <div className="pt-1">
          <p className="text-sm font-medium text-[#1a1a2e]">Profile Photo</p>
          <p className="mt-1 text-sm text-[#888780]">
            Upload a professional photo for your Prezence profile
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <Input
          variant="content"
          label="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="border-[rgba(26,26,46,0.1)] bg-[#f8f9fa]"
        />
        <Input
          variant="content"
          label="Email Address"
          value={user.email}
          readOnly
          disabled
          className="border-[rgba(26,26,46,0.1)] bg-[#f8f9fa] opacity-70"
        />
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <SelectField label="Country" value={country} onChange={setCountry} options={COUNTRIES} />
        <SelectField label="Language / Langue" value={language} onChange={setLanguage} options={LANGUAGES} />
      </div>

      <div className="mt-6">
        <Textarea
          variant="content"
          label="Bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          placeholder="Tell us about yourself…"
          className="min-h-[90px] border-[rgba(26,26,46,0.1)] bg-[#f8f9fa]"
        />
      </div>

      {notice && (
        <p
          className={cn(
            'mt-4 rounded-[10px] border px-4 py-3 text-sm',
            notice.type === 'success'
              ? 'border-[rgba(15,110,86,0.2)] bg-[#f0faf6] text-[#0f6e56]'
              : 'border-[rgba(192,57,43,0.2)] bg-[rgba(192,57,43,0.05)] text-[#c0392b]',
          )}
        >
          {notice.text}
        </p>
      )}

      <Button
        type="submit"
        variant="auth"
        size="md"
        disabled={saving}
        className="mt-6 h-[37px] rounded-[10px] px-5"
      >
        {saving ? 'Saving…' : 'Save Changes'}
      </Button>
    </form>
  );
}
