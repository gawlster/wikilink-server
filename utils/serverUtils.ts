import { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyTokenAndGenerateNew } from "./auth";

export function handleCORS(req: VercelRequest, res: VercelResponse) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    // Handle preflight request
    if (req.method === "OPTIONS") {
        res.status(204).end(); // No content
        return true;
    }
    return false;
}

export function handleProtectedAuth(req: VercelRequest, res: VercelResponse) {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        console.log("No token provided");
        res.status(401).json({ error: "No token provided" });
        return true;
    }
    const newToken = verifyTokenAndGenerateNew(token);
    if (!newToken) {
        console.log("Invalid token");
        res.status(401).json({ error: "Invalid token" });
        return true;
    }
    res.setHeader("Authorization", `Bearer ${newToken}`);
    return false;
}
