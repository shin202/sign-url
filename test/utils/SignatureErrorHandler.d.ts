import { Request, Response, NextFunction } from "express";
declare const signatureErrorHandler: (err: any, req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export default signatureErrorHandler;
//# sourceMappingURL=SignatureErrorHandler.d.ts.map