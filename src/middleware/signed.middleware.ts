import {NextFunction, Request, Response} from "express"
import {
    BlackholedSignatureError,
    ExpiredSignatureError,
    MismatchSignatureError,
    SignUrl,
    VerifierOptions
} from "../index"
import requestIp from "request-ip"

const defaultOptions: VerifierOptions = {
    useIpAddress: false,
}

const signed = (signer: SignUrl, options: VerifierOptions = defaultOptions) => (req: Request, res: Response, next: NextFunction): void => {
    try {
        const url = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
        signer.verify(url, {
            method: req.method,
            ipAddress: options.useIpAddress ? requestIp.getClientIp(req)! : ""
        });
    } catch (e: any) {
        if (options.blackholed && e instanceof BlackholedSignatureError) {
            return options.blackholed(e, req, res, next);
        }

        if (options.expired && e instanceof ExpiredSignatureError) {
            return options.expired(e, req, res, next);
        }

        if (options.mismatch && e instanceof MismatchSignatureError) {
            return options.mismatch(e, req, res, next);
        }

        return next(e);
    }

    return next();
}

export {signed};