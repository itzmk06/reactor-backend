import { createServer } from 'http';
import { app } from './app';
import { initSocket } from './socket/socket.server';
import { initRedisSubscriber } from './socket/redis.subscriber';
import { env } from './lib/env';
import { prisma } from './lib/prisma';

async function startServer() {
  const httpServer = createServer(app);
  
  initSocket(httpServer);
  
  await initRedisSubscriber();
  
  httpServer.listen(env.PORT, function () {
    console.log(`Server is running on port ${env.PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

process.on('SIGINT', function () {
  console.log('Shutting down server...');
  prisma.$disconnect();
  process.exit(0);
});