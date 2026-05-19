import { redisPub } from '../lib/redis';
import { io } from './socket.server';

const subClient = redisPub.duplicate();

export async function initRedisSubscriber() {
  await subClient.subscribe('incident:updates');
  subClient.on('message', function (_channel, message) {
    try {
      const { room, event, data } = JSON.parse(message);
      io.to(room).emit(event, data);
    } catch (error) {
      console.log('[REDIS SUBSCRIBER] failed to parse message: ', error);
    }
  });
  subClient.on('error', function (err) {
    console.log(err);
  });
  console.log('[REDIS SUBSCRIBER] listening for [incident:updates]');
}
