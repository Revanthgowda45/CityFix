import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Removes metadata tags from description text
 */
export function cleanDescription(description: string): string {
  if (!description) return '';
  // Remove [original_category:xxx] tags
  return description.replace(/\[original_category:.*?\]/g, '');
}
