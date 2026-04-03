"use client";

import Link from "next/link";
import { useState } from "react";

type Notice =
  | { type: "success"; text: string }
  | { type: "error"; text: string }
  | null;

function parseJsonSafely(text: string) {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

export default function HomeBriefingCard({
  title,
  content,
  updatedAtLabel,
  canEdit,
  canManageEditors,
}: {
  title: string;
  content: string;
  updatedAtLabel: string;
  canEdit: boolean;
  canManageEditors: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title);
  const [draftContent, setDraftContent] = useState(content);
  const [notice, setNotice] = useState<Notice>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    setNotice(null);
    setIsSaving(true);

    try {
      const response = await fetch("/api/home-briefing", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: draftTitle,
          content: draftContent,
        }),
      });

      const rawText = await response.text();
      const data = parseJsonSafely(rawText) as
        | {
            success?: boolean;
            message?: string;
          }
        | null;

      if (!response.ok || data?.success === false) {
        setNotice({
          type: "error",
          text: data?.message ?? "更新失败，请稍后重试。",
        });
        return;
      }

      setNotice({
        type: "success",
        text: data?.message ?? "快报已更新。",
      });
      setIsEditing(false);
      window.location.reload();
    } catch {
      setNotice({
        type: "error",
        text: "更新失败，请检查网络后重试。",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="rounded-[28px] border border-[rgba(177,145,87,0.14)] bg-[linear-gradient(180deg,rgba(30,35,34,0.92)_0%,rgba(16,20,20,0.96)_100%)] p-5 shadow-[0_18px_34px_rgba(0,0,0,0.12)] sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs section-kicker">玄鉴快报</p>
          {isEditing ? (
            <input
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              placeholder="快报标题"
              className="w-full max-w-3xl rounded-xl border border-[rgba(118,137,129,0.18)] bg-[rgba(13,18,17,0.72)] px-4 py-3 text-lg font-semibold text-[#ece2bf] outline-none transition focus:border-[rgba(177,145,87,0.22)] sm:text-2xl"
            />
          ) : (
            <h2 className="text-xl font-semibold tracking-tight text-[#ece2bf] sm:text-2xl">
              {title}
            </h2>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="inline-flex items-center rounded-full border border-[rgba(126,165,154,0.18)] bg-[rgba(126,165,154,0.08)] px-3 py-1 text-xs font-medium text-[#cfdbd5]">
            最近更新：{updatedAtLabel}
          </span>
          {canManageEditors ? (
            <Link
              href="/admin/briefing"
              className="inline-flex items-center rounded-full border border-[rgba(126,165,154,0.18)] bg-[rgba(126,165,154,0.06)] px-3 py-1 text-xs font-medium text-[#cfdbd5] transition hover:border-[rgba(177,145,87,0.2)] hover:text-white"
            >
              权限管理
            </Link>
          ) : null}
          {canEdit ? (
            <button
              type="button"
              onClick={() => {
                setNotice(null);
                setIsEditing((current) => !current);
                setDraftTitle(title);
                setDraftContent(content);
              }}
              className="inline-flex items-center rounded-full border border-[rgba(177,145,87,0.18)] bg-[rgba(177,145,87,0.06)] px-3 py-1 text-xs font-medium text-[#ecd8a6] transition hover:bg-[rgba(177,145,87,0.12)]"
            >
              {isEditing ? "取消编辑" : "编辑快报"}
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-5">
        {notice ? (
          <div
            className={
              notice.type === "success"
                ? "mb-4 rounded-xl border border-emerald-800 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-300"
                : "mb-4 rounded-xl border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-300"
            }
          >
            {notice.text}
          </div>
        ) : null}

        {isEditing ? (
          <div className="space-y-4">
            <textarea
              value={draftContent}
              onChange={(event) => setDraftContent(event.target.value)}
              placeholder="填写玄鉴快报正文"
              rows={8}
              className="w-full rounded-[20px] border border-[rgba(118,137,129,0.18)] bg-[rgba(13,18,17,0.72)] px-4 py-4 text-sm leading-7 text-[#d3d8cf] outline-none transition focus:border-[rgba(177,145,87,0.22)]"
            />
            <div className="flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSave}
                className="inline-flex items-center rounded-full bg-[rgba(177,145,87,0.92)] px-5 py-2.5 text-sm font-medium text-[#171208] transition hover:bg-[#dbc189] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "保存中..." : "保存快报"}
              </button>
            </div>
          </div>
        ) : (
          <p className="whitespace-pre-wrap text-sm leading-8 text-[#d3d8cf]">
            {content}
          </p>
        )}
      </div>
    </div>
  );
}
