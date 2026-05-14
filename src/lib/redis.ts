import Redis from 'ioredis';
import { env } from './env';

const url = env.REDIS_URL;
if (!url) throw new Error('REDIS_URL not found in environment variables');
export const redisPub = new Redis(url);
export const redisSub = new Redis(url);

redisPub.on('error', (err) => console.log('[REDIS PUB ]: ', err));
redisSub.on('error', (err) => console.log('[REDIS SUB ]:', err));
