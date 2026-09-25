import { GlobeIcon } from "@/components/ui/icons";

type Variant = "light" | "dark";

const styles: Record<Variant, string> = {
  light: "bg-primary-pale text-primary",
  dark: "bg-white/10 text-canvas",
};

/** Round globe badge used as the brand mark until a real logo exists. */
export function LogoMark({
  variant = "light",
  className = "size-12",
  iconClassName = "size-[26px]",
}: {
  variant?: Variant;
  className?: string;
  iconClassName?: string;
}) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full ${styles[variant]} ${className}`}
    >
      <GlobeIcon className={iconClassName} />
    </span>
  );
}
