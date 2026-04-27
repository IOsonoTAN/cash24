"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  countQueuedTransactions,
  getQueuedTransactions,
  removeQueuedTransaction,
} from "@/lib/offline/queue";

async function hasValidSession() {
  const response = await fetch("/api/auth/session", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });
  if (!response.ok) {
    return false;
  }
  const data = (await response.json()) as { user?: { email?: string } | null };
  return Boolean(data?.user);
}

export function SyncManager() {
  const [queuedCount, setQueuedCount] = useState(0);
  const [status, setStatus] = useState<"idle" | "syncing" | "auth_required">("idle");

  const replayQueue = useCallback(async () => {
    if (!navigator.onLine) {
      const total = await countQueuedTransactions();
      setQueuedCount(total);
      setStatus("idle");
      return;
    }
    const queued = await getQueuedTransactions();
    setQueuedCount(queued.length);
    if (queued.length === 0) {
      setStatus("idle");
      return;
    }
    const valid = await hasValidSession();
    if (!valid) {
      setStatus("auth_required");
      return;
    }
    setStatus("syncing");
    for (const item of queued) {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(item.payload),
      });
      if (response.status === 401) {
        setStatus("auth_required");
        break;
      }
      if (response.ok) {
        await removeQueuedTransaction(item.id);
      }
    }
    const total = await countQueuedTransactions();
    setQueuedCount(total);
    setStatus((current) => (current === "auth_required" ? "auth_required" : "idle"));
  }, []);

  useEffect(() => {
    const run = () => {
      void replayQueue();
    };
    run();
    const handleOnline = () => {
      void replayQueue();
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void replayQueue();
      }
    };
    window.addEventListener("online", handleOnline);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("online", handleOnline);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [replayQueue]);

  const label = useMemo(() => {
    if (status === "auth_required") {
      return "Re-login required to sync";
    }
    if (status === "syncing") {
      return "Syncing offline transactions";
    }
    if (queuedCount > 0) {
      return `${queuedCount} offline item${queuedCount > 1 ? "s" : ""} pending`;
    }
    return "All transactions synced";
  }, [queuedCount, status]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Badge variant="secondary" className="glass">
        {label}
      </Badge>
    </div>
  );
}
