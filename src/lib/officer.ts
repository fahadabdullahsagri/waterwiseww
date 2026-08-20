const KEY = "waterwise.officer";

/** The approving officer's name — every human-gated action is stamped with it. */
export function getOfficer(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(KEY);
}

export function setOfficer(name: string) {
  window.localStorage.setItem(KEY, name.trim());
}

export function clearOfficer() {
  window.localStorage.removeItem(KEY);
}
