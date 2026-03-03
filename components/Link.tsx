"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";

export function Link({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "/";
  const isActive =
    href === "/" ? pathname === href : pathname.startsWith(href);
  return (
    <NextLink href={href} className={isActive ? "is-active" : undefined}>
      {children}
    </NextLink>
  );
}
