import { config } from 'dotenv';
import { createAppServer } from './server';
import { logSuccess } from './utils';

config();

const PORT = Number(process.env.USERS_PORT) || 4000;

const server = createAppServer();

server.listen(PORT, () => {
  logSuccess(`Server running on http://localhost:${PORT}`);
});

process.on('SIGINT', () => {
  server.close(() => {
    logSuccess('Server closed');
    process.exit(0);
  });
});
