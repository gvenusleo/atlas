"use client";

import { useRouter } from "next/navigation";
import { startTransition, useEffect } from "react";
import { refreshSessionAction } from "@/app/auth/actions";

export function SessionRefresh() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    startTransition(async () => {
      const result = await refreshSessionAction();

      if (!cancelled && !result.ok) {
        router.replace("/auth");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}
