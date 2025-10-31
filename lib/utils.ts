import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function toDateOnlyISO(d: Date) {
  return d.toISOString().split("T")[0];
}

