'use client';

import { useEffect, useState } from 'react';
import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles } from 'lucide-react';
import { submitInterviewAction, type InterviewState } from '../../lib/actions/intelligence.actions';
import { useJobStatus } from '../../lib/use-job-status';
import { Button } from '../ui/button';
import { Input, Textarea } from '../ui/input';
import { PlatformIcon } from '../content/platform-icon';
import { cn, formatPlatformName } from '../../lib/utils';

function JobStatusScreen({ jobId, platform }: { jobId: string; platform: string }) {
  const router = useRouter();
  const { status } = useJobStatus(jobId);

  useEffect(() => {
    if (status === 'completed') {
      router.push(`/content/${platform}`);
    }
  }, [status, platform, router]);

  return (
    <div className="flex flex-col items-center justify-center gap-6 rounded-2xl border border-[#e2e8f0] bg-white p-12 shadow-sm">
      {status === 'failed' ? (
        <>
          <p className="text-lg font-medium text-red-600">Generation failed</p>
          <p className="text-sm text-[#717182]">Something went wrong. Please go back and try again.</p>
          <Button variant="secondary" onClick={() => router.push(`/interview/${platform}`)}>
            Try again
          </Button>
        </>
      ) : (
        <>
          <Loader2 className="h-10 w-10 animate-spin text-[#6366f1]" />
          <p className="text-lg font-medium text-[#1a1a2e]">
            {status === 'running' ? 'Generating your profile…' : 'Starting generation…'}
          </p>
          <p className="text-sm text-[#717182]">This takes 30–60 seconds. You&apos;ll be redirected automatically.</p>
        </>
      )}
    </div>
  );
}

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

const STEPS = [
  { title: 'Basics', indices: [0, 1, 2] },
  { title: 'Story', indices: [3, 4, 5] },
  { title: 'Goals', indices: [6, 7, 8] },
];

interface InterviewFormProps {
  platform: string;
}

export function InterviewForm({ platform }: InterviewFormProps) {
  const [state, action, isPending] = useActionState(submitInterviewAction, initial);
  const [step, setStep] = useState(0);

  if (state.jobId && state.platform) {
    return <JobStatusScreen jobId={state.jobId} platform={state.platform} />;
  }

  const currentStep = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="platform" value={platform} />
      <input type="hidden" name="language" value="en" />

      {/* Platform badge — Figma Content Generator chip style */}
      <div className="flex items-center gap-3 rounded-2xl border border-[#e2e8f0] bg-white px-5 py-4 shadow-sm">
        <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#eef2ff]">
          <PlatformIcon platform={platform} />
        </div>
        <div>
          <p className="text-sm font-medium text-[#717182]">Generating for</p>
          <p className="text-lg font-medium text-[#1a1a2e]">{formatPlatformName(platform)}</p>
        </div>
      </div>

      {/* Progress — Figma step bar */}
      <div className="rounded-2xl border border-[#e2e8f0] bg-white px-5 py-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="font-medium text-[#1a1a2e]">
            Step {step + 1} of {STEPS.length}: {currentStep.title}
          </span>
          <span className="text-[#717182]">{step * 3 + 1}–{Math.min(step * 3 + 3, 9)} of 9 questions</span>
        </div>
        <div className="h-4 overflow-hidden rounded-full bg-[rgba(55,113,200,0.04)]">
          <div
            className="h-full rounded-full bg-[#1d4e8a] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Form card */}
      <div className="rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-sm md:p-8">
        <div className="mb-6">
          <h3 className="text-xl font-medium text-[#1a1a2e]">Tell us about yourself</h3>
          <p className="mt-1 text-sm text-[#717182]">
            Answer once — we optimise every field for {formatPlatformName(platform)} limits.
          </p>
        </div>

        <div className="flex flex-col gap-5">
          {questions.map((q, index) => {
            const isVisible = currentStep.indices.includes(index);
            return (
              <div key={q.name} className={cn(!isVisible && 'hidden')} aria-hidden={!isVisible}>
                {q.type === 'textarea' ? (
                  <Textarea
                    variant="content"
                    name={q.name}
                    label={q.label}
                    placeholder={q.placeholder}
                    rows={3}
                    required={q.required}
                  />
                ) : (
                  <Input
                    variant="content"
                    name={q.name}
                    label={q.label}
                    placeholder={q.placeholder}
                    required={q.required}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {state.error && (
        <div className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        {step > 0 && (
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="sm:flex-1"
            onClick={() => setStep((s) => s - 1)}
          >
            Back
          </Button>
        )}
        {step < STEPS.length - 1 ? (
          <Button
            type="button"
            size="lg"
            className="bg-[#1a1a2e] hover:bg-[#2a2a3e] sm:flex-1"
            onClick={() => setStep((s) => s + 1)}
          >
            Continue
          </Button>
        ) : (
          <Button
            type="submit"
            loading={isPending}
            size="lg"
            className="inline-flex gap-2 bg-[#1a1a2e] hover:bg-[#2a2a3e] sm:flex-1"
          >
            {!isPending && <Sparkles className="h-5 w-5" />}
            {isPending ? 'Generating your profile…' : `Generate ${formatPlatformName(platform)} profile`}
          </Button>
        )}
      </div>

      <p className="text-center text-xs text-[#717182]">
        Generation takes 30–60 seconds. You&apos;ll be redirected when it&apos;s ready.
      </p>
    </form>
  );
}
