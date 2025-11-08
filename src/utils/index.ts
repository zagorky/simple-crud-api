import { IncomingMessage, ServerResponse } from 'http';

export const ROUTE_REGEX = /^\/api\/users\/([a-f0-9\-]+)$/;

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
