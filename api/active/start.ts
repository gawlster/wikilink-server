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
    try {
        const activeGames = await getAllActiveGamesForUser(userId);
        for (const game of activeGames) {
            await deleteActiveGame(game.id);
        }
    } catch (error) {
        console.log("Error searching for existing active games for user while trying to start new game: ", error);
    }
    try {
        const game = await createActiveGame(userId);
        res.status(200).json(game);
    } catch (error) {
        console.error("Error starting game:", error);
        res.status(500).json({ error: "Failed to start game" });
    }
}
