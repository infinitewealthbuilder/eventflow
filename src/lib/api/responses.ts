/**
 * EventFlow - Standardized API Response Utilities
 * Provides consistent error and success response patterns
 */

import { NextResponse } from "next/server";
import type { ZodError } from "zod";

/**
 * Standard error response format
 */
export interface ApiErrorResponse {
  error: string;
  details?: unknown;
  code?: string;
}

/**
 * Create an error response with proper status code
 */
export function errorResponse(
  error: string,
  status: number,
  details?: unknown,
  code?: string
): NextResponse<ApiErrorResponse> {
  const body: ApiErrorResponse = { error };
  if (details !== undefined) body.details = details;
  if (code) body.code = code;

  return NextResponse.json(body, { status });
}

/**
 * Create a 400 Bad Request response
 */
export function badRequest(
  error: string,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  return errorResponse(error, 400, details, "BAD_REQUEST");
}

/**
 * Create a 401 Unauthorized response
 */
export function unauthorized(
  error = "Unauthorized"
): NextResponse<ApiErrorResponse> {
  return errorResponse(error, 401, undefined, "UNAUTHORIZED");
}

/**
 * Create a 403 Forbidden response
 */
export function forbidden(
  error = "Forbidden"
): NextResponse<ApiErrorResponse> {
  return errorResponse(error, 403, undefined, "FORBIDDEN");
}

/**
 * Create a 404 Not Found response
 */
export function notFound(
  error = "Not found"
): NextResponse<ApiErrorResponse> {
  return errorResponse(error, 404, undefined, "NOT_FOUND");
}

/**
 * Create a 500 Internal Server Error response
 */
export function serverError(
  error = "Internal server error",
  logMessage?: string
): NextResponse<ApiErrorResponse> {
  if (logMessage) {
    console.error(logMessage);
  }
  return errorResponse(error, 500, undefined, "SERVER_ERROR");
}

/**
 * Create a validation error response from Zod
 */
export function validationError(
  zodError: ZodError
): NextResponse<ApiErrorResponse> {
  return errorResponse(
    "Validation failed",
    400,
    zodError.flatten(),
    "VALIDATION_ERROR"
  );
}

/**
 * Create a success response with data
 */
export function success<T>(data: T, status = 200): NextResponse<T> {
  return NextResponse.json(data, { status });
}

/**
 * Create a 201 Created response
 */
export function created<T>(data: T): NextResponse<T> {
  return NextResponse.json(data, { status: 201 });
}

/**
 * Create a 204 No Content response
 */
export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}
