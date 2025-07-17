import { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyTokens } from "./auth";

export function handleCORS(req: VercelRequest, res: VercelResponse) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-refresh-token");
    res.setHeader("Access-Control-Expose-Headers", "Authorization, x-refresh-token");


    // Handle preflight request
    if (req.method === "OPTIONS") {
        res.status(204).end(); // No content
        return true;
    }
    return false;
}

export async function handleProtectedAuth(req: VercelRequest, res: VercelResponse) {
    const accessToken = req.headers.authorization?.split(" ")[1] || "";
    const refreshToken = req.headers["x-refresh-token"] || "";
    const validated = await verifyTokens({ accessToken, refreshToken: String(refreshToken) })
    if (!validated) {
        setTokenHeaders(res, "", "");
        res.status(401).json({ error: "Unauthorized" });
        return null;
    }
    const { accessToken: newAccessToken, refreshToken: newRefreshToken, userId } = validated;
    res.setHeader("Authorization", `Bearer ${newAccessToken}`);
    res.setHeader("x-refresh-token", newRefreshToken)
    return userId;
}

export function setTokenHeaders(res: VercelResponse, accessToken: string, refreshToken: string) {
    res.setHeader("Authorization", `Bearer ${accessToken}`);
    res.setHeader("x-refresh-token", refreshToken);
}
