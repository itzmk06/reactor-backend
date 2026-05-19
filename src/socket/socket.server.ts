import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { createAdapter } from '@socket.io/redis-adapter';
import { redisPub, redisSub } from '../lib/redis';
import { env } from '../lib/env';
import { Role } from '../generated/prisma/enums';

export let io: Server;

export function initSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });
  io.adapter(createAdapter(redisPub, redisSub));
  io.use(function (socket, next) {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('unauthenticated'));
    }
    try {
      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as {
        sub: string;
        role: Role;
        type: string;
      };
      if (payload.type !== 'access') {
        return next(new Error('unauthenticated'));
      }
      socket.data.userId = payload.sub;
      socket.data.role = payload.role;
      next();
    } catch (_error) {
      return next(new Error('unauthenticated'));
    }
  });
  io.on('connection', function (socket) {
    console.log(`[ws] ${socket.data.userId} connected`);
    socket.on('join:incident', function (incidentId: string) {
      console.log(`[ws] ${socket.data.userId} joined incident : ${incidentId}`);
      socket.join(`incident:${incidentId}`);
    });
    socket.on('leave:incident', function (incidentId: string) {
      console.log(`[ws] ${socket.data.userId} left incident : ${incidentId}`);
      socket.leave(`incident:${incidentId}`);
    });
    socket.on('disconnect', function () {
      console.log(`[ws] ${socket.data.userId} disconnected`);
    });
  });
  return io;
}
