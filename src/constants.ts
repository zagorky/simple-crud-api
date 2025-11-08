export const ROUTE_REGEX = /^\/api\/users\/([a-f0-9\-]+)$/;

export const HEADERS = {
  CONTENT_TYPE: 'Content-Type',
  ACCESS_CONTROL_ALLOW_ORIGIN: 'Access-Control-Allow-Origin',
  ACCESS_CONTROL_ALLOW_METHODS: 'Access-Control-Allow-Methods',
  ACCESS_CONTROL_ALLOW_HEADERS: 'Access-Control-Allow-Headers',
  APPLICATION_JSON: 'application/json',
};

export const METHODS = { GET: 'GET', POST: 'POST', PUT: 'PUT', DELETE: 'DELETE', OPTIONS: 'OPTIONS' };

export const STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

export const ROUTES = {
  USERS: '/api/users',
};

export const ERROR_MESSAGES = {
  INVALID_USER_ID: 'Invalid userId',
  INVALID_USER_BODY: 'Invalid user body',
  INVALID_JSON: 'Invalid JSON',
  NOT_FOUND: 'Not found',
  USER_NOT_FOUND: 'User not found',
  INTERNAL_SERVER_ERROR: 'Internal Server Error',
  PARSE_BODY_ERROR: 'Failed to parse body',
};

export const IndexNotFound = -1;
