import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Admin — Moghul Travel & Tours" },
  robots: { index: false, follow: false },
};

/** The admin portal is English, whatever language the visitor picked for the public site. */
export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return <div lang="en">{children}</div>;
}
