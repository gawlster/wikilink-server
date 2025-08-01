import { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCORS, handleProtectedAuth } from "../../utils/serverUtils";
import { deleteActiveGame, getActiveGameFromId } from "../../utils/activeGame";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const shouldReturn = handleCORS(req, res);
    if (shouldReturn) {
        return;
    }
    const userId = await handleProtectedAuth(req, res);
    if (!userId) {
        return; // handleProtectedAuth already sends a VercelResponse
    }
    const { id } = req.body;
    if (!id) {
        res.status(400).json({ message: "Malformed request body" });
        return;
    }
    const activeGame = await getActiveGameFromId(id);
    if (!activeGame) {
        console.log("Active game not found for id:", id);
        res.status(404).json({ message: "Game not found" });
        return;
    }
    if (activeGame.userId !== userId) {
        res.status(403).json({ message: "Forbidden: You do not have permission to delete this game" });
        return;
    }
    try {
        await deleteActiveGame(id);
        res.status(200).json({});
    } catch (error) {
        console.error("Error deleting active game:", error);
        res.status(500).json({ message: "Failed to delete active game" });
    }
}
