import type { ReactNode } from "react";

/** Blue title banner for inner pages (mockup 3.2.1). */
export function PageBanner({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="bg-hero px-4 py-12 text-center sm:px-8">
      <h1 className="mb-2.5 text-[28px] text-white sm:text-[32px]">{title}</h1>
      {children && <p className="mx-auto max-w-[520px] text-[17px] text-white/88">{children}</p>}
    </div>
  );
}
