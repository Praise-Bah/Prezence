'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import Image from 'next/image';
import { ArrowUp, Paperclip, Sparkles } from 'lucide-react';
import { sendChatMessage } from '../../lib/actions/ai.actions';
import { cn } from '../../lib/utils';

const LOGO_GRADIENT =
  'linear-gradient(135deg, rgb(107, 181, 255) 0%, rgb(117, 198, 97) 30%, rgb(96, 108, 145) 70%, rgb(5, 131, 132) 100%)';

const SUGGESTED_PROMPTS = [
  'Optimize my LinkedIn headline',
  'Review my GitHub profile bio',
  'Improve my Fiverr gig description',
  'Suggest content for my Instagram bio',
] as const;

const INPUT_PLACEHOLDER =
  'Describe what you do (skill, experience or upload your resume or cv)...';

const MAX_TEXTAREA_ROWS = 4;
const LINE_HEIGHT_PX = 28;

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'error';
  content: string;
  createdAt: Date;
}

interface AiChatProps {
  userDisplayName: string;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatMessageTime(date: Date): string {
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function PrezenceLogoAvatar({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const outer = size === 'sm' ? 'h-[58px] w-[58px] p-[8px]' : 'h-[82px] w-[82px] p-[10px]';
  const inner = size === 'sm' ? 52 : 64;

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full shadow-[0px_8px_16px_rgba(124,58,237,0.25),0px_0px_0px_rgba(124,58,237,0.08)]',
        outer,
      )}
      style={{ backgroundImage: LOGO_GRADIENT }}
    >
      <Image
        src="/assets/brand/shared-logo-mark@64x64.png"
        alt=""
        width={inner}
        height={inner}
        className="rounded-full object-cover"
        aria-hidden
      />
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex h-[37px] items-center gap-1 rounded-bl-[1px] rounded-br-2xl rounded-tl-2xl rounded-tr-2xl bg-[#6e6eff] px-5 py-2">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn(
            'rounded-full bg-white/90',
            i === 2 ? 'h-2 w-2' : 'h-1.5 w-1.5',
            'animate-bounce',
          )}
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

export function AiChat({ userDisplayName }: AiChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const hasMessages = messages.length > 0;

  const resizeTextarea = useCallback((): void => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const maxHeight = LINE_HEIGHT_PX * MAX_TEXTAREA_ROWS + 24;
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }, []);

  useEffect(() => {
    resizeTextarea();
  }, [input, resizeTextarea]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = useCallback(
    async (text: string): Promise<void> => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: trimmed,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput('');
      setIsLoading(true);

      const result = await sendChatMessage(trimmed);

      if ('error' in result) {
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: 'error',
            content: result.error,
            createdAt: new Date(),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: result.reply,
            createdAt: new Date(),
          },
        ]);
      }

      setIsLoading(false);
    },
    [isLoading],
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    void sendMessage(input);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(input);
    }
  };

  const greeting = getGreeting();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        className={cn(
          'mx-4 mb-4 mt-2 flex min-h-0 flex-1 flex-col overflow-hidden rounded shadow-[0px_0px_11px_0px_rgba(128,139,157,0.15)] lg:mx-6',
          hasMessages ? 'bg-[#f8f9fa]' : 'bg-white',
        )}
      >
        {!hasMessages ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-10">
            <div className="flex w-full max-w-[600px] flex-col items-center gap-[18px]">
              <PrezenceLogoAvatar size="md" />
              <h2 className="text-center text-[32px] font-bold leading-[38.4px] tracking-[-0.8px] text-[#1a1a2e]">
                {greeting}, {userDisplayName} 👋
              </h2>
              <p className="text-center text-sm leading-[22.4px] text-[#6b7280]">
                Welcome to Prezence AI
              </p>

              <div className="flex w-full flex-wrap justify-center gap-2.5 px-4 pt-2">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    disabled={isLoading}
                    onClick={() => void sendMessage(prompt)}
                    className="rounded-xl bg-[#eef2ff] px-4 py-3 text-sm font-medium text-[#3771c8] transition hover:bg-[#e0e7ff] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <div className="w-full px-4 py-2.5">
                <div className="rounded-[99px] border border-[rgba(68,83,161,0.2)] bg-[#f7f7f7] px-3 py-1.5 text-center">
                  <p className="text-[11px] font-medium leading-[16.5px] text-[#4453a1]">
                    {INPUT_PLACEHOLDER}
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => {
                  if (input.trim()) {
                    void sendMessage(input);
                  } else {
                    textareaRef.current?.focus();
                  }
                }}
                className="flex h-9 items-center gap-2 rounded-2xl bg-gradient-to-r from-[#3771c8] to-[#6ebb65] px-5 text-[13px] font-semibold text-[#f8f9fa] shadow-[0px_4px_8px_rgba(124,58,237,0.3)] transition hover:opacity-95 disabled:opacity-60"
              >
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Ask Prezence AI
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-[#eef2ff] px-4 py-5 lg:px-6">
              <div className="flex items-center gap-2.5">
                <PrezenceLogoAvatar size="sm" />
                <div>
                  <p className="text-xl font-bold tracking-[-0.4px] text-[#1a1a2e] lg:text-[32px] lg:leading-[38.4px]">
                    {greeting}, {userDisplayName} 👋
                  </p>
                  <p className="text-sm text-[#6b7280]">Welcome to Prezence AI</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">
              <div className="mx-auto flex max-w-3xl flex-col gap-6">
                {messages.map((message) =>
                  message.role === 'user' ? (
                    <div key={message.id} className="flex flex-col items-end gap-1">
                      <div className="flex max-w-[85%] items-start justify-end gap-6">
                        <div className="rounded-2xl bg-[#1a1a2e] px-4 py-2.5 text-base leading-[25px] text-[#f8f9fa]">
                          {message.content}
                        </div>
                        <Image
                          src="/assets/placeholders/shared-user-avatar@40x40.webp"
                          alt=""
                          width={47}
                          height={47}
                          className="shrink-0 rounded-full"
                          aria-hidden
                        />
                      </div>
                      <time className="pr-[71px] text-xs text-[#6b7280]">
                        {formatMessageTime(message.createdAt)}
                      </time>
                    </div>
                  ) : (
                    <div key={message.id} className="flex flex-col items-start gap-1">
                      <div className="flex max-w-[85%] items-start gap-6">
                        <PrezenceLogoAvatar size="sm" />
                        <div
                          className={cn(
                            'rounded-2xl px-4 py-2.5 text-base leading-[25px]',
                            message.role === 'error'
                              ? 'border border-red-200 bg-red-50 text-red-800'
                              : 'bg-[rgba(61,45,76,0.14)] text-[#1a1a2e]',
                          )}
                        >
                          {message.content}
                        </div>
                      </div>
                      <time className="pl-[82px] text-xs text-[#6b7280]">
                        {formatMessageTime(message.createdAt)}
                      </time>
                    </div>
                  ),
                )}

                {isLoading && (
                  <div className="flex items-start gap-6">
                    <PrezenceLogoAvatar size="sm" />
                    <TypingIndicator />
                  </div>
                )}

                <div ref={bottomRef} />
              </div>
            </div>
          </>
        )}

        <div className="border-t border-[rgba(26,26,46,0.08)] bg-[#f8f9fa] px-4 py-4 lg:px-8">
          <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
            <div className="flex min-h-[82px] items-end justify-between gap-3 rounded-[10px] border border-[#1a1a2e] px-6 py-5">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={INPUT_PLACEHOLDER}
                rows={1}
                disabled={isLoading}
                className="max-h-[136px] min-h-[28px] flex-1 resize-none bg-transparent text-lg leading-7 text-[#1a1a2e] placeholder:text-[rgba(10,10,10,0.45)] focus:outline-none disabled:opacity-60"
              />
              <div className="flex shrink-0 items-center gap-2.5">
                <button
                  type="button"
                  disabled
                  aria-label="Attach file"
                  className="text-[#787c91] disabled:cursor-not-allowed"
                >
                  <Paperclip className="h-6 w-6" strokeWidth={1.5} />
                </button>
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  aria-label="Send message"
                  className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#1a1a2e] text-white transition hover:bg-[#2d2d44] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowUp className="h-[18px] w-[18px]" strokeWidth={2} />
                </button>
              </div>
            </div>
            <p className="mt-3 text-center text-[13px] leading-[18px] text-[#1a1a2e]">
              Prezence can make mistakes. Check important info.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
