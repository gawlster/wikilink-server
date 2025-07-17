import { v4 as uuidv4 } from 'uuid';
import { getRandomStartAndEnd } from "./wikipediaUtils";
import { redis } from './redis';
import { getSeededGameFromId } from './seededGame';

export type ActiveGame = {
    id: string;
    startingArticleUrl: string;
    endingArticleUrl: string;
    minSteps: number;
    userId: string;
    createdFromSeed?: string;
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

export async function createActiveGameFromSeed(userId: string, seedId: string): Promise<ActiveGame> {
    const seededGame = await getSeededGameFromId(seedId);
    const game: ActiveGame = {
        id: uuidv4(),
        startingArticleUrl: seededGame.startingArticleUrl,
        endingArticleUrl: seededGame.endingArticleUrl,
        minSteps: seededGame.minSteps,
        userId,
        createdFromSeed: seedId
    }
    await saveActiveGame(game);
    return game;
}

export async function saveActiveGame(game: ActiveGame): Promise<void> {
    await redis.set(`activeGame:${game.id}`, JSON.stringify(game), { ex: 3600 });
    console.log(`Active game saved: ${JSON.stringify(game)}`);
}

export async function getActiveGameFromId(gameId: string) {
    const raw = await redis.get(`activeGame:${gameId}`);
    if (typeof raw !== "object" || raw === null || !isValidActiveGame(raw)) {
        console.log(`Active game with ID ${gameId} not found or malformed`);
        throw new Error(`Active game with ID ${gameId} not found or malformed`);
    }
    return raw as ActiveGame;
}

export async function getAllActiveGamesForUser(userId: string): Promise<ActiveGame[]> {
    const keys = await redis.keys(`activeGame:*`);
    const activeGames: ActiveGame[] = [];
    for (const key of keys) {
        const gameId = key.split(':')[1];
        const game = await getActiveGameFromId(gameId);
        if (game.userId === userId) {
            activeGames.push(game);
        }
    }
    return activeGames;
}

export async function deleteActiveGame(gameId: string): Promise<void> {
    await redis.del(`activeGame:${gameId}`);
    console.log(`Active game deleted: ${gameId}`);
}
