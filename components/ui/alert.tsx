import type { ComponentType, ReactNode, SVGProps } from "react";
import { AlertCircleIcon, CheckCircleIcon, LockIcon } from "@/components/ui/icons";

type Tone = "error" | "locked" | "success";

const tones: Record<
  Tone,
  { box: string; title: string; body: string; Icon: ComponentType<SVGProps<SVGSVGElement>> }
> = {
  error: {
    box: "border-danger-line bg-danger-pale",
    title: "text-danger",
    body: "text-[#8b3226]",
    Icon: AlertCircleIcon,
  },
  locked: {
    box: "border-danger-line bg-danger-pale",
    title: "text-danger",
    body: "text-[#8b3226]",
    Icon: LockIcon,
  },
  success: {
    box: "border-success/30 bg-success-pale",
    title: "text-success",
    body: "text-success",
    Icon: CheckCircleIcon,
  },
};

/** Banner for form-level feedback (see mockups 3.1.8 and 3.2.5). */
export function Alert({ tone, title, children }: { tone: Tone; title: string; children?: ReactNode }) {
  const t = tones[tone];
  return (
    <div role={tone === "success" ? "status" : "alert"} className={`flex rounded-[10px] border px-4 py-3.5 ${t.box}`}>
      <t.Icon className={`mt-px mr-3 size-[19px] shrink-0 ${t.title}`} />
      <div>
        <p className={`text-[15px] leading-snug font-semibold ${t.title}`}>{title}</p>
        {children && <p className={`mt-1 text-sm ${t.body}`}>{children}</p>}
      </div>
    </div>
  );
}
