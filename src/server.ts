import {createServer, IncomingMessage, ServerResponse} from 'http';
import {db, User} from './db';
import {generateId, parseBody, sendError} from './utils';
import {ERROR_MESSAGES, HEADERS, IndexNotFound, METHODS, ROUTE_REGEX, ROUTES, STATUS_CODES} from './constants';
import {isValidUserBody, isValidUUID} from './utils/type-guards';

const setHeaders = (res: ServerResponse) => {
  const methods = Object.values(METHODS).join(', ');
  res.setHeader(HEADERS.CONTENT_TYPE, HEADERS.APPLICATION_JSON);
  res.setHeader(HEADERS.ACCESS_CONTROL_ALLOW_ORIGIN, '*');
  res.setHeader(HEADERS.ACCESS_CONTROL_ALLOW_METHODS, methods);
  res.setHeader(HEADERS.ACCESS_CONTROL_ALLOW_HEADERS, HEADERS.CONTENT_TYPE);
};

export const createAppServer = () => {
  return createServer(async (req: IncomingMessage, res: ServerResponse) => {
    setHeaders(res);

    const url = req.url || '';
    const method = req.method || '';

    if (method === METHODS.OPTIONS) {
      res.writeHead(STATUS_CODES.NO_CONTENT);
      return res.end();
    }

    if (!url.startsWith(ROUTES.USERS)) {
      return sendError(res, STATUS_CODES.NOT_FOUND, ERROR_MESSAGES.NOT_FOUND);
    }

    const idMatch = url.match(ROUTE_REGEX);
    const id = idMatch ? idMatch[1] : null;

    if (id && !isValidUUID(id)) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, ERROR_MESSAGES.INVALID_USER_ID);
    }

    let body: any;
    try {
      body = await parseBody(req);
    } catch {
      return sendError(res, STATUS_CODES.BAD_REQUEST, ERROR_MESSAGES.INVALID_JSON);
    }

    if (url === ROUTES.USERS && method === METHODS.GET) {
      res.writeHead(STATUS_CODES.OK);
      return res.end(JSON.stringify(db));
    }

    if (url === ROUTES.USERS && method === METHODS.POST) {
      if (!isValidUserBody(body)) {
        return sendError(res, STATUS_CODES.BAD_REQUEST, ERROR_MESSAGES.INVALID_USER_BODY);
      }
      const user: User = { id: generateId(), ...body };
      db.push(user);
      res.writeHead(STATUS_CODES.CREATED);
      return res.end(JSON.stringify(user));
    }

    if (id) {
      const index = db.findIndex((u) => u.id === id);

      if (method === METHODS.GET) {
        if (index === IndexNotFound) {
          return sendError(res, STATUS_CODES.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND);
        }
        res.writeHead(STATUS_CODES.OK);
        return res.end(JSON.stringify(db[index]));
      }

      if (method === METHODS.PUT) {
        if (!isValidUserBody(body)) {
          return sendError(res, STATUS_CODES.BAD_REQUEST, ERROR_MESSAGES.INVALID_USER_BODY);
        }
        if (index === IndexNotFound) {
          return sendError(res, STATUS_CODES.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND);
        }
        db[index] = { id, ...body };
        res.writeHead(STATUS_CODES.OK);
        return res.end(JSON.stringify(db[index]));
      }

      if (method === METHODS.DELETE) {
        if (index === IndexNotFound) {
          return sendError(res, STATUS_CODES.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND);
        }
        db.splice(index, 1);
        res.writeHead(STATUS_CODES.NO_CONTENT);
        return res.end();
      }
    }

    return sendError(res, STATUS_CODES.NOT_FOUND, ERROR_MESSAGES.NOT_FOUND);
  });
};
