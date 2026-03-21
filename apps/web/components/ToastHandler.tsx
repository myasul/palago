"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

type ToastHandlerProps = {
  param: string;
  message: string;
};

export function ToastHandler({ param, message }: ToastHandlerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const toastParam = searchParams.get("toast");

    if (!toastParam || toastParam !== param) {
      return;
    }

    toast(message);

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("toast");

    const nextQuery = nextParams.toString();
    const nextHref = nextQuery.length > 0 ? `${pathname}?${nextQuery}` : pathname;

    router.replace(nextHref, { scroll: false });
  }, [message, param, pathname, router, searchParams]);

  return null;
}
