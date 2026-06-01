import "express";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: number;
        email: string;
        roles: string[];
      };
    }
  }
}

export {};
