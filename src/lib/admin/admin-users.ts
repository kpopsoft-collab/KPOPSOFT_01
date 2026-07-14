export function normalizeAdminEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function parseAdminSeedEmails(value: string): string[] {
  const emails = value
    .split(",")
    .map(normalizeAdminEmail)
    .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));

  if (emails.length === 0) {
    throw new Error(
      "ADMIN_SEED_EMAILS must contain at least one valid email",
    );
  }

  return [...new Set(emails)];
}

export function canDeactivateAdmin(
  activeCount: number,
  targetActive: boolean,
): boolean {
  return !targetActive || activeCount > 1;
}
