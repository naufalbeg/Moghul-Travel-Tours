import { PageBanner } from "@/components/public/page-banner";
import type { LegalDocument } from "@/lib/legal";

/**
 * A plain reading page for the privacy notice and the terms: the visitor's
 * language first, then the other one underneath (the notice has to be
 * available in both Malay and English). One column at a comfortable reading
 * width; no cards.
 */
export function LegalPage({ documents, locale }: { documents: LegalDocument[]; locale: "ms" | "en" }) {
  const ordered = [...documents].sort((a, b) => Number(b.lang === locale) - Number(a.lang === locale));
  return (
    <>
      <PageBanner title={ordered[0].title}>{ordered[0].updated}</PageBanner>

      <div className="wrap pt-[clamp(40px,5vw,64px)] pb-[clamp(56px,7vw,104px)]">
        {ordered.map((doc, i) => (
          <article
            key={doc.lang}
            lang={doc.lang}
            className={`max-w-[60ch] ${i > 0 ? "mt-14 border-t-2 border-primary-dark pt-10" : ""}`}
          >
            {i > 0 && (
              <>
                <h2 className="h-section">{doc.title}</h2>
                <p className="mt-2 mb-8 text-muted">{doc.updated}</p>
              </>
            )}
            {doc.sections.map((section) => {
              const Heading = i > 0 ? "h3" : "h2";
              return (
                <section key={section.heading} className="mb-9 last:mb-0">
                  <Heading className="mb-3 text-title tracking-[-0.01em] text-primary-dark">{section.heading}</Heading>
                  {/* A list's lead-in line sits above it; anything else follows it. */}
                  {section.items && section.paragraphs?.[0]?.endsWith(":") && (
                    <p className="mb-3">{section.paragraphs[0]}</p>
                  )}
                  {section.items && (
                    <ul className="mb-3 space-y-2">
                      {section.items.map((item) => (
                        <li
                          key={item}
                          className="relative pl-6 before:absolute before:top-[0.62em] before:left-1 before:size-2 before:rounded-full before:bg-primary-dark"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                  {section.paragraphs
                    ?.filter((_, n) => !(section.items && n === 0 && section.paragraphs![0].endsWith(":")))
                    .map((paragraph) => (
                      <p key={paragraph} className="mb-3 last:mb-0">
                        {paragraph}
                      </p>
                    ))}
                </section>
              );
            })}
          </article>
        ))}
      </div>
    </>
  );
}
