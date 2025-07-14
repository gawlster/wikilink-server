import { createGame } from "../game";
import { VercelRequest, VercelResponse } from "@vercel/node";

export async function POST(req: VercelRequest, res: VercelResponse) {
    try {
        console.log("inrequest");
        const game = await createGame();
        res.status(200).json(game);
    } catch (error) {
        console.error("Error starting game:", error);
        res.status(500).json({ error: "Failed to start game" });
    }
}
