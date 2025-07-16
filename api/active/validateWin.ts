import { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCORS } from "../../serverUtils";
import { deleteActiveGame, getActiveGameFromId } from "../../utils/activeGame";
import { getOutgoingArticleUrls } from "../../utils/wikipediaUtils";
import { createCompletedGame } from "../../utils/completedGame";

type Body = {
    id: string;
    visitedUrls: string[];
}
function isValidBody(body: any): body is Body {
    return (
        typeof body === 'object' &&
        body !== null &&
        typeof body.id === 'string' &&
        Array.isArray(body.visitedUrls) &&
        body.visitedUrls.every(url => typeof url === 'string')
    )
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const shouldReturn = handleCORS(req, res);
    if (shouldReturn) {
        return;
    }
    if (!isValidBody(req.body)) {
        res.status(400).json({ error: "Invalid request body" });
        return;
    }
    const { id, visitedUrls } = req.body;
    const activeGame = await getActiveGameFromId(id);
    if (!activeGame) {
        res.status(404).json({ error: "Active game not found" });
        return;
    }
    if (visitedUrls[0] !== activeGame.startingArticleUrl) {
        res.status(400).json({ error: "First visited URL must be the starting article URL" });
        return;
    }
    if (visitedUrls[visitedUrls.length - 1] !== activeGame.endingArticleUrl) {
        res.status(400).json({ error: "Last visited URL must be the ending article URL" });
        return;
    }
    for (let i = 0; i < visitedUrls.length - 1; i++) {
        const currentUrl = visitedUrls[i];
        const validNextUrls = await getOutgoingArticleUrls(currentUrl);
        if (!validNextUrls.includes(visitedUrls[i + 1])) {
            res.status(400).json({ error: `Invalid navigation from ${currentUrl} to ${visitedUrls[i + 1]}` });
            return;
        }
    }
    await createCompletedGame(activeGame, visitedUrls);
    await deleteActiveGame(id);
    res.status(200).json({});
}
