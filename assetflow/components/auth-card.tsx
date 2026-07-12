import type { ReactNode } from "react";

export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-af-background px-4 py-10">
      <section className="w-full max-w-[380px] rounded-2xl border border-gray-800 bg-af-panel px-7 py-8 shadow-2xl shadow-black/30 sm:px-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-green-500/50 bg-af-green text-sm font-bold tracking-wider text-green-400">
            AF
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-white">AssetFlow</h1>
        </div>
        {children}
      </section>
    </main>
  );
}
