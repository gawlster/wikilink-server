import { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCORS, setTokenHeaders } from "../../utils/serverUtils";
import { invalidateRefreshToken } from "../../utils/auth";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const shouldReturn = handleCORS(req, res);
    if (shouldReturn) {
        return;
    }
    if (req.method !== "POST") {
        res.status(405).json({ message: "Method not allowed" });
        return;
    }
    try {
        const refreshToken = req.headers["x-refresh-token"];
        if (refreshToken && typeof refreshToken === "string") {
            await invalidateRefreshToken(refreshToken);
        }
    } catch (error) {
        // do nothing
    }
    setTokenHeaders(res, "", "");
    res.status(200).json({});
    return;
}
