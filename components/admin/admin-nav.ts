import type { ComponentType, SVGProps } from "react";
import type { UserRole } from "@/generated/prisma/enums";
import {
  DashboardIcon,
  FileIcon,
  ImageIcon,
  KeyIcon,
  MailIcon,
  MegaphoneIcon,
  PackageIcon,
  SlidesIcon,
  StarIcon,
  UsersIcon,
} from "@/components/ui/icons";

type NavItem = {
  href: string;
  label: string;
  /** Shown in the top bar when this section is open. */
  title: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  minRole?: UserRole;
};

export const ADMIN_NAV: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [{ href: "/admin", label: "Dashboard", title: "Dashboard", Icon: DashboardIcon }],
  },
  {
    label: "Content management",
    items: [
      { href: "/admin/packages", label: "Packages", title: "Packages", Icon: PackageIcon },
      { href: "/admin/inquiries", label: "Inquiries", title: "Inquiries", Icon: MailIcon },
      { href: "/admin/gallery", label: "Gallery", title: "Gallery", Icon: ImageIcon },
      { href: "/admin/testimonials", label: "Testimonials", title: "Testimonials", Icon: StarIcon },
      { href: "/admin/content", label: "Content pages", title: "Content pages", Icon: FileIcon },
      { href: "/admin/banners", label: "Banners", title: "Banners", Icon: SlidesIcon },
      {
        href: "/admin/announcements",
        label: "Announcements",
        title: "Announcements",
        Icon: MegaphoneIcon,
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        href: "/admin/users",
        label: "User management",
        title: "User management",
        Icon: UsersIcon,
        minRole: "MASTER_ADMIN",
      },
      { href: "/admin/account", label: "My account", title: "My account", Icon: KeyIcon },
    ],
  },
];

export function isNavItemActive(href: string, pathname: string) {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}

// Sub-pages whose top-bar title differs from their section's.
const SUB_PAGE_TITLES: [RegExp, string][] = [
  [/^\/admin\/packages\/new$/, "Add new package"],
  [/^\/admin\/packages\/[^/]+\/edit$/, "Edit package"],
  [/^\/admin\/testimonials\/new$/, "Add testimonial"],
  [/^\/admin\/testimonials\/[^/]+\/edit$/, "Edit testimonial"],
  [/^\/admin\/announcements\/new$/, "Post announcement"],
  [/^\/admin\/announcements\/[^/]+\/edit$/, "Edit announcement"],
];

export function titleForPath(pathname: string) {
  for (const [pattern, title] of SUB_PAGE_TITLES) {
    if (pattern.test(pathname)) return title;
  }
  for (const group of ADMIN_NAV) {
    for (const item of group.items) {
      if (isNavItemActive(item.href, pathname)) return item.title;
    }
  }
  return "Admin";
}
