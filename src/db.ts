export type User = {
  id: string;
  username: string;
  age: number;
  hobbies: string[];
};

export const db: User[] = [];

export const generateId = () => crypto.randomUUID();
