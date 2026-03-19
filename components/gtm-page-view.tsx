"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function GtmPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;

    const url = searchParams?.size
      ? `${pathname}?${searchParams.toString()}`
      : pathname;

    (window as { dataLayer?: { push: (arg: object) => void } }).dataLayer?.push({
      event: "page_view",
      page_location: `${window.location.origin}${url}`,
      page_path: url,
      page_title: document.title,
    });
  }, [pathname, searchParams]);

  return null;
}
