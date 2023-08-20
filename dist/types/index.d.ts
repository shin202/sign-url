import { ErrorRequestHandler } from "express";
export type HashFunc = (data: string) => string;
export interface SignatureOptions {
    key?: string;
    ttl?: number;
    hash?: string | HashFunc;
}
export interface SignOptions {
    method?: string | string[];
    ttl?: number;
    expires?: number;
    ipAddress?: string;
}
export interface SignatureData {
    method?: string;
    expires?: number;
    ipAddress?: string;
    r: string;
}
export interface SignedURLData {
    urlWithoutSignature: string;
    signatureData: SignatureData & {
        signature: string;
    };
}
export type VerifyOptions = Omit<SignatureData, "expires" | "r">;
export interface VerifierOptions {
    useIpAddress?: boolean;
    blackholed?: ErrorRequestHandler;
    expired?: ErrorRequestHandler;
    mismatch?: ErrorRequestHandler;
}
export declare class NotSupportedAlgorithmError extends Error {
    readonly status: number;
    constructor();
}
export declare class NotProvideKeyError extends Error {
    readonly status: number;
    constructor();
}
export declare class SignatureError extends Error {
    readonly status: number;
    constructor(msg: string, httpCode: number);
}
export declare class BlackholedSignatureError extends SignatureError {
    constructor();
}
export declare class ExpiredSignatureError extends SignatureError {
    constructor();
}
export declare class MismatchSignatureError extends SignatureError {
    constructor();
}
export declare class SignUrl {
    private readonly key;
    private readonly ttl;
    private readonly hash;
    constructor(options: SignatureOptions);
    private isValidAlgorithm;
    private isProvidedKey;
    private generateSignature;
    sign: (url: string, options?: SignOptions) => string;
    extractUrlData: (url: string) => SignedURLData;
    private isValidURLSignature;
    verify: (url: string, options?: VerifyOptions) => boolean;
}
declare const _default: (options?: SignatureOptions) => SignUrl;
export default _default;
//# sourceMappingURL=index.d.ts.map