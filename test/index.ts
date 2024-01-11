import express from "express"
import {SignUrl} from "../dist"
import {signed} from "../dist/middleware"
import SignatureErrorHandler from "./utils/SignatureErrorHandler"

const app = express();

const signer = new SignUrl({
    key: "abc",
});

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