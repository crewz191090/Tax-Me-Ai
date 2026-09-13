"use client";

import { useEffect, useState } from "react";

export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    // navigator.onLine is unavailable during SSR — sync it after mount to
    // avoid a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOnline(typeof navigator !== "undefined" ? navigator.onLine : true);

    function handleOnline() {
      setOnline(true);
    }
    function handleOffline() {
      setOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return online;
}
