import { User } from '../db';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const hasProperty = <K extends string>(
  property: K,
  source: unknown,
): source is {
  [key in K]: unknown;
} => {
  return typeof source === 'object' && source !== null && property in source;
};

export const isString = (data: unknown): data is string => {
  return typeof data === 'string';
};

const isNumber = (data: unknown): data is number => {
  return typeof data === 'number';
};

export const isObject = (data: unknown): data is object => {
  return typeof data === 'object' && data !== null;
};

export const isArray = <T>(data: unknown, itemGuard?: (item: unknown) => item is T): data is T[] => {
  return Array.isArray(data) && (itemGuard ? data.every(itemGuard) : true);
};

export const isValidUserBody = (body: unknown): body is Omit<User, 'id'> =>
  isObject(body) &&
  hasProperty('username', body) &&
  isString(body.username) &&
  hasProperty('age', body) &&
  isNumber(body.age) &&
  hasProperty('hobbies', body) &&
  isArray(body.hobbies) &&
  body.hobbies.every((h: unknown) => typeof h === 'string');

export const isValidUUID = (id: string) => {
  return UUID_REGEX.test(id);
};
