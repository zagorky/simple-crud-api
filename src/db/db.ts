import type { User } from '../db';
import type { DBCommand, DBResponse } from '../types/db';
import { isValidUUID } from '../utils/type-guards';
import { generateId } from '../utils';
import { ERROR_MESSAGES, IndexNotFound } from '../constants';

class PrimaryDatabase {
  private db: User[] = [];

  execute(command: DBCommand): DBResponse {
    switch (command.type) {
      case 'GET_ALL':
        return { success: true, data: [...this.db] };

      case 'GET_BY_ID': {
        if (!isValidUUID(command.id)) {
          return { success: false, error: ERROR_MESSAGES.INVALID_USER_ID };
        }
        const user = this.db.find((u) => u.id === command.id);
        return { success: true, data: user ?? null };
      }

      case 'CREATE': {
        const newUser: User = { id: generateId(), ...command.data };
        this.db.push(newUser);
        return { success: true, data: newUser };
      }

      case 'UPDATE': {
        if (!isValidUUID(command.id)) {
          return { success: false, error: ERROR_MESSAGES.INVALID_USER_ID };
        }
        const index = this.db.findIndex((u) => u.id === command.id);
        if (index === IndexNotFound) {
          return { success: true, data: null };
        }
        this.db[index] = { id: command.id, ...command.data };
        return { success: true, data: this.db[index] };
      }
      case 'DELETE': {
        if (!isValidUUID(command.id)) {
          return { success: false, error: ERROR_MESSAGES.INVALID_USER_ID };
        }
        const deleteIndex = this.db.findIndex((u) => u.id === command.id);
        if (deleteIndex === IndexNotFound) {
          return { success: true, data: null };
        }
        this.db.splice(deleteIndex, 1);
        return { success: true, data: null };
      }
    }
  }
}

export const primaryDb = new PrimaryDatabase();
