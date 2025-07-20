import { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCORS, setTokenHeaders } from "../../utils/serverUtils";
import { createUser, getUserFromEmail } from "../../utils/user";
import { generateTokens } from "../../utils/auth";
import validateEmail from "node-email-verifier";

type Body = {
    password: string;
    confirmPassword: string;
    email: string;
}

function isValidBody(body: any): body is Body {
    return (
        typeof body === 'object' &&
        body !== null &&
        typeof body.password === 'string' &&
        body.password.trim() !== '' &&
        typeof body.confirmPassword === 'string' &&
        body.confirmPassword.trim() !== '' &&
        typeof body.email === 'string'
        && body.email.trim() !== ''
    );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const shouldReturn = handleCORS(req, res);
    if (shouldReturn) {
        return;
    }
    if (!isValidBody(req.body)) {
        console.log("Invalid request body");
        res.status(400).json({ message: "Malformed request body" });
        return;
    }
    const { password, confirmPassword, email } = req.body;
    if (password !== confirmPassword) {
        console.log("Passwords do not match");
        res.status(400).json({ message: "Passwords do not match" });
        return;
    }

    const existingUser = await getUserFromEmail(email);
    if (existingUser) {
        console.log("User with this email already exists");
        res.status(400).json({ message: "User with this email already exists" });
        return;
    }

    try {
        const isValidEmail = await validateEmail(email);
        if (!isValidEmail) {
            throw new Error();
        }
    } catch (error) {
        console.log("Invalid email address during registration: ", email);
        res.status(400).json({ message: "Invalid email address" });
        return;
    }

    if (password.length < 8) {
        console.log("Password must be at least 8 characters long");
        res.status(400).json({ message: "Password must be at least 8 characters long" });
        return;
    }

    const user = await createUser(email, password);
    const { accessToken, refreshToken } = await generateTokens(user.id);
    setTokenHeaders(res, accessToken, refreshToken);
    res.status(200).json({});
}
