"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignUrl = exports.MismatchSignatureError = exports.ExpiredSignatureError = exports.BlackholedSignatureError = exports.SignatureError = exports.NotProvideKeyError = exports.NotSupportedAlgorithmError = void 0;
const crypto_1 = require("crypto");
const dayjs_1 = __importDefault(require("dayjs"));
class NotSupportedAlgorithmError extends Error {
    status = 400;
    constructor() {
        super("This algorithm is not supported.");
    }
}
exports.NotSupportedAlgorithmError = NotSupportedAlgorithmError;
class NotProvideKeyError extends Error {
    status = 400;
    constructor() {
        super("Please provide the secret key.");
    }
}
exports.NotProvideKeyError = NotProvideKeyError;
class SignatureError extends Error {
    status;
    constructor(msg, httpCode) {
        super(msg);
        this.status = httpCode;
    }
}
exports.SignatureError = SignatureError;
class BlackholedSignatureError extends SignatureError {
    constructor() {
        super("The request has been black-holed.", 403);
    }
}
exports.BlackholedSignatureError = BlackholedSignatureError;
class ExpiredSignatureError extends SignatureError {
    constructor() {
        super("URL signature expired.", 410);
    }
}
exports.ExpiredSignatureError = ExpiredSignatureError;
class MismatchSignatureError extends SignatureError {
    constructor() {
        super("URL signature mismatch.", 403);
    }
}
exports.MismatchSignatureError = MismatchSignatureError;
class SignUrl {
    key;
    ttl;
    hash;
    constructor(options) {
        const { key, ttl = 30, hash = "sha256" } = options;
        this.key = key;
        this.ttl = ttl;
        if (typeof hash === "string") {
            this.hash = (data) => this.generateSignature(data, hash);
        }
        else {
            this.hash = hash;
        }
    }
    isValidAlgorithm = (algorithm) => {
        const allSupportedAlgorithm = (0, crypto_1.getHashes)();
        return allSupportedAlgorithm.includes(algorithm);
    };
    isProvidedKey = () => !!this.key;
    generateSignature = (data, algorithm) => {
        if (!this.isProvidedKey())
            throw new NotProvideKeyError();
        if (!this.isValidAlgorithm(algorithm))
            throw new NotSupportedAlgorithmError();
        return (0, crypto_1.createHmac)(algorithm, this.key).update(data).update(this.key).digest("hex");
    };
    sign = (url, options = {}) => {
        const signatureData = {
            r: (0, crypto_1.randomBytes)(16).toString("base64url")
        };
        if (this.ttl) {
            signatureData.expires = (0, dayjs_1.default)().add(this.ttl, "m").valueOf();
        }
        else if (options.ttl) {
            signatureData.expires = (0, dayjs_1.default)().add(options.ttl, "m").valueOf();
        }
        else if (options.expires) {
            signatureData.expires = options.expires;
        }
        if (options.method) {
            signatureData.method = (Array.isArray(options.method) ? options.method.join(",") : options.method).toUpperCase();
        }
        if (options.ipAddress)
            signatureData.ipAddress = options.ipAddress;
        const { expires, ipAddress, method, r } = signatureData;
        const prefix = url.indexOf("?") === -1 ? "?" : "&";
        url += `${prefix}expires=${expires || ""}&ip=${ipAddress || ""}&method=${method || ""}&r=${r}`;
        const signature = this.hash(url);
        url += `&sig=${signature}`;
        return url;
    };
    extractUrlData = (url) => {
        const urlObj = new URL(url);
        const expires = parseInt(urlObj.searchParams.get("expires") || "0");
        const ipAddress = urlObj.searchParams.get("ip") || "";
        const method = urlObj.searchParams.get("method") || "";
        const r = urlObj.searchParams.get("r") || "";
        const signature = urlObj.searchParams.get("sig") || "";
        const urlWithoutSignature = url.replace(/&sig=([^&]\w+)/g, "");
        return {
            urlWithoutSignature,
            signatureData: {
                expires,
                ipAddress,
                method,
                r,
                signature
            }
        };
    };
    isValidURLSignature = (url, signature) => {
        return signature === this.hash(url);
    };
    verify = (url, options = {}) => {
        const { urlWithoutSignature, signatureData: { expires, ipAddress, method, signature } } = this.extractUrlData(url);
        if (ipAddress && (!options.ipAddress || ipAddress !== options.ipAddress))
            throw new BlackholedSignatureError();
        if (method && (!options.method || method.indexOf(options.method.toUpperCase())) === -1)
            throw new BlackholedSignatureError();
        if (expires && expires < (0, dayjs_1.default)().valueOf())
            throw new ExpiredSignatureError();
        if (!this.isValidURLSignature(urlWithoutSignature, signature))
            throw new MismatchSignatureError();
        return true;
    };
}
exports.SignUrl = SignUrl;
exports.default = (options = {}) => new SignUrl(options);
