import { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCORS, handleProtectedAuth } from "../../utils/serverUtils";
import { createActiveGame } from "../../utils/activeGame";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const badCors = handleCORS(req, res);
    if (badCors) {
        return;
    }
    const badAuth = handleProtectedAuth(req, res);
    if (badAuth) {
        return;
    }
    try {
        const game = await createActiveGame();
        res.status(200).json(game);
    } catch (error) {
        console.error("Error starting game:", error);
        res.status(500).json({ error: "Failed to start game" });
    }
}
