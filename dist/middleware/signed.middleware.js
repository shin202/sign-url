"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signed = void 0;
const index_1 = require("../index");
const request_ip_1 = __importDefault(require("request-ip"));
const defaultOptions = {
    useIpAddress: false,
};
const signed = (signer, options = defaultOptions) => (req, res, next) => {
    try {
        const url = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
        signer.verify(url, {
            method: req.method,
            ipAddress: options.useIpAddress ? request_ip_1.default.getClientIp(req) : ""
        });
    }
    catch (e) {
        if (options.blackholed && e instanceof index_1.BlackholedSignatureError) {
            return options.blackholed(e, req, res, next);
        }
        if (options.expired && e instanceof index_1.ExpiredSignatureError) {
            return options.expired(e, req, res, next);
        }
        if (options.mismatch && e instanceof index_1.MismatchSignatureError) {
            return options.mismatch(e, req, res, next);
        }
        return next(e);
    }
    return next();
};
exports.signed = signed;
