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
        res.status(400).json({ error: "Missing active game ID" });
        return;
    }
    const activeGame = await getActiveGameFromId(id);
    if (!activeGame) {
        console.log("Active game not found for id:", id);
        res.status(404).json({ error: "Active game not found" });
        return;
    }
    if (activeGame.userId !== userId) {
        console.log("User does not have permission to delete this game");
        res.status(403).json({ error: "Forbidden: You do not have permission to delete this game" });
        return;
    }
    try {
        await deleteActiveGame(id);
        res.status(200).json({});
    } catch (error) {
        console.error("Error deleting active game:", error);
        res.status(500).json({ error: "Failed to delete active game" });
    }
}
