import { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCORS } from "../../utils/serverUtils";
import { createUser, getUserFromEmail } from "../../utils/user";
import { generateToken } from "../../utils/auth";

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
        res.status(400).json({ error: "Invalid request body" });
        return;
    }
    const { password, confirmPassword, email } = req.body;
    if (password !== confirmPassword) {
        console.log("Passwords do not match");
        res.status(400).json({ error: "Passwords do not match" });
        return;
    }

    const existingUser = await getUserFromEmail(email);
    if (existingUser) {
        console.log("User with this email already exists");
        res.status(400).json({ error: "User with this email already exists" });
        return;
    }

    const user = await createUser(email, password);
    const token = generateToken(user.id);
    res.setHeader("Authorization", `Bearer ${token}`);
    res.status(200).json({});
}
