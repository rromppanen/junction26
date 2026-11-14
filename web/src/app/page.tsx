import Link from "next/link";

const APPS = [
  { href: "/kit?test=fit&start=1", title: "Customer app", text: "Book a robot to pick up your sample from home." },
  { href: "/staff", title: "Fleet monitoring", text: "Follow the robots and every sample they carry." },
];

export default function StartPage() {
  return (
    <main id="main-content" tabIndex={-1} className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        <h1 className="text-[length:var(--step-2)] font-semibold leading-tight">Demo</h1>
        <p className="mt-2 text-muted">This is a demo website. Choose which app to open.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {APPS.map((a) => (
            <Link key={a.href} href={a.href}
              className="flex min-h-28 flex-col justify-between rounded-xl border border-rule bg-white p-4 hover:border-brand hover:bg-brand-soft">
              <span className="text-lg font-semibold">{a.title}</span>
              <span className="text-sm text-muted">{a.text}</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
