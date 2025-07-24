import { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCORS } from "../../../utils/serverUtils";
import { deleteResetPasswordCode, verifyResetPasswordCode } from "../../../utils/auth";
import { getUserFromEmail, updateUserPassword } from "../../../utils/user";

type Body = {
    email: string;
    code: string;
    newPassword: string;
}
function isValidBody(body: any): body is Body {
    return typeof body.email === 'string' && body.email.trim() !== '' &&
        typeof body.code === 'string' && body.code.trim() !== '' &&
        typeof body.newPassword === 'string' && body.newPassword.trim() !== '';
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
    const { email, code, newPassword } = req.body;
    const user = await getUserFromEmail(email);
    if (!user) {
        console.log(`Unknown user tried to verify reset password code: ${email}`);
        res.status(400).json({ message: "Invalid reset code" });
        return;
    }
    const isValidCode = await verifyResetPasswordCode(user.id, code);
    if (!isValidCode) {
        console.log(`Invalid reset code for user: ${email}`);
        res.status(400).json({ message: "Invalid reset code" });
        return;
    }
    if (newPassword.length < 8) {
        console.log("New password is too short for user: ", email);
        res.status(400).json({ message: "Password must be at least 8 characters long" });
        return;
    }
    await updateUserPassword(user, newPassword);
    await deleteResetPasswordCode(user.id);
    res.status(200).json({});
}
