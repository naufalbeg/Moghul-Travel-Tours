/**
 * Structured data for search engines (schema.org JSON-LD).
 *
 * This is the one place the site uses dangerouslySetInnerHTML: a JSON data
 * block is the only way to emit it (React would HTML-escape the quotes), and
 * browsers never run it as script. Every "<" is escaped, so text typed by an
 * admin cannot close the tag and inject markup. Do not copy this pattern for
 * anything that is rendered as HTML.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
