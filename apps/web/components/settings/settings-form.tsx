'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Globe, Lock, Shield, Trash2, ExternalLink } from 'lucide-react';
import type { UserProfile } from '@prezence/types';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Toggle } from '../ui/toggle';
import { displayNameFromEmail } from '../../lib/user-display';
import { cn } from '../../lib/utils';

const TIMEZONES = [
  'Africa/Douala',
  'Africa/Lagos',
  'Africa/Nairobi',
  'Africa/Accra',
  'UTC',
];

function SettingsCard({
  title,
  icon,
  children,
  className,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-[10px] border border-[rgba(26,26,46,0.1)] bg-[#f8f9fa] p-6',
        className,
      )}
    >
      <div className="mb-4 flex items-center gap-2">
        {icon}
        <h2 className="text-xl font-medium text-[#1a1a2e]">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function ComingSoonButton({ label }: { label: string }) {
  const [notice, setNotice] = useState<string | null>(null);

  function handleClick() {
    setNotice('Coming soon');
    window.setTimeout(() => setNotice(null), 3000);
  }

  return (
    <div>
      {notice && (
        <p className="mb-3 rounded-[10px] border border-[rgba(29,78,138,0.15)] bg-[#f0f5fc] px-4 py-2 text-sm text-[#1d4e8a]">
          {notice}
        </p>
      )}
      <Button type="button" variant="auth" size="md" className="h-[37px] rounded-[10px]" onClick={handleClick}>
        {label}
      </Button>
    </div>
  );
}

function SelectField({
  label,
  hint,
  value,
  onChange,
  options,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-[#1a1a2e]">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 h-[41px] w-full rounded-[10px] border border-[rgba(26,26,46,0.1)] bg-[#f8f9fa] px-[13px] text-sm text-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-[#1d4e8a]"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {hint && <p className="mt-1 text-xs text-[#888780]">{hint}</p>}
    </div>
  );
}

interface SettingsFormProps {
  user: UserProfile;
}

export function SettingsForm({ user }: SettingsFormProps) {
  const [fullName] = useState(displayNameFromEmail(user.email));
  const [language, setLanguage] = useState<string>(user.language ?? 'en');
  const [timezone, setTimezone] = useState('Africa/Douala');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteNotice, setDeleteNotice] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <SettingsCard title="Profile Information">
        <div className="flex gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#1d4e8a] text-2xl font-bold text-[#f8f9fa]">
            {fullName
              .split(' ')
              .map((p) => p.charAt(0))
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div className="pt-2">
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
            defaultValue={fullName}
            readOnly
            className="border-[rgba(26,26,46,0.1)] bg-[#f8f9fa]"
          />
          <Input
            variant="content"
            label="Email Address"
            defaultValue={user.email}
            readOnly
            disabled
            className="border-[rgba(26,26,46,0.1)] bg-[#f8f9fa] opacity-70"
          />
        </div>

        <div className="mt-6">
          <Input
            variant="content"
            label="Bio"
            placeholder=""
            readOnly
            className="min-h-[90px] border-[rgba(26,26,46,0.1)] bg-[#f8f9fa]"
          />
        </div>

        <div className="mt-6">
          <ComingSoonButton label="Save Changes" />
        </div>
      </SettingsCard>

      <SettingsCard title="Password & Security" icon={<Lock className="h-5 w-5 text-[#1a1a2e]" />}>
        <Input
          variant="content"
          label="Current Password"
          type="password"
          placeholder="••••••••"
          readOnly
          className="border-[rgba(26,26,46,0.1)] bg-[#f8f9fa]"
        />

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Input
            variant="content"
            label="New Password"
            type="password"
            placeholder="••••••••"
            readOnly
            className="border-[rgba(26,26,46,0.1)] bg-[#f8f9fa]"
          />
          <Input
            variant="content"
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            readOnly
            className="border-[rgba(26,26,46,0.1)] bg-[#f8f9fa]"
          />
        </div>

        <div className="mt-4 flex items-center justify-between rounded-[10px] border border-[rgba(26,26,46,0.1)] bg-[rgba(213,232,245,0.3)] px-4 py-3">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 shrink-0 text-[#1d4e8a]" />
            <div>
              <p className="text-sm font-medium text-[#1a1a2e]">Two-Factor Authentication</p>
              <p className="text-xs text-[#888780]">Add an extra layer of security to your account</p>
            </div>
          </div>
          <Toggle
            id="two-factor"
            checked={twoFactor}
            onChange={setTwoFactor}
            label=""
            activeColor="green"
          />
        </div>

        <div className="mt-6">
          <ComingSoonButton label="Update Password" />
        </div>
      </SettingsCard>

      <SettingsCard title="Preferences" icon={<Globe className="h-5 w-5 text-[#1a1a2e]" />}>
        <SelectField
          label="Language / Langue"
          hint="Choose your preferred language for the app interface"
          value={language}
          onChange={setLanguage}
          options={[
            { value: 'en', label: 'English' },
            { value: 'fr', label: 'Français' },
          ]}
        />

        <div className="mt-4">
          <SelectField
            label="Timezone"
            value={timezone}
            onChange={setTimezone}
            options={TIMEZONES.map((tz) => ({ value: tz, label: tz.replace('_', ' ') }))}
          />
        </div>

        <div className="mt-6">
          <p className="text-sm font-medium text-[#1a1a2e]">Notifications</p>
          <Toggle
            id="email-notifications"
            checked={emailNotifications}
            onChange={setEmailNotifications}
            label="Email Notifications"
            description="Receive updates via email"
          />
          <Toggle
            id="push-notifications"
            checked={pushNotifications}
            onChange={setPushNotifications}
            label="Push Notifications"
            description="Receive browser notifications"
          />
        </div>

        <div className="mt-6 border-t border-[rgba(26,26,46,0.08)] pt-6">
          <Link
            href="/platforms"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#1d4e8a] hover:underline"
          >
            Connected platforms
            <ExternalLink className="h-4 w-4" />
          </Link>
          <p className="mt-1 text-xs text-[#888780]">Manage your linked social and freelance accounts</p>
        </div>
      </SettingsCard>

      <div className="rounded-[10px] border border-[rgba(192,57,43,0.2)] bg-[rgba(192,57,43,0.05)] p-6">
        <div className="mb-4 flex items-center gap-2">
          <Trash2 className="h-5 w-5 text-[#c0392b]" />
          <h2 className="text-xl font-medium text-[#c0392b]">Danger Zone</h2>
        </div>
        <p className="text-sm text-[#888780]">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <Button
          type="button"
          variant="danger"
          size="md"
          className="mt-4 h-[37px] rounded-[10px] bg-[#c0392b] hover:bg-[#a93226]"
          onClick={() => setShowDeleteDialog(true)}
        >
          Delete Account
        </Button>
      </div>

      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,42,82,0.65)] p-4">
          <div className="w-full max-w-md rounded-[16px] bg-white p-6 shadow-xl">
            <h3 className="text-lg font-medium text-[#1a1a2e]">Delete account?</h3>
            <p className="mt-2 text-sm text-[#888780]">
              This action cannot be undone. All your data will be permanently removed.
            </p>
            {deleteNotice && (
              <p className="mt-3 rounded-[10px] border border-[rgba(29,78,138,0.15)] bg-[#f0f5fc] px-4 py-2 text-sm text-[#1d4e8a]">
                {deleteNotice}
              </p>
            )}
            <div className="mt-6 flex gap-3">
              <Button
                type="button"
                variant="secondary"
                className="flex-1 rounded-[10px]"
                onClick={() => setShowDeleteDialog(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                className="flex-1 rounded-[10px] bg-[#c0392b]"
                onClick={() => {
                  setDeleteNotice('Account deletion coming soon');
                  window.setTimeout(() => {
                    setDeleteNotice(null);
                    setShowDeleteDialog(false);
                  }, 2000);
                }}
              >
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
