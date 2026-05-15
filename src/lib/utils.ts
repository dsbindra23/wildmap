import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(iso: string, from?: string, to?: string): string {
  if (iso) {
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (match) {
      const h = match[1] ? `${match[1]}h` : "";
      const m = match[2] ? `${match[2]}m` : "";
      const result = [h, m].filter(Boolean).join(" ");
      if (result) return result;
    }
  }
  if (from && to) {
    const diff = new Date(to).getTime() - new Date(from).getTime();
    if (diff > 0) {
      const totalMin = Math.round(diff / 60000);
      const h = Math.floor(totalMin / 60);
      const m = totalMin % 60;
      return [h ? `${h}h` : "", m ? `${m}m` : ""].filter(Boolean).join(" ");
    }
  }
  return "—";
}

export function formatTime(dateStr: string): string {
  if (!dateStr) return "—";
  // Parse time directly from ISO string to avoid timezone shifting
  const match = dateStr.match(/T(\d{2}):(\d{2})/);
  if (match) {
    let h = parseInt(match[1]);
    const m = match[2];
    const period = h >= 12 ? "PM" : "AM";
    if (h === 0) h = 12;
    else if (h > 12) h -= 12;
    return `${h}:${m} ${period}`;
  }
  return new Date(dateStr).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function formatPrice(amount: string, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(parseFloat(amount));
}
