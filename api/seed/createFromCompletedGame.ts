import { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCORS, handleProtectedAuth } from "../../utils/serverUtils";
import { CompletedGame, getCompletedGameFromId } from "../../utils/completedGame";
import { createSeededGameFromCompletedGame, getSeededGameFromId } from "../../utils/seededGame";

type Body = {
    gameId: string;
}
function isValidBody(body: any): body is Body {
    return (
        typeof body === 'object' &&
        body !== null &&
        typeof body.gameId === 'string'
    );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const shouldReturn = handleCORS(req, res);
    if (shouldReturn) {
        return;
    }
    const userId = await handleProtectedAuth(req, res);
    if (!userId) {
        return;
    }
    if (!isValidBody(req.body)) {
        res.status(400).json({ error: "Invalid request body" });
        return;
    }
    const { gameId } = req.body;
    let completedGame: CompletedGame;
    try {
        completedGame = await getCompletedGameFromId(gameId);
        if (!completedGame) {
            res.status(404).json({ error: "Completed game not found" });
            return;
        }
    } catch (error) {
        console.error("Error retrieving completed game:", error);
        res.status(500).json({ error: "Failed to retrieve completed game" });
        return;
    }
    if (completedGame.userId !== userId) {
        console.log("User does not have permission to access this completed game");
        res.status(403).json({ error: "Forbidden: You do not have permission to access this completed game" });
        return;
    }
    if (completedGame.createdFromSeed) {
        console.log("This game was already created from a seed. No need to create a new one, return the existing one.");
        try {
            const seededGame = await getSeededGameFromId(completedGame.createdFromSeed);
            if (!seededGame) {
                console.log("Seeded game not found for completed game:", completedGame.id);
                res.status(404).json({ error: "Seeded game not found" });
                return;
            }
            return res.status(200).json(seededGame);
        } catch (error) {
            console.error("Error retrieving seeded game from completed game:", error);
            res.status(500).json({ error: "Failed to retrieve seeded game from completed game" });
            return;
        }
    }
    try {
        const seededGame = await createSeededGameFromCompletedGame(completedGame);
        res.status(201).json(seededGame);
    } catch (error) {
        console.error("Error creating seeded game from completed game:", error);
        res.status(500).json({ error: "Failed to create seeded game from completed game" });
    }
}
