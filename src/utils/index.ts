import {UUID_REGEX} from '../constants';
import {User} from '../db';

export const isValidUUID = (id: string) => {
    return UUID_REGEX.test(id);
};

export const isValidUserBody = (body: Record<PropertyKey, unknown>): body is Omit<User, 'id'> =>
    typeof body.username === 'string' &&
    typeof body.age === 'number' &&
    Array.isArray(body.hobbies) &&
    body.hobbies.every((h: any) => typeof h === 'string');
