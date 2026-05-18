// src/tests/setup.ts
import { prisma } from '../lib/prisma'
import { redisPub, redisSub } from '../lib/redis'

// Runs once before ALL test files
beforeAll(async () => {
  // Clean DB in correct order (respect foreign keys)
  await prisma.incidentEvent.deleteMany()
  await prisma.incident.deleteMany()
  await prisma.user.deleteMany()

  // Clean all RT families from Redis
  const keys = await redisPub.keys('family:*')
  if (keys.length > 0) await redisPub.del(...keys)
})

// Runs once after ALL test files
afterAll(async () => {
  // Clean up test data
  await prisma.incidentEvent.deleteMany()
  await prisma.incident.deleteMany()
  await prisma.user.deleteMany()

  // Clean Redis
  const keys = await redisPub.keys('family:*')
  if (keys.length > 0) await redisPub.del(...keys)

  // Close connections — critical, otherwise Jest hangs
  await prisma.$disconnect()
  await redisPub.quit()
  await redisSub.quit()
})