import type { User, UserId } from './user-model';

export type DBCommand =
  | { type: 'GET_ALL' }
  | { type: 'GET_BY_ID'; id: UserId }
  | { type: 'CREATE'; data: Omit<User, 'id'> }
  | { type: 'UPDATE'; id: UserId; data: Omit<User, 'id'> }
  | { type: 'DELETE'; id: UserId };

export type DBResponse = { success: true; data: User[] | User | null } | { success: false; error: string };
