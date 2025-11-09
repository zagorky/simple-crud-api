import { availableParallelism } from 'node:os';
import { createServer, request } from 'http';
import cluster from 'node:cluster';
import { config } from 'dotenv';
import { logError, logSuccess } from './utils';
import { ERROR_MESSAGES, STATUS_CODES } from './constants';
import { createAppServer } from './server';
import type { IpcRequest, IpcResponse } from './types/db';
import { Db } from './db/db';
import type { WorkerWithPort } from './types/cluster';

config();

const numCPUs = availableParallelism();
const PORT = Number(process.env.MULTI_PORT) || 3000;

if (cluster.isPrimary) {
  logSuccess(`Primary ${process.pid} is running`);

  const workers: WorkerWithPort[] = [];
  let workerIndex = 0;

  for (let i = 0; i < numCPUs - 1; i += 1) {
    const worker = cluster.fork();
    const workerPort = PORT + i + 1;
    workers.push({ port: workerPort, worker });
    worker.send({ port: workerPort });

    worker.on('message', (msg: IpcRequest | unknown) => {
      if (!msg || typeof msg !== 'object' || !('requestId' in msg) || !('command' in msg)) return;

      const { requestId, command } = msg as IpcRequest;

      try {
        const result = Db.execute(command);
        const response: IpcResponse = { requestId, response: result };
        worker.send(response);
      } catch (err: unknown) {
        logError(`DB execute error: ${(err as Error).message}`);
        const response: IpcResponse = {
          requestId,
          response: { success: false, error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR },
        };
        worker.send(response);
      }
    });
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

    const proxyReq = request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode ?? STATUS_CODES.INTERNAL_SERVER_ERROR, proxyRes.headers);
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
