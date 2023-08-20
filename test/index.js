"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const src_1 = __importDefault(require("../src"));
const signed_middleware_1 = __importDefault(require("../src/middleware/signed.middleware"));
const SignatureErrorHandler_1 = __importDefault(require("./utils/SignatureErrorHandler"));
const app = (0, express_1.default)();
const signer = (0, src_1.default)({
    key: "abc",
});
const signedMiddleware = (0, signed_middleware_1.default)(signer, {
    blackholed: SignatureErrorHandler_1.default,
    expired: SignatureErrorHandler_1.default,
    mismatch: SignatureErrorHandler_1.default
});
app.get("/", (req, res) => {
    try {
        const signedUrl = signer.sign('http://localhost:8080/example', {
            method: "get"
        });
        res.send(`<a href="${signedUrl}">Signed URL</a>`);
    }
    catch (e) {
        console.log(e);
    }
});
app.get("/example", signedMiddleware, (req, res, next) => {
    res.send(req.query);
});
app.listen(8080, () => {
    console.log("Server is running: http://localhost:8080");
});
