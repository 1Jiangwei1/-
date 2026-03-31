"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type LoreEntryHistoryProps = {
  entryId: string;
};

type Notice =
  | { type: "success"; text: string }
  | { type: "error"; text: string }
  | null;

type HistoryRecord = {
  id: string;
  versionLabel: string;
  editedAt: string;
  editorName: string;
  changeNote: string;
};

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value || "-";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function parseJsonSafely(text: string) {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

function isProbablyCodeLikeText(value: string) {
  const text = value.trim();

  if (!text) {
    return false;
  }

  if (text.startsWith("{") || text.startsWith("[") || text.includes('":')) {
    return true;
  }

  if (
    text.includes("function ") ||
    text.includes("export ") ||
    text.includes("import ") ||
    text.includes("const ") ||
    text.includes("class ")
  ) {
    return true;
  }

  return text.length > 120;
}

function normalizeChangeNote(record: Record<string, unknown>) {
  const directValue =
    record.changeNote ??
    record.note ??
    record.summary ??
    record.message ??
    record.commitMessage;

  if (typeof directValue === "string" && directValue.trim()) {
    return isProbablyCodeLikeText(directValue) ? "未填写变更说明" : directValue;
  }

  if (
    typeof record.payload === "string" &&
    record.payload.trim().startsWith("{")
  ) {
    const parsedPayload = parseJsonSafely(record.payload) as
      | Record<string, unknown>
      | null;

    if (parsedPayload) {
      const nestedNote =
        parsedPayload.changeNote ??
        parsedPayload.note ??
        parsedPayload.summary ??
        parsedPayload.message;

      if (typeof nestedNote === "string" && nestedNote.trim()) {
        return isProbablyCodeLikeText(nestedNote)
          ? "未填写变更说明"
          : nestedNote;
      }
    }
  }

  return "未填写变更说明";
}

function normalizeHistoryList(payload: unknown): HistoryRecord[] {
  const rawList = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { versions?: unknown[] } | null)?.versions)
      ? ((payload as { versions: unknown[] }).versions ?? [])
      : Array.isArray((payload as { items?: unknown[] } | null)?.items)
        ? ((payload as { items: unknown[] }).items ?? [])
        : [];

  return rawList.map((item, index) => {
    const record = (item ?? {}) as Record<string, unknown>;
    const rawId = record.id ?? record.versionId ?? index + 1;
    const rawVersion =
      record.versionNumber ?? record.version ?? record.sequence ?? index + 1;
    const rawEditedAt =
      record.editedAt ?? record.createdAt ?? record.updatedAt ?? "";
    const rawEditor =
      record.editorName ??
      record.editedBy ??
      (record.editor &&
      typeof record.editor === "object" &&
      !Array.isArray(record.editor)
        ? ((record.editor as Record<string, unknown>).name ??
          (record.editor as Record<string, unknown>).username ??
          (record.editor as Record<string, unknown>).email)
        : undefined) ??
      "未知";
    return {
      id: String(rawId),
      versionLabel: `版本 ${String(rawVersion)}`,
      editedAt: String(rawEditedAt),
      editorName: String(rawEditor),
      changeNote: normalizeChangeNote(record),
    };
  });
}

export default function LoreEntryHistory({
  entryId,
}: LoreEntryHistoryProps) {
  const router = useRouter();
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [notice, setNotice] = useState<Notice>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rollingBackId, setRollingBackId] = useState<string | null>(null);

  const historyUrl = useMemo(
    () => `/api/admin/lore/entries/${entryId}/history`,
    [entryId]
  );
  const rollbackUrl = useMemo(
    () => `/api/admin/lore/entries/${entryId}/rollback`,
    [entryId]
  );

  async function loadHistory() {
    setIsLoading(true);

    try {
      const response = await fetch(historyUrl, {
        method: "GET",
        cache: "no-store",
      });
      const rawText = await response.text();
      const data = parseJsonSafely(rawText) as
        | {
            message?: string;
            error?: string;
            versions?: unknown[];
            items?: unknown[];
          }
        | unknown[];

      if (!response.ok) {
        setNotice({
          type: "error",
          text:
            (data as { message?: string; error?: string } | null)?.message ??
            (data as { message?: string; error?: string } | null)?.error ??
            "版本记录加载失败，请稍后重试。",
        });
        setRecords([]);
        return;
      }

      setRecords(normalizeHistoryList(data));
    } catch {
      setNotice({
        type: "error",
        text: "版本记录加载失败，请检查网络后重试。",
      });
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadHistory();
  }, [historyUrl]);

  async function handleRollback(versionId: string) {
    setRollingBackId(versionId);
    setNotice(null);

    try {
      const response = await fetch(rollbackUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ versionId }),
      });
      const rawText = await response.text();
      const data = parseJsonSafely(rawText) as
        | {
            success?: boolean;
            message?: string;
            error?: string;
          }
        | null;

      if (!response.ok || data?.success === false) {
        setNotice({
          type: "error",
          text:
            data?.message ??
            data?.error ??
            "回滚失败，请稍后重试。",
        });
        return;
      }

      setNotice({
        type: "success",
        text: data?.message ?? "回滚成功",
      });
      await loadHistory();
      router.refresh();
    } catch {
      setNotice({
        type: "error",
        text: "回滚失败，请检查网络后重试。",
      });
    } finally {
      setRollingBackId(null);
    }
  }

  return (
    <div className="space-y-4">
      {notice ? (
        <div
          className={
            notice.type === "success"
              ? "rounded-xl border border-emerald-800 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-300"
              : "rounded-xl border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-300"
          }
        >
          {notice.text}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60">
        {isLoading ? (
          <div className="px-6 py-12 text-center text-sm text-zinc-400">
            正在加载版本记录...
          </div>
        ) : records.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-zinc-400">
            暂无版本记录
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-800">
              <thead className="bg-zinc-950/70">
                <tr className="text-left text-sm text-zinc-400">
                  <th className="px-6 py-4 font-medium">版本</th>
                  <th className="px-6 py-4 font-medium">编辑时间</th>
                  <th className="px-6 py-4 font-medium">编辑人</th>
                  <th className="px-6 py-4 font-medium">变更说明</th>
                  <th className="px-6 py-4 font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 text-sm text-zinc-200">
                {records.map((record) => (
                  <tr key={record.id} className="hover:bg-zinc-800/30">
                    <td className="px-6 py-4 font-medium text-zinc-100">
                      {record.versionLabel}
                    </td>
                    <td className="px-6 py-4 text-zinc-300">
                      {formatDate(record.editedAt)}
                    </td>
                    <td className="px-6 py-4 text-zinc-300">
                      {record.editorName}
                    </td>
                    <td className="px-6 py-4 text-zinc-300">
                      {record.changeNote}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => handleRollback(record.id)}
                        disabled={rollingBackId === record.id}
                        className="inline-flex items-center rounded-lg border border-zinc-700 px-3 py-1.5 text-sm font-medium text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {rollingBackId === record.id ? "回滚中..." : "回滚此版本"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
