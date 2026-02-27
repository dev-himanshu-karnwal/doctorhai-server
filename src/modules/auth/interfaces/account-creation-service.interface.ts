import type { AccountEntity } from '../entities';
import type { ClientSession } from 'mongoose';

/**
 * Reusable auth helpers for creating username-based accounts.
 * Used by auth flows (e.g. doctor registration) and by other modules (e.g. hospital creates doctor).
 */
export interface IAccountCreationService {
  /**
   * Throws BusinessRuleViolationException if the username is already taken.
   */
  ensureUsernameAvailable(username: string): Promise<void>;

  /**
   * Creates an account with loginType=username, the given role, and hashed password.
   * Throws if username is taken or role not found.
   */
  createUsernameAccount(
    username: string,
    email: string,
    plainPassword: string,
    roleName: string,
    session?: ClientSession,
  ): Promise<AccountEntity>;
}
