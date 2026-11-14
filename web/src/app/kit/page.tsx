import { Suspense } from "react";
import type { Metadata } from "next";
import { Wordmark } from "@/components/Wordmark";
import { KitApp } from "@/components/kit/KitApp";

export const metadata: Metadata = { title: "Läpi: home sample" };

export default function KitPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-dvh bg-paper sm:flex sm:items-start sm:justify-center sm:px-4 sm:py-8">
          <div className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col bg-surface sm:min-h-[760px] sm:rounded-[2rem] sm:border sm:border-rule sm:shadow-xl">
            <div className="flex-1 p-5" aria-busy="true"><Wordmark /></div>
          </div>
        </main>
      }
    >
      <KitApp />
    </Suspense>
  );
}
