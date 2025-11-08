import { config } from 'dotenv';
import { createAppServer } from './server';
import { logInfo } from './utils';

config();

const PORT = Number(process.env.USERS_PORT) || 4000;

const server = createAppServer();

server.listen(PORT, () => {
  logInfo(`Server running on http://localhost:${PORT}`);
});

process.on('SIGINT', () => {
  server.close(() => {
    logInfo('Server closed');
    process.exit(0);
  });
});
