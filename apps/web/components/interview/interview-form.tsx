'use client';

import { useActionState } from 'react';
import { submitInterviewAction, type InterviewState } from '../../lib/actions/intelligence.actions';
import { Button } from '../ui/button';
import { Input, Textarea } from '../ui/input';
import { formatPlatformName } from '../../lib/utils';

const initial: InterviewState = {};

const questions = [
  {
    name: 'name',
    label: 'Full name',
    placeholder: 'e.g. Praise Bucuzong Bah',
    type: 'input' as const,
    required: true,
  },
  {
    name: 'title',
    label: 'Professional title / role',
    placeholder: 'e.g. Full-Stack Developer · Open to Work',
    type: 'input' as const,
    required: true,
  },
  {
    name: 'experience_years',
    label: 'Years of experience',
    placeholder: 'e.g. 3',
    type: 'input' as const,
    required: true,
  },
  {
    name: 'skills',
    label: 'Top skills (comma-separated)',
    placeholder: 'e.g. TypeScript, NestJS, React, PostgreSQL',
    type: 'textarea' as const,
    required: true,
  },
  {
    name: 'bio',
    label: 'Short bio (2–3 sentences about yourself)',
    placeholder: 'Describe your background, what drives you, and what you build.',
    type: 'textarea' as const,
    required: true,
  },
  {
    name: 'achievements',
    label: 'Key achievements or projects',
    placeholder: 'e.g. Built a fintech app used by 5 000+ users in Cameroon.',
    type: 'textarea' as const,
    required: true,
  },
  {
    name: 'looking_for',
    label: 'What are you looking for?',
    placeholder: 'e.g. Remote full-stack roles, freelance clients, co-founders',
    type: 'textarea' as const,
    required: true,
  },
  {
    name: 'target_audience',
    label: 'Who is your target audience?',
    placeholder: 'e.g. African startups, European tech companies, non-profit organisations',
    type: 'textarea' as const,
    required: true,
  },
  {
    name: 'languages_spoken',
    label: 'Languages you speak (optional)',
    placeholder: 'e.g. English, French, Pidgin',
    type: 'input' as const,
    required: false,
  },
];

interface InterviewFormProps {
  platform: string;
}

export function InterviewForm({ platform }: InterviewFormProps) {
  const [state, action, isPending] = useActionState(submitInterviewAction, initial);

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="platform" value={platform} />
      <input type="hidden" name="language" value="en" />

      <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-5 py-4">
        <p className="text-sm text-indigo-700">
          <strong>Generating for: {formatPlatformName(platform)}</strong> &mdash; We&apos;ll optimise every field for this platform&apos;s character limits and conventions.
        </p>
      </div>

      {questions.map((q) =>
        q.type === 'textarea' ? (
          <Textarea
            key={q.name}
            name={q.name}
            label={q.label}
            placeholder={q.placeholder}
            rows={3}
            required={q.required}
          />
        ) : (
          <Input
            key={q.name}
            name={q.name}
            label={q.label}
            placeholder={q.placeholder}
            required={q.required}
          />
        ),
      )}

      {state.error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <Button type="submit" loading={isPending} size="lg" className="w-full">
        {isPending ? 'Generating your profile…' : `Generate my ${formatPlatformName(platform)} profile →`}
      </Button>

      <p className="text-center text-xs text-gray-400">
        Generation takes 30&ndash;60 seconds. You&apos;ll be redirected when it&apos;s ready.
      </p>
    </form>
  );
}
