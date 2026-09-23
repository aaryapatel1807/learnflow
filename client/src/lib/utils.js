// Simple className utility (no Tailwind required)
export function cn(...inputs) {
  return inputs.filter(Boolean).join(' ');
}
