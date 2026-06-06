import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Cloudinary file helpers ───────────────────────────────────────────────────
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Returns a URL that force-downloads a Cloudinary file via our backend proxy.
 * Works for raw/PDF files that Cloudinary won't serve with fl_attachment.
 */
export const getDownloadUrl = (cloudinaryUrl: string, filename?: string): string => {
  if (!cloudinaryUrl) return '';
  const params = new URLSearchParams({ url: cloudinaryUrl });
  if (filename) params.set('name', filename);
  return `${API_BASE}/api/files/download?${params}`;
};

/**
 * Returns a URL that opens a Cloudinary PDF inline in the browser.
 */
export const getViewUrl = (cloudinaryUrl: string): string => {
  if (!cloudinaryUrl) return '';
  return `${API_BASE}/api/files/view?url=${encodeURIComponent(cloudinaryUrl)}`;
};
