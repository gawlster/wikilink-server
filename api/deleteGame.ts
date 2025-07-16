import { VercelRequest, VercelResponse } from "@vercel/node";
import { deleteGame } from "../game";
import { handleCORS } from "../serverUtils";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const shouldReturn = handleCORS(req, res);
    if (shouldReturn) {
        return;
    }
    const { gameId } = req.body;
    try {
        if (!gameId) {
            res.status(400).json({ error: "Missing game ID" });
            return;
        }

        await deleteGame(gameId);
        res.status(200).json({});
    } catch (error) {
        console.error("Error deleting game:", error);
        res.status(500).json({ error: "Failed to delete game" });
    }
}
