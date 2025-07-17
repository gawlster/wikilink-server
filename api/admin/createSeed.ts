import { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCORS, handleProtectedAuth } from "../../utils/serverUtils";
import { CATEGORY, createSeededGame } from "../../utils/seededGame";

type Body = {
    startingArticleUrl: string;
    endingArticleUrl: string;
    minSteps: number;
    category?: CATEGORY;
}
function isValidBody(body: any): body is Body {
    return (
        typeof body === 'object' &&
        body !== null &&
        typeof body.startingArticleUrl === 'string' &&
        typeof body.endingArticleUrl === 'string' &&
        typeof body.minSteps === 'number' &&
        (body.category === undefined || Object.values(CATEGORY).includes(body.category))
    )
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
    const { startingArticleUrl, endingArticleUrl, minSteps, category } = req.body;
    try {
        const seededGame = await createSeededGame(startingArticleUrl, endingArticleUrl, minSteps, category);
        res.status(201).json(seededGame);
    } catch (error) {
        console.error("Error creating seeded game:", error);
        res.status(500).json({ error: "Failed to create seeded game" });
    }
}
