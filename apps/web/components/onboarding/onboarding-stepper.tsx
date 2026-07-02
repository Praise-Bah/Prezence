import { Check } from 'lucide-react';
import { ONBOARDING_STEPS } from '../../lib/documents/constants';
import { cn } from '../../lib/utils';

interface OnboardingStepperProps {
  currentStep?: number;
}

export function OnboardingStepper({ currentStep = 6 }: OnboardingStepperProps) {
  return (
    <nav
      aria-label="Onboarding progress"
      className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6"
    >
      {ONBOARDING_STEPS.map((step) => {
        const isComplete = step.id < currentStep;
        const isCurrent = step.id === currentStep;

        return (
          <div
            key={step.id}
            className={cn(
              'flex flex-col items-center justify-center rounded-[18px] px-3 py-4 text-center',
              isCurrent && 'bg-[rgba(55,113,200,0.12)]',
            )}
          >
            <div
              className={cn(
                'mb-3 flex h-9 w-9 items-center justify-center rounded-xl',
                isComplete && 'text-[#0f6e56]',
                isCurrent && 'bg-[#1d4e8a] text-[#f8f9fa]',
                !isComplete && !isCurrent && 'border border-[rgba(26,26,46,0.1)] text-[#787c91]',
              )}
            >
              {isComplete ? (
                <Check className="h-6 w-6" strokeWidth={2.5} aria-hidden />
              ) : (
                <span className="text-sm font-semibold">{step.id}</span>
              )}
            </div>
            <span
              className={cn(
                'text-xs font-semibold',
                isCurrent ? 'text-[#3771c8]' : 'text-[#1a1a2e]',
              )}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </nav>
  );
}
