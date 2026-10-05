'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import ContractDocument from './contract-document';
import type { ContractData } from '@/lib/contract-data';
import { contractPdfFileName, renderContractPdf, saveBlob } from '@/lib/contract-pdf';

interface Job {
  data: ContractData;
  signatureUrl?: string | null;
  resolve: () => void;
  reject: (err: unknown) => void;
}

/**
 * Downloads a contract as a PDF file. The pages are rendered off-screen only while
 * the file is being built; `element` must be placed somewhere in the tree.
 */
export function useContractPdf() {
  const [job, setJob] = useState<Job | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!job || !ref.current) return;
    let cancelled = false;
    (async () => {
      try {
        const blob = await renderContractPdf(ref.current!, (done, total) => !cancelled && setProgress({ done, total }));
        saveBlob(blob, contractPdfFileName(job.data.id));
        job.resolve();
      } catch (err) {
        console.error('Contract PDF failed:', err);
        job.reject(err);
      } finally {
        if (!cancelled) {
          setJob(null);
          setProgress(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [job]);

  const download = (data: ContractData, signatureUrl?: string | null) =>
    new Promise<void>((resolve, reject) => setJob({ data, signatureUrl, resolve, reject }));

  const element =
    job && typeof document !== 'undefined'
      ? createPortal(
          <div ref={ref} aria-hidden style={{ position: 'fixed', left: -100000, top: 0, pointerEvents: 'none' }}>
            <ContractDocument contract={job.data} signatureUrl={job.signatureUrl} />
          </div>,
          document.body
        )
      : null;

  return { download, busy: !!job, progress, element };
}

export const contractShareUrl = (token: string) => `${window.location.origin}/c/${token}`;

/** Revokes every customer link issued so far for a contract; resolves with the fresh link's token, or null on failure. */
export async function revokeContractLink(contractId: string): Promise<{ shareToken: string; shareVersion: number } | { error: string }> {
  try {
    const res = await fetch('/api/cars/contracts/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: contractId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.shareToken) return { error: data.error || 'خطا در باطل کردن لینک' };
    return { shareToken: data.shareToken, shareVersion: data.shareVersion };
  } catch {
    return { error: 'خطای ارتباط با سرور' };
  }
}

export const REVOKE_LINK_MESSAGE =
  'همه لینک‌هایی که تا الان برای این قرارداد به مشتری داده‌اید از کار می‌افتد و یک لینک جدید ساخته می‌شود. ادامه می‌دهید؟';
