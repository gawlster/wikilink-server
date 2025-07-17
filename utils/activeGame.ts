import { v4 as uuidv4 } from 'uuid';
import { getRandomStartAndEnd } from "./wikipediaUtils";
import { redis } from './redis';

export type ActiveGame = {
    id: string;
    startingArticleUrl: string;
    endingArticleUrl: string;
    minSteps: number;
    userId: string;
}
function isValidActiveGame(game: any): game is ActiveGame {
    return (
        typeof game === 'object' &&
        game !== null &&
        typeof game.id === 'string' &&
        typeof game.startingArticleUrl === 'string' &&
        typeof game.endingArticleUrl === 'string' &&
        typeof game.minSteps === 'number' &&
        typeof game.userId === 'string'
    )
}

export async function createActiveGame(userId: string): Promise<ActiveGame> {
    const { startingArticleUrl, endingArticleUrl, minSteps } = await getRandomStartAndEnd();
    const game: ActiveGame = {
        id: uuidv4(),
        startingArticleUrl,
        endingArticleUrl,
        minSteps,
        userId
    };
    await saveActiveGame(game);
    return game;
}

export async function saveActiveGame(game: ActiveGame): Promise<void> {
    await redis.set(`activeGame:${game.id}`, JSON.stringify(game), { ex: 3600 });
    console.log(`Game saved: ${JSON.stringify(game)}`);
}

export async function getActiveGameFromId(gameId: string) {
    const raw = await redis.get(`activeGame:${gameId}`);
    if (typeof raw !== "object" || raw === null || !isValidActiveGame(raw)) {
        throw new Error(`Game with ID ${gameId} not found or malformed`);
    }
    return raw as ActiveGame;
}

export async function deleteActiveGame(gameId: string): Promise<void> {
    await redis.del(`activeGame:${gameId}`);
    console.log(`Game deleted: ${gameId}`);
}
