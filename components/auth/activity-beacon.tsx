"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

function sendActivity() {
  fetch("/api/auth/activity", {
    method: "POST",
    keepalive: true,
  }).catch(() => {
    // ignore activity ping errors
  });
}

export default function ActivityBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    sendActivity();
  }, [pathname]);

  useEffect(() => {
    const interval = window.setInterval(sendActivity, 60 * 1000);

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        sendActivity();
      }
    };

    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
