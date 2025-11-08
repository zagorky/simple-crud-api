import {cpus} from 'node:os';
import {createServer} from 'http';
import * as http from 'node:http';
import cluster from 'node:cluster';
import {config} from 'dotenv';
import {logError, logSuccess} from './utils';
import {ERROR_MESSAGES, STATUS_CODES} from './constants';
import {createAppServer} from './server';

config();

const numCPUs = cpus().length;
const PORT = Number(process.env.MULTI_PORT) || 5000;

if (cluster.isPrimary) {
  logSuccess(`Primary ${process.pid} is running`);

  const workers: { port: number }[] = [];
  let workerIndex = 0;

  for (let i = 0; i < numCPUs - 1; i += 1) {
    const worker = cluster.fork();
    const workerPort = PORT + i + 1;
    workers.push({ port: workerPort });
    worker.send({ port: workerPort });
  }

  const balancer = createServer((req, res) => {
    const worker = workers[workerIndex];
    workerIndex = (workerIndex + 1) % workers.length;

    const options = {
      hostname: 'localhost',
      port: worker.port,
      path: req.url,
      method: req.method,
      headers: req.headers,
    };

    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode!, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      logError(`Proxy error: ${err.message}`);
      res.writeHead(STATUS_CODES.INTERNAL_SERVER_ERROR, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR }));
    });

    req.pipe(proxyReq);
  });

  balancer.listen(PORT, () => {
    logSuccess(`Load balancer on http://localhost:${PORT}`);
  });
} else {
  process.on('message', (msg: { port: number }) => {
    const serverInstance = createAppServer();
    serverInstance.listen(msg.port, () => {
      logSuccess(`Worker ${process.pid} on http://localhost:${msg.port}`);
    });
  });
}
