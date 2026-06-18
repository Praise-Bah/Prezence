import Image from 'next/image';

const PAYMENTS = {
  mtnWordmark: '/assets/payments/shared-mtn-momo-wordmark@88x34.svg',
  orangeWordmark: '/assets/payments/shared-orange-money-wordmark@99x34.svg',
  visa: '/assets/payments/shared-visa@36x24.svg',
  mastercard: '/assets/payments/shared-mastercard@36x24.svg',
} as const;

export function PaymentBadgesRow() {
  return (
    <div className="w-full">
      <p className="text-[10px] font-semibold uppercase tracking-[0.8px] text-[#c0c0c0]">
        Pay with
      </p>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <span className="rounded-md border border-[#ffcb00] bg-[#fffbe6] px-2 py-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={PAYMENTS.mtnWordmark} alt="MTN MoMo" className="h-[18px] w-auto" />
        </span>
        <span className="rounded-md border border-[#f60] bg-[#fff5f0] px-2 py-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={PAYMENTS.orangeWordmark} alt="Orange Money" className="h-[18px] w-auto" />
        </span>
        <span className="flex items-center gap-1 rounded-md border border-[rgba(29,78,138,0.18)] bg-[#f0f5fc] px-2 py-1">
          <Image src={PAYMENTS.visa} alt="Visa" width={26} height={18} />
          <Image src={PAYMENTS.mastercard} alt="Mastercard" width={26} height={18} />
        </span>
      </div>
    </div>
  );
}
