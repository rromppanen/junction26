import { Suspense } from "react";
import type { Metadata } from "next";
import { KitApp } from "@/components/kit/KitApp";

export const metadata: Metadata = { title: { absolute: "Screening home sample | farmagusta" } };

export default function KitPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-dvh bg-paper sm:flex sm:h-dvh sm:items-center sm:justify-center sm:p-4">
          <div className="mx-auto flex h-dvh w-full max-w-[390px] flex-col bg-surface sm:h-[min(820px,100%)] sm:rounded-[1.75rem] sm:border sm:border-rule sm:shadow-xl">
            <div className="flex-1 p-5" aria-busy="true" />
          </div>
        </main>
      }
    >
      <KitApp />
    </Suspense>
  );
}
