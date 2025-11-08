import { IncomingMessage, ServerResponse } from 'http';
import { styleText } from 'node:util';

export const sendError = (res: ServerResponse, status: number, message: string) => {
  res.writeHead(status);
  res.end(JSON.stringify({ message }));
};

export const parseBody = (req: IncomingMessage) => {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve({});
      }
    });
  });
};

export const logError = (error: string) => console.log(styleText(['redBright', 'dim'], error));

export const logSuccess = (input: string) => console.log(styleText(['cyanBright', 'dim'], input));

export const generateId = () => crypto.randomUUID();
