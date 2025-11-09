import type { User, UserId, UserWithoutId } from './user-model';

export type DBCommand =
  | { type: 'GET_ALL' }
  | { type: 'GET_BY_ID'; id: UserId }
  | { type: 'CREATE'; data: UserWithoutId }
  | { type: 'UPDATE'; id: UserId; data: UserWithoutId }
  | { type: 'DELETE'; id: UserId };

export type DBResponse = { success: true; data: User[] | User | null } | { success: false; error: string };

export type IpcRequest = { requestId: string; command: DBCommand };
export type IpcResponse = { requestId: string; response: DBResponse };
