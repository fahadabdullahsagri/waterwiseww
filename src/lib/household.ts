const KEY = "waterwise.household";

/**
 * A random id kept only in this browser. It scopes a visitor's own readings
 * without asking anyone to create an account.
 */
export function getHouseholdId(): string {
  if (typeof window === "undefined") return "server";
  let id = window.localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(KEY, id);
  }
  return id;
}
