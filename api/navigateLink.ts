import { VercelRequest, VercelResponse } from "@vercel/node";
import { getGameFromId, saveGame } from "../game";
import { areArticlesTheSame, getOutgoingArticleUrls } from "../wikipediaUtils";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const { gameId, oldPageUrl, newPageUrl } = req.body;
    try {
        if (!gameId || !oldPageUrl || !newPageUrl) {
            res.status(400).json({ error: "Missing required parameters" });
            return;
        }

        const game = await getGameFromId(gameId);
        if (!areArticlesTheSame(game.currentArticleUrl, oldPageUrl)) {
            res.status(400).json({ error: "Invalid game ID or current article URL" });
            return;
        }

        const legalLinks = await getOutgoingArticleUrls(oldPageUrl);
        if (!legalLinks.find((link) => areArticlesTheSame(link, newPageUrl))) {
            res.status(400).json({ error: "Illegal navigation" });
            return;
        }

        game.currentArticleUrl = newPageUrl;
        game.stepsTaken += 1;

        if (areArticlesTheSame(newPageUrl, game.endingArticleUrl)) {
            game.hasWon = true;
        }

        await saveGame(game);

        res.status(200).json({ game });
    } catch (error) {
        console.error("Error navigating link:", error);
        res.status(500).json({ error: "Failed to navigate link" });
    }
}
