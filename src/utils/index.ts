import type { IncomingMessage, ServerResponse } from 'http';
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

export const logError = (error: string) => console.log(styleText(['redBright'], error));
export const logInfo = (input: string) => console.log(styleText(['cyanBright'], input));
export const logSuccess = (input: string) => console.log(styleText(['magentaBright'], input));

export const generateId = () => crypto.randomUUID();

export const logger = {
  info: (msg: string, meta?: string) => logInfo(`[INFO] ${new Date().toISOString()} | ${msg} , ${meta || ''}`),
  error: (msg: string, meta?: string) => logError(`[ERROR] ${new Date().toISOString()} | ${msg} , ${meta || ''}`),
  request: (method: string, url: string, status?: number) => {
    const timestamp = new Date().toISOString();
    const statusStr = status ? `→ ${status}` : '';
    logSuccess(`[REQ] ${timestamp} | ${method} ${url} ${statusStr}`);
  },
};
