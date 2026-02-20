import Link from "next/link";
export default function NotFound() {
    return (<main className="min-h-screen bg-[#151515] text-[#F7F8F8] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.005))] p-8 text-center shadow-[0_20px_40px_-12px_rgba(0,0,0,0.45)]">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
          <svg xmlns="http://www.w3.org/2000/svg" width="32px" height="32px" viewBox="0 0 18 18" aria-hidden="true">
            <path d="M4.0576 11.5701C2.4585 11.8926 1.25 13.3074 1.25 15C1.25 15.4141 1.5859 15.75 2 15.75C2.4141 15.75 2.75 15.4141 2.75 15C2.75 14.0029 3.4852 13.1812 4.4409 13.0312C4.2374 12.5766 4.1169 12.0838 4.0576 11.5701Z" fill="#F7F8F8"/>
            <path d="M4 9H1.75C1.3359 9 1 9.3359 1 9.75C1 10.1641 1.3359 10.5 1.75 10.5H4V9Z" fill="#F7F8F8"/>
            <path d="M4 7.75C4 7.2798 4.1295 6.8438 4.3381 6.4565C3.4322 6.2661 2.75 5.4619 2.75 4.5C2.75 4.0859 2.4141 3.75 2 3.75C1.5859 3.75 1.25 4.0859 1.25 4.5C1.25 6.1719 2.4302 7.5696 4 7.9146V7.75Z" fill="#F7F8F8"/>
            <path d="M13.9424 11.5701C15.5415 11.8926 16.75 13.3074 16.75 15C16.75 15.4141 16.4141 15.75 16 15.75C15.5859 15.75 15.25 15.4141 15.25 15C15.25 14.0029 14.5148 13.1812 13.5591 13.0312C13.7626 12.5766 13.8831 12.0838 13.9424 11.5701Z" fill="#F7F8F8"/>
            <path d="M14 9H16.25C16.6641 9 17 9.3359 17 9.75C17 10.1641 16.6641 10.5 16.25 10.5H14V9Z" fill="#F7F8F8"/>
            <path d="M14 7.75C14 7.2798 13.8705 6.8438 13.6619 6.4565C14.5678 6.2661 15.25 5.4619 15.25 4.5C15.25 4.0859 15.5859 3.75 16 3.75C16.4141 3.75 16.75 4.0859 16.75 4.5C16.75 6.1719 15.5698 7.5696 14 7.9146V7.75Z" fill="#F7F8F8"/>
            <path d="M6.75 5H11.25C11.5117 5 11.76 5.0483 12 5.1172V4.5C12 2.8457 10.6543 1.5 9 1.5C7.3457 1.5 6 2.8457 6 4.5V5.1172C6.24 5.0484 6.4883 5 6.75 5Z" fill="#F7F8F8"/>
            <path opacity="0.4" d="M11.25 5H6.75C5.2334 5 4 6.2334 4 7.75V11C4 13.7568 6.2432 16 9 16C11.7568 16 14 13.7568 14 11V7.75C14 6.2334 12.7666 5 11.25 5Z" fill="#F7F8F8"/>
            <path d="M9 16C8.5859 16 8.25 15.6641 8.25 15.25V10.75C8.25 10.3359 8.5859 10 9 10C9.4141 10 9.75 10.3359 9.75 10.75V15.25C9.75 15.6641 9.4141 16 9 16Z" fill="#F7F8F8"/>
          </svg>
        </div>

        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/50">404</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Page not found</h1>
        <p className="mt-3 text-sm text-white/60">
          The page you are looking for does not exist or may have been moved.
        </p>

        <div className="mt-8 flex items-center justify-center gap-2">
          <Link href="/" className="inline-flex h-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-medium text-white transition-colors hover:bg-white/10">
            Go Home
          </Link>
          <Link href="/home" className="inline-flex h-10 items-center justify-center rounded-xl bg-[#F04D26] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#e04420]">
            Open Dashboard
          </Link>
        </div>
      </div>
    </main>);
}
