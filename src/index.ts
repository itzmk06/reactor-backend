import { createServer } from 'http';
import { app } from './app';
import { prisma } from './lib/prisma';

const httpServer = createServer(app);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on :${PORT}`);
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
