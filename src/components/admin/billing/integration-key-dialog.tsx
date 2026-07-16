"use client";

import { useState } from "react";
import { Check, Copy, KeyRound, TriangleAlert, X } from "lucide-react";

export type IntegrationKeyDialogProps = {
  credential: {
    publicId: string;
    secret: string;
    keyVersion: number;
  };
  onClose: () => void;
};

export function IntegrationKeyDialog({
  credential,
  onClose,
}: IntegrationKeyDialogProps) {
  const [copied, setCopied] = useState(false);

  async function copySecret(): Promise<void> {
    await navigator.clipboard.writeText(credential.secret);
    setCopied(true);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="integration-key-title"
      className="fixed inset-0 z-50 grid place-items-center bg-ink/55 p-4"
    >
      <div className="w-full max-w-xl rounded-3xl bg-white p-5 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-brand-blue/10 text-brand-blue">
              <KeyRound className="size-5" aria-hidden />
            </span>
            <div>
              <h2 id="integration-key-title" className="font-black text-ink">
                사이트 연동 비밀키
              </h2>
              <p className="mt-1 text-xs text-ink/50">
                키 버전 {credential.keyVersion}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="비밀키 창 닫기"
            className="grid size-11 place-items-center rounded-full text-ink/50 hover:bg-ink/5"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <div className="mt-5 flex gap-3 rounded-2xl bg-brand-yellow/15 p-4 text-sm leading-6 text-ink">
          <TriangleAlert className="mt-0.5 size-5 shrink-0 text-brand-yellow" aria-hidden />
          <p>
            이 비밀키는 지금 한 번만 표시됩니다. 창을 닫으면 다시 확인할 수
            없으므로 고객사 서버의 안전한 환경변수 저장소에 먼저 보관하세요.
          </p>
        </div>

        <dl className="mt-5 grid gap-4">
          <div>
            <dt className="text-xs font-bold text-ink/55">공개 ID</dt>
            <dd className="mt-1 break-all rounded-xl bg-ivory p-3 font-mono text-sm text-ink">
              {credential.publicId}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-bold text-ink/55">비밀키</dt>
            <dd className="mt-1 break-all rounded-xl bg-ink p-3 font-mono text-sm text-white">
              {credential.secret}
            </dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-full border border-ink/15 px-5 text-sm font-bold text-ink"
          >
            저장 완료 후 닫기
          </button>
          <button
            type="button"
            onClick={copySecret}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-brand-blue px-5 text-sm font-bold text-white"
          >
            {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
            {copied ? "복사됨" : "비밀키 복사"}
          </button>
        </div>
      </div>
    </div>
  );
}
