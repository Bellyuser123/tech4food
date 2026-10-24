import { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = performance.now();
  res.on('finish', () => {
    const duration = Math.round(performance.now() - start);
    const status = res.statusCode;
    const method = req.method;
    const url = req.originalUrl || req.url;
    console.log(`[HTTP] ${method} ${url} ${status} - ${duration}ms`);
  });
  next();
}
