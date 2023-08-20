import {Request, Response, NextFunction} from "express"

const signatureErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    return res.json({
        data: {
            status: "error",
            msg: err.message,
            code: err.status
        }
    });
}

export default signatureErrorHandler;