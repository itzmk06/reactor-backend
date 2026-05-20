import { createServer } from 'http';
import { app } from './app';
import { initSocket } from './socket/socket.server';
import { initRedisSubscriber } from './socket/redis.subscriber';
import { env } from './lib/env';
import { prisma } from './lib/prisma';

const httpServer = createServer(app);
initSocket(httpServer);
initRedisSubscriber();
httpServer.listen(env.PORT, function () {
  console.log(`Server is running on port ${env.PORT}`);
});
process.on('SIGINT', function () {
  console.log('Shutting down server...');
  prisma.$disconnect();
  process.exit(0);
});
