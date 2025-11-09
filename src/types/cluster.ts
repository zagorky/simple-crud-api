import type { Worker } from 'node:cluster';

export type WorkerWithPort = { port: number; worker: Worker };
