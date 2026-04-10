export type FamilyMemberContractRow = {
  id: string;
  family_id: string;
  user_id: string | null;
  invited_by?: string | null;
  status: string;
};

export function getAcceptedFamilyRecipientIds(
  rows: FamilyMemberContractRow[],
  storytellerUserId: string
): string[] {
  const seen = new Set<string>();

  for (const row of rows) {
    if (row.family_id !== storytellerUserId) continue;
    if (row.status !== 'accepted') continue;
    if (!row.user_id) continue;
    if (row.user_id === storytellerUserId) continue;
    seen.add(row.user_id);
  }

  return Array.from(seen);
}

export function getFamilyMemberRowIdsForCleanup(
  rows: FamilyMemberContractRow[],
  requestedUserId: string
): string[] {
  return rows
    .filter(
      (row) =>
        row.family_id === requestedUserId ||
        row.user_id === requestedUserId ||
        row.invited_by === requestedUserId
    )
    .map((row) => row.id);
}
