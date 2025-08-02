import * as fastifyImport from 'fastify';
const fastify = fastifyImport.default;
import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { config } from './config/config';
import { registerPlugins } from './plugins';
import { registerRoutes } from './routes';
import { errorHandler } from './middleware/errorHandler';

// Initialize Prisma Client
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Create Fastify instance
const server: FastifyInstance = fastify({
  logger: config.NODE_ENV === 'development' ? {
    level: config.LOG_LEVEL,
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  } : {
      level: config.LOG_LEVEL,
    },
});

// Declare module augmentation for TypeScript
declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

// Register Prisma as a decorator
server.decorate('prisma', prisma);

// Graceful shutdown
const gracefulShutdown = async () => {
  try {
    server.log.info('Starting graceful shutdown...');
    await server.close();
    await prisma.$disconnect();
    server.log.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    server.log.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const start = async (): Promise<void> => {
  try {
    // Test database connection
    await prisma.$connect();
    server.log.info('Database connected successfully');

    // Register plugins first
    await registerPlugins(server);

    // Global error handler (after plugins)
    (server as any).setErrorHandler(errorHandler);

    // Register routes
    await registerRoutes(server);

    // Start listening
    await server.listen({
      port: config.PORT,
      host: config.HOST,
    });

    server.log.info(`Server running at http://${config.HOST}:${config.PORT}`);
    server.log.info(`API Documentation available at http://${config.HOST}:${config.PORT}/docs`);
  } catch (error) {
    server.log.error('Error starting server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  server.log.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown();
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  server.log.error('Uncaught Exception thrown:', error);
  gracefulShutdown();
});

if (require.main === module) {
  start();
}

export { server, prisma };