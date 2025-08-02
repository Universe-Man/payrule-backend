import { FastifyInstance } from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { config } from '../config/config';

export const registerPlugins = async (server: FastifyInstance): Promise<void> => {
  // Security headers
  await server.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  });

  // CORS
  await server.register(cors, {
    origin: (origin, callback) => {
      const hostname = new URL(origin || 'http://localhost:3000').hostname;

      // Allow localhost in development
      if (config.NODE_ENV === 'development') {
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'), false);
        }
      } else {
        // In production, check against allowed origins
        const allowedOrigins = config.CORS_ORIGIN.split(',');
        if (allowedOrigins.includes(origin || '')) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'), false);
        }
      }
    },
    credentials: true,
  });

  // Rate limiting
  await server.register(rateLimit, {
    max: config.RATE_LIMIT_MAX,
    timeWindow: config.RATE_LIMIT_WINDOW,
    errorResponseBuilder: (request, context) => {
      return {
        code: 429,
        error: 'Too Many Requests',
        message: `Rate limit exceeded, retry in ${context.after}`,
        retryAfter: context.after,
      };
    },
  });

  // JWT
  await server.register(jwt, {
    secret: config.JWT_SECRET,
    sign: {
      expiresIn: config.JWT_EXPIRES_IN,
    },
  });

  // Swagger documentation
  await server.register(swagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'Payroll System API',
        description: 'A comprehensive payroll management system API',
        version: '1.0.0',
      },
      servers: [
        {
          url: `http://${config.HOST}:${config.PORT}`,
          description: 'Development server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [
        {
          bearerAuth: [],
        },
      ],
    },
  });

  // Swagger UI
  await server.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
  });
};