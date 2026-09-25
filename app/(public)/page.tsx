import Link from "next/link";

// Placeholder until the real homepage (build step 3) — just enough to
// preview the shared header and footer.
export default function HomePage() {
  return (
    <section className="bg-hero px-4 py-20 text-center sm:px-8">
      <div className="mx-auto max-w-[720px]">
        <h1 className="mb-4 text-[28px] text-white uppercase sm:text-[40px]">
          Go beyond the ordinary — find your ideal journey
        </h1>
        <p className="mx-auto mb-8 max-w-[560px] text-[19px] text-white/88">
          Umrah, Ziarah, and family tours planned with care, backed by over a decade
          of experience and a team you can actually reach.
        </p>
        <Link
          href="/packages"
          className="inline-flex min-h-13 items-center rounded-lg bg-accent px-7 font-bold text-white hover:bg-accent-dark"
        >
          Browse packages
        </Link>
      </div>
    </section>
  );
}
