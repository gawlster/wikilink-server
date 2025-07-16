import { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCORS, handleProtectedAuth } from "../../utils/serverUtils";
import { deleteActiveGame } from "../../utils/activeGame";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const shouldReturn = handleCORS(req, res);
    if (shouldReturn) {
        return;
    }
    const badAuth = handleProtectedAuth(req, res);
    if (badAuth) {
        return;
    }
    const { id } = req.body;
    try {
        if (!id) {
            res.status(400).json({ error: "Missing active game ID" });
            return;
        }

        await deleteActiveGame(id);
        res.status(200).json({});
    } catch (error) {
        console.error("Error deleting active game:", error);
        res.status(500).json({ error: "Failed to delete active game" });
    }
}
