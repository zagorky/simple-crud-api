import {createServer, IncomingMessage, ServerResponse} from 'http';
import {db, User} from './db';
import {generateId, logger, parseBody, sendError} from './utils';
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
    const url = req.url || '';
    const method = req.method || '';

    setHeaders(res);
    logger.request(method, url);

    if (method === METHODS.OPTIONS) {
      res.writeHead(STATUS_CODES.NO_CONTENT);
      res.end();
      return;
    }

    if (!url.startsWith(ROUTES.USERS)) {
      logger.request(method, url, STATUS_CODES.NOT_FOUND);
      return sendError(res, STATUS_CODES.NOT_FOUND, ERROR_MESSAGES.NOT_FOUND);
    }

    let body: any;
    try {
      body = await parseBody(req);
    } catch (err) {
      logger.error(ERROR_MESSAGES.PARSE_BODY_ERROR, { url, err });
      return sendError(res, STATUS_CODES.BAD_REQUEST, ERROR_MESSAGES.INVALID_JSON);
    }

    const match = url.match(ROUTE_REGEX);
    const id = match?.[1];

    if (url === ROUTES.USERS && method === METHODS.GET) {
      logger.request(method, url, 200);
      res.writeHead(STATUS_CODES.OK);
      return res.end(JSON.stringify(db));
    }

    if (id && [METHODS.GET, METHODS.PUT, METHODS.DELETE].includes(method)) {
      if (!isValidUUID(id)) {
        logger.request(method, url, 400);
        return sendError(res, STATUS_CODES.BAD_REQUEST, ERROR_MESSAGES.INVALID_USER_ID);
      }
    }

    if ([METHODS.PUT, METHODS.POST].includes(method)) {
      if (!isValidUserBody(body)) {
        logger.request(method, url, STATUS_CODES.BAD_REQUEST);
        return sendError(res, STATUS_CODES.BAD_REQUEST, ERROR_MESSAGES.INVALID_USER_BODY);
      }
    }

    if (url === ROUTES.USERS && method === METHODS.POST) {
      const newUser: User = { id: generateId(), ...body };
      db.push(newUser);
      logger.info('User created', { id: newUser.id, username: newUser.username });
      res.writeHead(STATUS_CODES.CREATED);
      res.end(JSON.stringify(newUser));
      logger.request(method, url, STATUS_CODES.CREATED);
      return;
    }

    if (id && method === METHODS.PUT) {
      const index = db.findIndex((u) => u.id === id);
      if (index === IndexNotFound) {
        logger.request(method, url, STATUS_CODES.NOT_FOUND);
        return sendError(res, STATUS_CODES.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND);
      }
      db[index] = { id, ...body };
      res.writeHead(STATUS_CODES.OK);
      res.end(JSON.stringify(db[index]));
      logger.request(method, url, STATUS_CODES.OK);
      return;
    }

    if (id && method === METHODS.GET) {
      const user = db.find((u) => u.id === id);
      if (!user) {
        logger.request(method, url, STATUS_CODES.NOT_FOUND);
        return sendError(res, STATUS_CODES.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND);
      }
      res.writeHead(STATUS_CODES.OK);
      res.end(JSON.stringify(user));
      logger.request(method, url, STATUS_CODES.OK);
      return;
    }

    if (id && method === METHODS.DELETE) {
      const index = db.findIndex((u) => u.id === id);
      if (index === IndexNotFound) {
        logger.request(method, url, STATUS_CODES.NOT_FOUND);
        return sendError(res, STATUS_CODES.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND);
      }
      const deleted = db.splice(index, 1)[0];
      logger.info('User deleted', { id: deleted.id });
      res.writeHead(STATUS_CODES.NO_CONTENT);
      res.end();
      logger.request(method, url, STATUS_CODES.NO_CONTENT);
      return;
    }

    logger.request(method, url, STATUS_CODES.NOT_FOUND);
    sendError(res, STATUS_CODES.NOT_FOUND, ERROR_MESSAGES.NOT_FOUND);
  });
};
