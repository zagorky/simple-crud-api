import { createServer, IncomingMessage, ServerResponse } from 'http';
import { db, User } from './db';
import { generateId, parseBody, sendError } from './utils';
import { ERROR_MESSAGES, HEADERS, IndexNotFound, METHODS, ROUTE_REGEX, ROUTES, STATUS_CODES } from './constants';
import { isValidUserBody, isValidUUID } from './utils/type-guards';

export const createAppServer = () => {
  return createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const methods = Object.values(METHODS).join(', ');
    res.setHeader(HEADERS.CONTENT_TYPE, HEADERS.APPLICATION_JSON);
    res.setHeader(HEADERS.ACCESS_CONTROL_ALLOW_ORIGIN, '*');
    res.setHeader(HEADERS.ACCESS_CONTROL_ALLOW_METHODS, methods);
    res.setHeader(HEADERS.ACCESS_CONTROL_ALLOW_HEADERS, HEADERS.CONTENT_TYPE);

    if (req.method === METHODS.OPTIONS) {
      res.writeHead(STATUS_CODES.NO_CONTENT);
      res.end();
      return;
    }

    const url = req.url || '';
    const method = req.method || '';

    if (!url.startsWith(ROUTES.USERS)) {
      res.writeHead(STATUS_CODES.NOT_FOUND);
      res.end(JSON.stringify({ message: ERROR_MESSAGES.NOT_FOUND }));
      return;
    }

    const body = await parseBody(req);

    if (url === ROUTES.USERS && method === METHODS.GET) {
      res.writeHead(STATUS_CODES.OK);
      res.end(JSON.stringify(db));
      return;
    }

    const getMatch = url.match(ROUTE_REGEX);
    if (getMatch && method === METHODS.GET) {
      const id = getMatch[1];
      if (!isValidUUID(id)) {
        return sendError(res, STATUS_CODES.BAD_REQUEST, ERROR_MESSAGES.INVALID_USER_ID);
      }
      const user = db.find((u) => u.id === id);
      if (!user) {
        return sendError(res, STATUS_CODES.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND);
      }
      res.writeHead(STATUS_CODES.OK);
      res.end(JSON.stringify(user));
      return;
    }

    if (url === ROUTES.USERS && method === METHODS.POST) {
      if (!isValidUserBody(body)) {
        return sendError(res, STATUS_CODES.BAD_REQUEST, ERROR_MESSAGES.INVALID_USER_BODY);
      }
      const newUser: User = { id: generateId(), ...body };
      db.push(newUser);
      res.writeHead(STATUS_CODES.CREATED);
      res.end(JSON.stringify(newUser));
      return;
    }

    const putMatch = url.match(ROUTE_REGEX);
    if (putMatch && method === METHODS.PUT) {
      const id = putMatch[1];
      if (!isValidUUID(id)) {
        return sendError(res, STATUS_CODES.BAD_REQUEST, ERROR_MESSAGES.INVALID_USER_ID);
      }
      if (!isValidUserBody(body)) {
        return sendError(res, STATUS_CODES.BAD_REQUEST, ERROR_MESSAGES.INVALID_USER_BODY);
      }
      const index = db.findIndex((u) => u.id === id);
      if (index === IndexNotFound) {
        return sendError(res, STATUS_CODES.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND);
      }
      db[index] = { id, ...body };
      res.writeHead(STATUS_CODES.OK);
      res.end(JSON.stringify(db[index]));
      return;
    }

    const delMatch = url.match(ROUTE_REGEX);
    if (delMatch && method === METHODS.DELETE) {
      const id = delMatch[1];
      if (!isValidUUID(id)) {
        return sendError(res, STATUS_CODES.BAD_REQUEST, ERROR_MESSAGES.INVALID_USER_ID);
      }
      const index = db.findIndex((u) => u.id === id);
      if (index === IndexNotFound) {
        return sendError(res, STATUS_CODES.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND);
      }
      db.splice(index, 1);
      res.writeHead(STATUS_CODES.NO_CONTENT);
      res.end();
      return;
    }

    sendError(res, STATUS_CODES.NOT_FOUND, ERROR_MESSAGES.NOT_FOUND);
  });
};
