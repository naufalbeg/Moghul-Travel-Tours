import { SlideTransition } from "@/components/public/slide-transition";

/**
 * Re-mounts on every public navigation, so the page content between the
 * header and footer can slide left or right when the top menu is used.
 */
export default function PublicTemplate({ children }: { children: React.ReactNode }) {
  return <SlideTransition>{children}</SlideTransition>;
}
