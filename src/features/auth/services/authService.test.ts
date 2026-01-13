import { signInWithEmailPassword, signOut } from './authService';
import { supabase } from '@/lib/supabase';

describe('authService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('signInWithEmailPassword', () => {
        it('should sign in successfully', async () => {
            const mockUser = { id: '123', email: 'test@test.com' };
            (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
                data: { session: { user: mockUser } },
                error: null,
            });

            const user = await signInWithEmailPassword('test@test.com', 'password');
            expect(user).toEqual(mockUser);
            expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
                email: 'test@test.com',
                password: 'password',
            });
        });

        it('should throw error if email is empty', async () => {
            await expect(signInWithEmailPassword('', 'pass')).rejects.toThrow('enter both');
        });

        it('should throw error on api failure', async () => {
            (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
                data: { session: null },
                error: { message: 'Invalid Login Credentials' },
            });

            await expect(signInWithEmailPassword('test@test.com', 'wrong')).rejects.toThrow('incorrect');
        });
    });

    describe('signOut', () => {
        it('should sign out successfully', async () => {
            (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });
            await signOut();
            expect(supabase.auth.signOut).toHaveBeenCalled();
        });
    });
});
