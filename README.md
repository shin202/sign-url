# Sign URL
A tiny NodeJS library using for signing the url and validating with HMAC algorithm.



## Installation

Install with npm

```bash
  npm install simple-sign-url
```
    
## Usage/Examples

Create signature object using for sign and validate url.

```ts
import SignUrl from "simple-sign-url"

// Pass your options here.
const options: SignatureOptions = {
    key: "your secret key"
};

const signer = SignUrl(options);
```

Possible options: [`View here`](https://github.com/shin202/sign-url/blob/main/src/index.ts#L7-L20)

### Sign an URL

Sign the given URL.

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| url       | string | The url to sign |
| options (optional) | [`SignOptions`](https://github.com/shin202/sign-url/blob/main/src/index.ts#L22-L39) | The sign options |

```ts
const signedUrl = signer.sign(`http://localhost:8080/example`);
```

### Verify an URL

#### Using with express
You can using it with express as middleware.

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| signer    | [`SignUrl`]() | The signature object |
| options (optional) | [`VerifierOptions`](https://github.com/shin202/sign-url/blob/main/src/index.ts#L73-L90) | The verifier options |

```ts
import signed from "simple-sign-url/middleware/signed.middleware"

/* Your other code
...
 */


app.get("/example", signed(signer), (req, res, next) => {
    // Your code here
});
```

#### Using without express

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| url       | string | The signed url to verify |
| options (optional) | [`VerifyOptions`](https://github.com/shin202/sign-url/blob/main/src/index.ts#L71) | The verify options |

```ts
try {
    const url = `http://localhost:8080/example?expires=1692277975099&ip=&method=GET&r=KJ2Wxrgp9LCdmZxMIkv9UQ&sig=790c6a7fcccfdd9bb80c32bd3cd64c7965bbe8ed3fa377eacc7c1dea2517f6ce`;

    signer.verify(url);
} catch (e) {
    // Your code here.
}
```

### Handling Error
If signature is not valid, the verify method throws [`SignatureError`](https://github.com/shin202/sign-url/blob/main/src/index.ts#L108-L115).

You can handle these errors yourself, using express error handler

```ts
import {SignatureError} from "simple-sign-url"

app.use((err, req, res, next) => {
    if (err instanceof SignatureError) {
        // Your code here
    }
})
```

Or you can pass error handlers in verify middleware

```ts
import signed from "simple-sign-url/middleware/signed.middleware"

const signedMiddleware = signed(signer, {
    blackholed: SignatureErrorHandler,
    expired: SignatureErrorHandler,
    mismatch: SignatureErrorHandler
});
```

## Example of application

```ts
import express, {Request, Response, NextFunction} from "express"
import SignUrl from "simple-sign-url"
import signed from "simple-sign-url/middleware/signed.middleware"

const app = express();

const signer = SignUrl({
    key: "abc",
});

const signatureErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    return res.json({
        data: {
            status: "error",
            msg: err.message,
            code: err.status
        }
    });
}

const signedMiddleware = signed(signer, {
    blackholed: SignatureErrorHandler,
    expired: SignatureErrorHandler,
    mismatch: SignatureErrorHandler
});

app.get("/", (req, res) => {
    try {
        const signedUrl = signer.sign('http://localhost:8080/example', {
            method: "get"
        });
        res.send(`<a href="${signedUrl}">Signed URL</a>`);
    } catch (e) {
        console.log(e);
    }
});

app.get("/example", signedMiddleware, (req: any, res: any, next: any) => {
    res.send(req.query);
});

app.listen(8080, () => {
    console.log("Server is running: http://localhost:8080");
});
```

## License

[`MIT`](https://github.com/shin202/sign-url/blob/main/LICENSE)







