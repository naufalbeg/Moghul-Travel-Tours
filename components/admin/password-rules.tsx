import { CheckIcon } from "@/components/ui/icons";

const RULES = [
  { label: "At least 8 characters", test: (value: string) => value.length >= 8 },
  { label: "A number", test: (value: string) => /\d/.test(value) },
  { label: "A special character, e.g. ! @ # $", test: (value: string) => /[^A-Za-z0-9]/.test(value) },
];

/**
 * The password rules as a checklist that ticks itself off as the new
 * password is typed, so nobody has to send the form to find out what is
 * missing. The rules themselves are enforced by lib/validation/password.ts.
 */
export function PasswordRules({ id, value }: { id: string; value: string }) {
  return (
    <ul id={id} className="mt-2.5 space-y-1 text-sm">
      {RULES.map((rule) => {
        const met = rule.test(value);
        return (
          <li
            key={rule.label}
            className={`flex items-center gap-2 transition-colors duration-150 ${met ? "font-semibold text-success" : "text-muted"}`}
          >
            {met ? (
              <CheckIcon strokeWidth={2.6} className="size-4 shrink-0" />
            ) : (
              <span aria-hidden="true" className="mx-[3px] size-2.5 shrink-0 rounded-full border-[1.5px] border-field" />
            )}
            {rule.label}
            <span className="sr-only">{met ? " (done)" : " (still needed)"}</span>
          </li>
        );
      })}
    </ul>
  );
}
