"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { LoreEntryUpdateInput } from "@/lib/lore/validators";

type LoreEntryEditorProps = {
  entry: {
    id: string | number;
    title: string;
    summary: string;
    content: string;
    metas: Array<{
      id?: string;
      key: string;
      value: string;
    }>;
    updatedAt: string;
  };
  submitMode?: "edit" | "request";
};

type Notice =
  | { type: "success"; text: string }
  | { type: "error"; text: string }
  | null;

type MetaRow = {
  id: string;
  key: string;
  value: string;
};

function createMetaRow(key = "", value = ""): MetaRow {
  return {
    id: `${Date.now()}-${Math.random()}`,
    key,
    value,
  };
}

function createInitialMetaRows(
  metas: Array<{
    id?: string;
    key: string;
    value: string;
  }>
) {
  const rows = metas.map((meta) => ({
    id: meta.id ?? createMetaRow().id,
    key: meta.key,
    value: meta.value,
  }));

  return rows.length > 0 ? rows : [createMetaRow()];
}

export default function LoreEntryEditor({
  entry,
  submitMode = "edit",
}: LoreEntryEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(entry.title);
  const [summary, setSummary] = useState(entry.summary);
  const [content, setContent] = useState(entry.content);
  const [changeNote, setChangeNote] = useState("");
  const [metaRows, setMetaRows] = useState<MetaRow[]>(
    createInitialMetaRows(entry.metas)
  );
  const [updatedAt, setUpdatedAt] = useState(entry.updatedAt);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  function updateMetaRow(id: string, field: "key" | "value", nextValue: string) {
    setMetaRows((current) =>
      current.map((row) => (row.id === id ? { ...row, [field]: nextValue } : row))
    );
  }

  function addMetaRow() {
    setMetaRows((current) => [...current, createMetaRow()]);
  }

  function removeMetaRow(id: string) {
    setMetaRows((current) => {
      const nextRows = current.filter((row) => row.id !== id);
      return nextRows.length > 0 ? nextRows : [createMetaRow()];
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setNotice(null);

    const metas = metaRows
      .map((row) => ({
        key: row.key.trim(),
        value: row.value,
      }))
      .filter((row) => row.key.length > 0);

    const payload: LoreEntryUpdateInput = {
      title,
      summary,
      content,
      metas,
      changeNote,
    };

    try {
      const response = await fetch(`/api/admin/lore/entries/${entry.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const rawText = await response.text();
      const data = (() => {
        try {
          return rawText ? JSON.parse(rawText) : null;
        } catch {
          return null;
        }
      })() as
        | {
            success?: boolean;
            error?: string;
            message?: string;
            entry?: {
              title?: string;
              summary?: string;
              content?: string;
              updatedAt?: string;
            };
            metas?: Array<{
              id?: string;
              key?: string;
              value?: string;
            }>;
          }
        | null;

      if (!response.ok || !data?.success) {
        setNotice({
          type: "error",
          text:
            data?.message ??
            data?.error ??
            rawText ??
            "保存失败，请稍后重试。",
        });
        return;
      }

      if (data.entry?.updatedAt) {
        setUpdatedAt(data.entry.updatedAt);
      }

      setTitle(data.entry?.title ?? payload.title);
      setSummary(data.entry?.summary ?? payload.summary);
      setContent(data.entry?.content ?? payload.content);
      setChangeNote("");
      setMetaRows(
        createInitialMetaRows(
          (data?.metas ?? payload.metas).map((meta) => ({
            id: "id" in meta ? meta.id : undefined,
            key: meta.key ?? "",
            value: meta.value ?? "",
          }))
        )
      );

      setNotice({
        type: "success",
        text: data?.message ?? "保存成功",
      });
      window.setTimeout(() => {
        router.push("/admin/lore");
      }, 800);
    } catch {
      setNotice({
        type: "error",
        text: "保存失败，请检查网络后重试。",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
        <div className="space-y-2">
          <label
            htmlFor="lore-entry-title"
            className="text-sm font-medium text-zinc-200"
          >
            标题
          </label>
          <input
            id="lore-entry-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-600"
            placeholder="请输入词条标题"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="lore-entry-summary"
            className="text-sm font-medium text-zinc-200"
          >
            摘要
          </label>
          <textarea
            id="lore-entry-summary"
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-600"
            placeholder="请输入词条摘要"
            rows={4}
          />
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-400">
          最近更新时间：{updatedAt}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="lore-entry-content"
            className="text-sm font-medium text-zinc-200"
          >
            正文
          </label>
          <textarea
            id="lore-entry-content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className="min-h-[240px] w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-600"
            placeholder="请输入词条正文"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="lore-entry-change-note"
            className="text-sm font-medium text-zinc-200"
          >
            变更说明
          </label>
          <textarea
            id="lore-entry-change-note"
            value={changeNote}
            onChange={(event) => setChangeNote(event.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-600"
            placeholder="请简要说明这次修改了什么"
            rows={3}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-200">扩展信息</p>
              <p className="text-xs text-zinc-400">
                维护词条的补充信息，只会保存已填写字段名的内容。
              </p>
            </div>

            <button
              type="button"
              onClick={addMetaRow}
              className="inline-flex items-center rounded-lg border border-zinc-700 px-3 py-1.5 text-sm font-medium text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-800"
            >
              新增扩展字段
            </button>
          </div>

          <div className="space-y-3">
            {metaRows.map((row) => (
              <div key={row.id} className="grid gap-3 md:grid-cols-[1fr,1fr,auto]">
                <input
                  value={row.key}
                  onChange={(event) =>
                    updateMetaRow(row.id, "key", event.target.value)
                  }
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-600"
                  placeholder="字段名，例如：所属势力"
                  aria-label="字段名"
                />
                <input
                  value={row.value}
                  onChange={(event) =>
                    updateMetaRow(row.id, "value", event.target.value)
                  }
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-600"
                  placeholder="字段值，例如：李家"
                  aria-label="字段值"
                />
                <button
                  type="button"
                  onClick={() => removeMetaRow(row.id)}
                  className="inline-flex items-center justify-center rounded-xl border border-zinc-700 px-4 py-3 text-sm font-medium text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-800"
                >
                  删除
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

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

      <div className="flex items-center justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center rounded-xl bg-zinc-100 px-5 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving
            ? submitMode === "request"
              ? "提交中..."
              : "保存中..."
            : submitMode === "request"
              ? "提交修改申请"
              : "保存修改"}
        </button>
      </div>
    </form>
  );
}
