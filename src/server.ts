import { createServer, type IncomingMessage, type ServerResponse } from 'http';
import { logger, parseBody, sendError } from './utils';
import { ERROR_MESSAGES, HEADERS, METHODS, ROUTE_REGEX, ROUTES, STATUS_CODES } from './constants';
import { isValidUserBody, isValidUUID } from './utils/type-guards';
import { executeDbCommand } from './db/db';

const setHeaders = (res: ServerResponse) => {
  const methods = Object.values(METHODS).join(', ');
  res.setHeader(HEADERS.CONTENT_TYPE, HEADERS.APPLICATION_JSON);
  res.setHeader(HEADERS.ACCESS_CONTROL_ALLOW_ORIGIN, '*');
  res.setHeader(HEADERS.ACCESS_CONTROL_ALLOW_METHODS, methods);
  res.setHeader(HEADERS.ACCESS_CONTROL_ALLOW_HEADERS, HEADERS.CONTENT_TYPE);
};

export const addHandler = async (req: IncomingMessage, res: ServerResponse) => {
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
    const result = await executeDbCommand({ type: 'GET_ALL' });
    if (!result.success) {
      return sendError(res, STATUS_CODES.INTERNAL_SERVER_ERROR, result.error);
    }

    logger.request(method, url, STATUS_CODES.OK);
    logger.info(`Fetching all users.`);
    res.writeHead(STATUS_CODES.OK);
    return res.end(JSON.stringify(result.data));
  }

  if (url === ROUTES.USERS && method === METHODS.POST) {
    if (!isValidUserBody(body)) {
      logger.error(ERROR_MESSAGES.INVALID_USER_BODY, `Body: ${JSON.stringify(body)}`);
      return sendError(res, STATUS_CODES.BAD_REQUEST, ERROR_MESSAGES.INVALID_USER_BODY);
    }
    const result = await executeDbCommand({ type: 'CREATE', data: body });
    if (!result.success) {
      logger.error(ERROR_MESSAGES.INTERNAL_SERVER_ERROR, `Error: ${result.error}`);
      return sendError(res, STATUS_CODES.INTERNAL_SERVER_ERROR, result.error);
    }

    logger.request(method, url, STATUS_CODES.CREATED);
    logger.info(`User created successfully. ${JSON.stringify(result.data)}`);
    res.writeHead(STATUS_CODES.CREATED);
    return res.end(JSON.stringify(result.data));
  }

  if (id) {
    if (method === METHODS.GET) {
      const result = await executeDbCommand({ type: 'GET_BY_ID', id });
      if (!result.success) {
        logger.error(ERROR_MESSAGES.INTERNAL_SERVER_ERROR, `Error: ${result.error}`);
        return sendError(res, STATUS_CODES.INTERNAL_SERVER_ERROR, result.error);
      }
      if (!result.data) {
        logger.error(ERROR_MESSAGES.USER_NOT_FOUND, `User ID: ${id}`);
        return sendError(res, STATUS_CODES.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND);
      }
      logger.request(method, url, STATUS_CODES.OK);
      logger.info(`User retrieved. ID: ${id}`);
      res.writeHead(STATUS_CODES.OK);
      return res.end(JSON.stringify(result.data));
    }

    if (method === METHODS.PUT) {
      if (!isValidUserBody(body)) {
        logger.error(ERROR_MESSAGES.INVALID_USER_BODY, `User ID: ${id}, Body: ${JSON.stringify(body)}`);
        return sendError(res, STATUS_CODES.BAD_REQUEST, ERROR_MESSAGES.INVALID_USER_BODY);
      }
      const result = await executeDbCommand({ type: 'UPDATE', id, data: body });

      if (!result.success) {
        logger.error(ERROR_MESSAGES.INTERNAL_SERVER_ERROR, `Error: ${result.error}`);
        return sendError(res, STATUS_CODES.INTERNAL_SERVER_ERROR, result.error);
      }

      if (!result.data) {
        logger.error(ERROR_MESSAGES.USER_NOT_FOUND, `User ID: ${id}`);
        return sendError(res, STATUS_CODES.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND);
      }

      logger.request(method, url, STATUS_CODES.OK);
      logger.info(`User updated. ID: ${id}`);
      res.writeHead(STATUS_CODES.OK);
      return res.end(JSON.stringify(result.data));
    }

    if (method === METHODS.DELETE) {
      const result = await executeDbCommand({ type: 'DELETE', id });

      if (!result.success) {
        logger.error(ERROR_MESSAGES.INTERNAL_SERVER_ERROR, `Error: ${result.error}`);
        return sendError(res, STATUS_CODES.INTERNAL_SERVER_ERROR, result.error);
      }

      if (result.data === null && result.success) {
        logger.error(ERROR_MESSAGES.USER_NOT_FOUND, `User ID: ${id}`);
        return sendError(res, STATUS_CODES.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND);
      }

      logger.request(method, url, STATUS_CODES.NO_CONTENT);
      logger.info(`User deleted. ID: ${id}`);
      res.writeHead(STATUS_CODES.NO_CONTENT);
      return res.end();
    }
  }

  return sendError(res, STATUS_CODES.NOT_FOUND, ERROR_MESSAGES.NOT_FOUND);
};

export const createAppServer = () => createServer(addHandler);
