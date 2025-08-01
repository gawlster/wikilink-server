import { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCORS } from "../../../utils/serverUtils";
import { getUserFromEmail } from "../../../utils/user";
import { sendPasswordResetEmail } from "../../../utils/email";
import { generateResetPasswordCode } from "../../../utils/auth";

type Body = {
    email: string;
}
function isValidBody(body: any): body is Body {
    return typeof body.email === 'string' && body.email.trim() !== '';
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
    const { email } = req.body;
    const user = await getUserFromEmail(email);
    if (!user) {
        console.log(`Unknown user tried to reset password: ${email}`);
        res.status(200).json({}); // Send a success to mask sensitive info
        return;
    }
    const code = await generateResetPasswordCode(user.id);
    try {
        await sendPasswordResetEmail(email, code);
        res.status(200).json({});
    } catch (error) {
        console.error("Error sending password reset email:", error);
        res.status(500).json({ message: "Failed to send password reset email" });
    }
}
