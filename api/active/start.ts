import { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCORS, handleProtectedAuth } from "../../utils/serverUtils";
import { createActiveGame, deleteActiveGame, getAllActiveGamesForUser } from "../../utils/activeGame";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const badCors = handleCORS(req, res);
    if (badCors) {
        return;
    }
    const userId = await handleProtectedAuth(req, res);
    if (!userId) {
        return; // handleProtectedAuth already sends a VercelResponse
    }
    // TODO: Make sure the user doesn't have another active game
    try {
        const game = await createActiveGame(userId);
        res.status(200).json(game);
    } catch (error) {
        console.error("Error starting game:", error);
        res.status(500).json({ message: "Failed to start game" });
    }
}
