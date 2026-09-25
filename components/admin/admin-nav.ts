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
      { href: "/admin/packages", label: "Packages", title: "Manage Packages", Icon: PackageIcon },
      { href: "/admin/inquiries", label: "Inquiries", title: "Inquiries", Icon: MailIcon },
      { href: "/admin/gallery", label: "Gallery", title: "Gallery", Icon: ImageIcon },
      { href: "/admin/testimonials", label: "Testimonials", title: "Testimonials", Icon: StarIcon },
      { href: "/admin/content", label: "Content pages", title: "Content Pages", Icon: FileIcon },
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
        title: "User Management",
        Icon: UsersIcon,
        minRole: "MASTER_ADMIN",
      },
      { href: "/admin/account", label: "My account", title: "My Account", Icon: KeyIcon },
    ],
  },
];

export function isNavItemActive(href: string, pathname: string) {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}

export function titleForPath(pathname: string) {
  for (const group of ADMIN_NAV) {
    for (const item of group.items) {
      if (isNavItemActive(item.href, pathname)) return item.title;
    }
  }
  return "Admin";
}
