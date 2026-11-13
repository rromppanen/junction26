"use client";

export function PrintButton({ children }: { children: React.ReactNode }) {
  return (
    <button type="button" className="link" onClick={() => window.print()}>
      {children}
    </button>
  );
}
