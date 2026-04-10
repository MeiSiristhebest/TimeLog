import {
  getAcceptedFamilyRecipientIds,
  getFamilyMemberRowIdsForCleanup,
  type FamilyMemberContractRow,
} from './family-contract';

describe('family-contract helpers', () => {
  describe('getAcceptedFamilyRecipientIds', () => {
    it('returns accepted linked family member user ids and excludes the storyteller', () => {
      const rows: FamilyMemberContractRow[] = [
        { id: 'admin-self', family_id: 'senior-1', user_id: 'senior-1', status: 'accepted' },
        { id: 'member-1', family_id: 'senior-1', user_id: 'family-1', status: 'accepted' },
        { id: 'member-2', family_id: 'senior-1', user_id: 'family-2', status: 'accepted' },
        { id: 'pending-1', family_id: 'senior-1', user_id: 'family-3', status: 'pending' },
        { id: 'other-family', family_id: 'senior-2', user_id: 'family-9', status: 'accepted' },
        { id: 'null-user', family_id: 'senior-1', user_id: null, status: 'accepted' },
      ];

      expect(getAcceptedFamilyRecipientIds(rows, 'senior-1')).toEqual(['family-1', 'family-2']);
    });

    it('deduplicates accepted family members', () => {
      const rows: FamilyMemberContractRow[] = [
        { id: 'member-1', family_id: 'senior-1', user_id: 'family-1', status: 'accepted' },
        { id: 'member-2', family_id: 'senior-1', user_id: 'family-1', status: 'accepted' },
      ];

      expect(getAcceptedFamilyRecipientIds(rows, 'senior-1')).toEqual(['family-1']);
    });
  });

  describe('getFamilyMemberRowIdsForCleanup', () => {
    it('returns rows tied to a deleted user by family ownership, membership, or invite ownership', () => {
      const rows: FamilyMemberContractRow[] = [
        { id: 'owned-family-admin', family_id: 'user-1', user_id: 'user-1', status: 'accepted' },
        { id: 'owned-family-member', family_id: 'user-1', user_id: 'member-1', status: 'accepted' },
        { id: 'self-membership', family_id: 'user-2', user_id: 'user-1', status: 'accepted' },
        { id: 'sent-invite', family_id: 'user-3', user_id: null, invited_by: 'user-1', status: 'pending' },
        { id: 'unrelated', family_id: 'user-9', user_id: 'member-9', invited_by: 'user-9', status: 'accepted' },
      ];

      expect(getFamilyMemberRowIdsForCleanup(rows, 'user-1')).toEqual([
        'owned-family-admin',
        'owned-family-member',
        'self-membership',
        'sent-invite',
      ]);
    });
  });
});
