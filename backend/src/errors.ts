export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: Record<string, string[]>
  ) {
    super(message);
  }
}

export const badRequest = (message: string) => new ApiError(400, message);
export const unauthorized = (message = 'Требуется авторизация') => new ApiError(401, message);
export const forbidden = (message = 'Недостаточно прав') => new ApiError(403, message);
export const notFound = (message = 'Не найдено') => new ApiError(404, message);
export const conflict = (message: string) => new ApiError(409, message);
