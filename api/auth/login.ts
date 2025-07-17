import { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCORS, setTokenHeaders } from "../../utils/serverUtils";
import { getUserFromEmail, isPasswordValid } from "../../utils/user";
import { generateTokens } from "../../utils/auth";

type Body = {
    email: string;
    password: string;
}
function isValidBody(body: any): body is Body {
    return (
        typeof body === 'object' &&
        body !== null &&
        typeof body.email === 'string' && body.email.trim() !== '' &&
        typeof body.password === 'string' && body.password.trim() !== ''
    );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const shouldReturn = handleCORS(req, res);
    if (shouldReturn) {
        return;
    }
    if (!isValidBody(req.body)) {
        console.log("Invalid request body");
        res.status(400).json({ error: "Invalid request body" });
        return;
    }
    const { email, password } = req.body;
    const user = await getUserFromEmail(email);
    if (!user) {
        console.log("User not found");
        res.status(404).json({ error: "User not found" });
        return;
    }
    const isValid = await isPasswordValid(user, password);
    if (!isValid) {
        console.log("Invalid password");
        res.status(401).json({ error: "Invalid password" });
        return;
    }
    const { accessToken, refreshToken } = generateTokens(user.id);
    setTokenHeaders(res, accessToken, refreshToken);
    res.status(200).json({});
}
