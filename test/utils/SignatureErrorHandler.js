"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const signatureErrorHandler = (err, req, res, next) => {
    return res.json({
        data: {
            status: "error",
            msg: err.message,
            code: err.status
        }
    });
};
exports.default = signatureErrorHandler;
