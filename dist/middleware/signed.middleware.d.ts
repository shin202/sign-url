import { NextFunction, Request, Response } from "express";
import { SignUrl, VerifierOptions } from "../index";
declare const signed: (signer: SignUrl, options?: VerifierOptions) => (req: Request, res: Response, next: NextFunction) => void;
export default signed;
//# sourceMappingURL=signed.middleware.d.ts.map