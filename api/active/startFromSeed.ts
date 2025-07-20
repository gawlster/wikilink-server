import { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCORS, handleProtectedAuth } from "../../utils/serverUtils";
import { createActiveGameFromSeed } from "../../utils/activeGame";
import { getSeededGameFromId } from "../../utils/seededGame";

type Body = {
    seedId: string;
}
function isValidBody(body: any): body is Body {
    return (
        typeof body === 'object' &&
        body !== null &&
        typeof body.seedId === 'string'
    );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const badCors = handleCORS(req, res);
    if (badCors) {
        return;
    }
    const userId = await handleProtectedAuth(req, res);
    if (!userId) {
        return; // handleProtectedAuth already sends a VercelResponse
    }
    if (!isValidBody(req.body)) {
        res.status(400).json({ message: "Malformed request body" });
        return;
    }
    const { seedId } = req.body;
    try {
        await getSeededGameFromId(seedId);
    } catch (error) {
        res.status(400).json({ message: "Invalid seed ID" });
    }
    try {
        const game = await createActiveGameFromSeed(userId, seedId);
        res.status(200).json(game);
    } catch (error) {
        console.error("Error starting game:", error);
        res.status(500).json({ message: "Failed to start game" });
    }
}
