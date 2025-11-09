import { randomUUID } from 'crypto';
import type { DBCommand, DBResponse, IpcRequest, IpcResponse } from '../types/db';
import { isValidUUID } from '../utils/type-guards';
import { generateId } from '../utils';
import { ERROR_MESSAGES, IndexNotFound } from '../constants';
import type { User } from '../types/user-model';

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

        const [deletedUser] = this.db.splice(deleteIndex, 1);
        return { success: true, data: deletedUser };
      }
    }
  }
}

export const Db = new PrimaryDatabase();

export const executeDbCommand = (command: DBCommand): Promise<DBResponse> => {
  if (typeof process.send !== 'function') {
    try {
      const response = Db.execute(command);
      return Promise.resolve(response);
    } catch {
      return Promise.resolve({ success: false, error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR });
    }
  }

  return new Promise((resolve) => {
    const requestId = randomUUID();

    const onMessage = (msg: unknown) => {
      if (!msg || typeof msg !== 'object') return;
      const { requestId: id, response } = msg as IpcResponse;
      if (id === requestId) {
        process.off('message', onMessage);
        resolve(response);
      }
    };

    process.on('message', onMessage);
    process.send?.({ requestId, command } satisfies IpcRequest);
  });
};
