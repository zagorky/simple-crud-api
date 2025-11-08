import { createServer, type IncomingMessage, type ServerResponse } from 'http';
import type { User } from './db';
import { db } from './db';
import { generateId, logger, parseBody, sendError } from './utils';
import { ERROR_MESSAGES, HEADERS, IndexNotFound, METHODS, ROUTE_REGEX, ROUTES, STATUS_CODES } from './constants';
import { isValidUserBody, isValidUUID } from './utils/type-guards';

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
      logger.request(method, url, STATUS_CODES.NO_CONTENT);
      res.writeHead(STATUS_CODES.NO_CONTENT);
      return res.end();
    }

    if (!url.startsWith(ROUTES.USERS)) {
      logger.error(ERROR_MESSAGES.NOT_FOUND, url);
      return sendError(res, STATUS_CODES.NOT_FOUND, ERROR_MESSAGES.NOT_FOUND);
    }

    const idMatch = url.match(ROUTE_REGEX);
    const id = idMatch ? idMatch[1] : null;

    if (id && !isValidUUID(id)) {
      logger.error(ERROR_MESSAGES.INVALID_USER_ID, url);
      return sendError(res, STATUS_CODES.BAD_REQUEST, ERROR_MESSAGES.INVALID_USER_ID);
    }

    let body;
    try {
      body = await parseBody(req);
    } catch {
      logger.error(ERROR_MESSAGES.INVALID_JSON, url);
      return sendError(res, STATUS_CODES.BAD_REQUEST, ERROR_MESSAGES.INVALID_JSON);
    }

    if (url === ROUTES.USERS && method === METHODS.GET) {
      logger.request(method, url, STATUS_CODES.OK);
      logger.info(`Fetching all users. Total users: ${db.length}`);
      res.writeHead(STATUS_CODES.OK);
      return res.end(JSON.stringify(db));
    }

    if (url === ROUTES.USERS && method === METHODS.POST) {
      logger.request(method, url, STATUS_CODES.CREATED);
      if (!isValidUserBody(body)) {
        logger.error(ERROR_MESSAGES.INVALID_USER_BODY, `Body: ${JSON.stringify(body)}`);
        return sendError(res, STATUS_CODES.BAD_REQUEST, ERROR_MESSAGES.INVALID_USER_BODY);
      }
      const user: User = { id: generateId(), ...body };
      db.push(user);
      logger.info(`User created successfully. ID: ${user.id}, Username: ${user.username}, Age: ${user.age}`);
      res.writeHead(STATUS_CODES.CREATED);
      return res.end(JSON.stringify(user));
    }

    if (id) {
      const index = db.findIndex((u) => u.id === id);

      if (method === METHODS.GET) {
        logger.request(method, url, STATUS_CODES.OK);
        if (index === IndexNotFound) {
          logger.error(ERROR_MESSAGES.USER_NOT_FOUND, `User ID: ${id}`);
          return sendError(res, STATUS_CODES.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND);
        }
        logger.info(`User retrieved. ID: ${id}`);
        res.writeHead(STATUS_CODES.OK);
        return res.end(JSON.stringify(db[index]));
      }

      if (method === METHODS.PUT) {
        logger.request(method, url, STATUS_CODES.OK);
        if (!isValidUserBody(body)) {
          logger.error(ERROR_MESSAGES.INVALID_USER_BODY, `User ID: ${id}, Body: ${JSON.stringify(body)}`);
          return sendError(res, STATUS_CODES.BAD_REQUEST, ERROR_MESSAGES.INVALID_USER_BODY);
        }
        if (index === IndexNotFound) {
          logger.error(ERROR_MESSAGES.USER_NOT_FOUND, `User ID: ${id}`);
          return sendError(res, STATUS_CODES.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND);
        }
        const oldUser = { ...db[index] };
        db[index] = { id, ...body };
        logger.info(`User updated. ID: ${id}, Old: ${JSON.stringify(oldUser)}, New: ${JSON.stringify(db[index])}`);
        res.writeHead(STATUS_CODES.OK);
        return res.end(JSON.stringify(db[index]));
      }

      if (method === METHODS.DELETE) {
        logger.request(method, url, STATUS_CODES.NO_CONTENT);
        if (index === IndexNotFound) {
          logger.error(ERROR_MESSAGES.USER_NOT_FOUND, `User ID: ${id}`);
          return sendError(res, STATUS_CODES.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND);
        }
        const deletedUser = db[index];
        db.splice(index, 1);
        logger.info(`User deleted. ID: ${id}, User: ${JSON.stringify(deletedUser)}`);
        res.writeHead(STATUS_CODES.NO_CONTENT);
        return res.end();
      }
    }

    return sendError(res, STATUS_CODES.NOT_FOUND, ERROR_MESSAGES.NOT_FOUND);
  });
};
