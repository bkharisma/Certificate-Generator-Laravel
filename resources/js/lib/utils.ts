import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function sanitizeHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&laquo;/g, '\u00AB').replace(/&raquo;/g, '\u00BB').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&#039;/g, "'").replace(/&quot;/g, '"')
}
