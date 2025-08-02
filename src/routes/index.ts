import { FastifyInstance } from 'fastify';

export const registerRoutes = async (server: FastifyInstance): Promise<void> => {
  // Health check endpoint
  server.get('/health', {
    schema: {
      description: 'Health check endpoint',
      tags: ['Health'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
            uptime: { type: 'number' },
            database: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      // Test database connection
      await server.prisma.$queryRaw`SELECT 1`;

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: 'connected',
      };
    } catch (error) {
      reply.code(503);
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: 'disconnected',
      };
    }
  });

  // API version prefix
  await server.register(async function (server) {
    // TODO: Register API routes here
    // await server.register(authRoutes, { prefix: '/auth' });
    // await server.register(companyRoutes, { prefix: '/companies' });
    // await server.register(employeeRoutes, { prefix: '/employees' });
    // await server.register(payrollRoutes, { prefix: '/payrolls' });

    server.get('/', {
      schema: {
        description: 'API root endpoint',
        tags: ['Root'],
        response: {
          200: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              version: { type: 'string' },
              docs: { type: 'string' },
            },
          },
        },
      },
    }, async () => {
      return {
        message: 'Payroll System API',
        version: '1.0.0',
        docs: '/docs',
      };
    });
  }, { prefix: '/api/v1' });
};