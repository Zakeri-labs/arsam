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
