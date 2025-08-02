import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  path: string;
  details?: any;
}

export const errorHandler = async (
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const timestamp = new Date().toISOString();
  const path = request.url;

  // Log the error
  request.log.error({
    error: error.message,
    stack: error.stack,
    path,
    method: request.method,
  }, 'Request error');

  let response: ErrorResponse = {
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
    statusCode: 500,
    timestamp,
    path,
  };

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    response = {
      error: 'Validation Error',
      message: 'Request validation failed',
      statusCode: 400,
      timestamp,
      path,
      details: error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      })),
    };
  }

  // Handle Prisma errors
  else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        response = {
          error: 'Conflict',
          message: 'A record with this data already exists',
          statusCode: 409,
          timestamp,
          path,
          details: error.meta,
        };
        break;
      case 'P2025':
        response = {
          error: 'Not Found',
          message: 'Record not found',
          statusCode: 404,
          timestamp,
          path,
        };
        break;
      case 'P2003':
        response = {
          error: 'Bad Request',
          message: 'Foreign key constraint failed',
          statusCode: 400,
          timestamp,
          path,
        };
        break;
      default:
        response = {
          error: 'Database Error',
          message: 'A database error occurred',
          statusCode: 500,
          timestamp,
          path,
        };
    }
  }

  // Handle Fastify validation errors
  else if (error.validation) {
    response = {
      error: 'Validation Error',
      message: error.message,
      statusCode: 400,
      timestamp,
      path,
      details: error.validation,
    };
  }

  // Handle authentication errors
  else if (error.statusCode === 401) {
    response = {
      error: 'Unauthorized',
      message: 'Authentication required',
      statusCode: 401,
      timestamp,
      path,
    };
  }

  // Handle authorization errors
  else if (error.statusCode === 403) {
    response = {
      error: 'Forbidden',
      message: 'Insufficient permissions',
      statusCode: 403,
      timestamp,
      path,
    };
  }

  // Handle rate limit errors
  else if (error.statusCode === 429) {
    response = {
      error: 'Too Many Requests',
      message: 'Rate limit exceeded',
      statusCode: 429,
      timestamp,
      path,
    };
  }

  // Handle other HTTP errors
  else if (error.statusCode && error.statusCode < 500) {
    response = {
      error: error.name || 'Client Error',
      message: error.message,
      statusCode: error.statusCode,
      timestamp,
      path,
    };
  }

  // Send the error response
  await reply.code(response.statusCode).send(response);
};