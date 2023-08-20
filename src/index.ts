import {createHmac, getHashes, randomBytes} from "crypto"
import dayjs from "dayjs"
import {ErrorRequestHandler} from "express"

export type HashFunc = (data: string) => string

export interface SignatureOptions {
    /**
     * The secret key using to hash url (required if you don't use your own hash function).
     */
    key?: string
    /**
     * Time to live of the signed url (optional)
     */
    ttl?: number
    /**
     * The algorithm using to hash or your own hash function (optional).
     */
    hash?: string | HashFunc
}

export interface SignOptions {
    /**
     * The HTTP method or the list of HTTP method using to sign the signature (optional).
     */
    method?: string | string[]
    /**
     * Time to live of the signature (optional).
     */
    ttl?: number
    /**
     * Expires time in timestamp of the signature (optional).
     */
    expires?: number
    /**
     * IP address of the requested user (use it if you want to prevent sharing the url between users) (optional).
     */
    ipAddress?: string
}

export interface SignatureData {
    /**
     * Allowed HTTP method.
     */
    method?: string
    /**
     * Expires in timestamp.
     */
    expires?: number
    /**
     * IP address.
     */
    ipAddress?: string
    /**
     * Random string.
     */
    r: string
}

export interface SignedURLData {
    /**
     * The url without signature.
     */
    urlWithoutSignature: string
    /**
     * The signature data.
     */
    signatureData: SignatureData & { signature: string }
}

export type VerifyOptions = Omit<SignatureData, "expires" | "r">;

export interface VerifierOptions {
    /**
     * Using the requested user ip address or not.
     */
    useIpAddress?: boolean
    /**
     * Url blackholed error handler.
     */
    blackholed?: ErrorRequestHandler
    /**
     * Signature expired error handler.
     */
    expired?: ErrorRequestHandler
    /**
     * Signature mismatch error handler.
     */
    mismatch?: ErrorRequestHandler
}

export class NotSupportedAlgorithmError extends Error {
    public readonly status: number = 400;

    constructor() {
        super("This algorithm is not supported.");
    }
}

export class NotProvideKeyError extends Error {
    public readonly status: number = 400;

    constructor() {
        super("Please provide the secret key.");
    }
}

export class SignatureError extends Error {
    public readonly status: number;

    constructor(msg: string, httpCode: number) {
        super(msg);
        this.status = httpCode;
    }
}

export class BlackholedSignatureError extends SignatureError {
    constructor() {
        super("The request has been black-holed.", 403);
    }
}

export class ExpiredSignatureError extends SignatureError {
    constructor() {
        super("URL signature expired.", 410);
    }
}

export class MismatchSignatureError extends SignatureError {
    constructor() {
        super("URL signature mismatch.", 403);
    }
}

export class SignUrl {
    private readonly key: string;
    private readonly ttl: number;
    private readonly hash: HashFunc;

    /**
     *
     * @param options - Signature options (includes: key - The secret key using to hash signature,
     * ttl: Time to live of the signed url, hash: The algorithm using to hash signature or your hash function.)
     */
    constructor(options: SignatureOptions) {
        const {key, ttl = 30, hash = "sha256"} = options;
        this.key = key!;
        this.ttl = ttl;

        if (typeof hash === "string") {
            this.hash = (data: string) => this.generateSignature(data, hash);
        } else {
            this.hash = hash;
        }
    }

    /**
     * Determine whether the algorithm is supported.
     * @param algorithm - The algorithm.
     * @return true if the algorithm is supported, otherwise false.
     */
    private isValidAlgorithm = (algorithm: string): boolean => {
        const allSupportedAlgorithm = getHashes();

        return allSupportedAlgorithm.includes(algorithm);
    }

    /**
     * Determine whether the secret key is provided.
     * @return true if the secret key is provided, otherwise false.
     */
    private isProvidedKey = (): boolean => !!this.key;

    /**
     * Generate the signature from given data and algorithm using HMAC.
     * @param data - The data to hash.
     * @param algorithm - The algorithm using to hash.
     * @return The hashed signature.
     */
    private generateSignature = (data: string, algorithm: string): string => {
        if (!this.isProvidedKey()) throw new NotProvideKeyError();
        if (!this.isValidAlgorithm(algorithm)) throw new NotSupportedAlgorithmError();

        return createHmac(algorithm, this.key).update(data).update(this.key).digest("hex");
    };

    /**
     * Sign the given url.
     * @param url - The url to sign.
     * @param options - The sign options (includes: method - the request method,
     * ttl - time to live of the signed url, expires - Expires of the signed url (timestamp),
     * ipAddress - the ip address of the requested user.)
     * @return The signed url.
     */
    public sign = (url: string, options: SignOptions = {}): string => {
        const signatureData: SignatureData = {
            r: randomBytes(16).toString("base64url")
        };

        if (this.ttl) {
            signatureData.expires = dayjs().add(this.ttl, "m").valueOf();
        } else if (options.ttl) {
            signatureData.expires = dayjs().add(options.ttl, "m").valueOf();
        } else if (options.expires) {
            signatureData.expires = options.expires;
        }

        if (options.method) {
            signatureData.method = (Array.isArray(options.method) ? options.method.join(",") : options.method).toUpperCase();
        }

        if (options.ipAddress) signatureData.ipAddress = options.ipAddress;

        const {expires, ipAddress, method, r} = signatureData;
        const prefix = url.indexOf("?") === -1 ? "?" : "&";

        url += `${prefix}expires=${expires || ""}&ip=${ipAddress || ""}&method=${method || ""}&r=${r}`;
        const signature = this.hash(url);
        url += `&sig=${signature}`;

        return url;
    }

    /**
     * Extract the signed url data from given url.
     * @param url - The signed url.
     * @return Signed url data.
     */
    public extractUrlData = (url: string): SignedURLData => {
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
        }
    }

    /**
     * Determine whether the url is valid.
     * @param url - The url to check.
     * @param signature - The signature of the signed url.
     * @return true if url is valid, otherwise false.
     */
    private isValidURLSignature = (url: string, signature: string): boolean => {
        return signature === this.hash(url);
    }

    /**
     * Verify that the signed url is valid.
     * @param url - The signed url.
     * @param options - The verify options.
     * @return true if the signed url is valid, otherwise throw an error.
     */
    public verify = (url: string, options: VerifyOptions = {}): boolean => {
        const {urlWithoutSignature, signatureData: {expires, ipAddress, method, signature}} = this.extractUrlData(url);

        if (ipAddress && (!options.ipAddress || ipAddress !== options.ipAddress)) throw new BlackholedSignatureError();

        if (method && (!options.method || method.indexOf(options.method.toUpperCase())) === -1) throw new BlackholedSignatureError();

        if (expires && expires < dayjs().valueOf()) throw new ExpiredSignatureError();

        if (!this.isValidURLSignature(urlWithoutSignature, signature)) throw new MismatchSignatureError();

        return true;
    }
}

export default (options: SignatureOptions = {}) => new SignUrl(options);