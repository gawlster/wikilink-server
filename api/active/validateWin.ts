import { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCORS, handleProtectedAuth } from "../../utils/serverUtils";
import { deleteActiveGame, getActiveGameFromId } from "../../utils/activeGame";
import { areArticlesTheSame, getOutgoingArticleUrls } from "../../utils/wikipediaUtils";
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
        (body.visitedUrls as any[]).every(url => typeof url === 'string')
    )
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const shouldReturn = handleCORS(req, res);
    if (shouldReturn) {
        return;
    }
    const userId = await handleProtectedAuth(req, res);
    if (!userId) {
        return; // handleProtectedAuth already sends a VercelResponse
    }
    if (!isValidBody(req.body)) {
        console.log("Checking body")
        res.status(400).json({ error: "Invalid request body" });
        return;
    }
    const { id, visitedUrls } = req.body;
    const activeGame = await getActiveGameFromId(id);
    if (!activeGame) {
        console.log("Active game not found for id:", id);
        res.status(404).json({ error: "Active game not found" });
        return;
    }
    if (activeGame.userId !== userId) {
        console.log("User does not have permission to validate this game");
        res.status(403).json({ error: "Forbidden: You do not have permission to validate this game" });
        return;
    }
    if (!areArticlesTheSame(activeGame.startingArticleUrl, visitedUrls[0])) {
        console.log("First visited URL does not match starting article URL");
        res.status(400).json({ error: "First visited URL must be the starting article URL" });
        return;
    }
    if (!areArticlesTheSame(visitedUrls[visitedUrls.length - 1], activeGame.endingArticleUrl)) {
        console.log("Last visited URL does not match ending article URL");
        res.status(400).json({ error: "Last visited URL must be the ending article URL" });
        return;
    }
    for (let i = 0; i < visitedUrls.length - 1; i++) {
        const currentUrl = visitedUrls[i];
        const validNextUrls = await getOutgoingArticleUrls(currentUrl);
        let isValid = false;
        for (const nextUrl of validNextUrls) {
            if (areArticlesTheSame(nextUrl, visitedUrls[i + 1])) {
                isValid = true;
                break;
            }
        }
        if (!isValid) {
            res.status(400).json({ error: `Invalid navigation from ${currentUrl} to ${visitedUrls[i + 1]}` });
            return;
        }
    }
    await createCompletedGame(activeGame, visitedUrls);
    await deleteActiveGame(id);
    res.status(200).json({});
}
