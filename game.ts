import { v4 as uuidv4 } from 'uuid';
import { getRandomStartAndEnd } from "./wikipediaUtils";
import { Redis } from "@upstash/redis";

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

type Game = {
    id: string;
    startingArticleUrl: string;
    endingArticleUrl: string;
    currentArticleUrl: string;
    minSteps: number;
    stepsTaken: number;
    hasWon: boolean;
}

export async function createGame(): Promise<Game> {
    const { startingArticleUrl, endingArticleUrl, minSteps } = await getRandomStartAndEnd();
    const game: Game = {
        id: uuidv4(),
        startingArticleUrl,
        endingArticleUrl,
        currentArticleUrl: startingArticleUrl,
        minSteps,
        stepsTaken: 0,
        hasWon: false
    };
    await saveGame(game);
    return game;
}

export async function getGameFromId(gameId: string) {
    const raw = await redis.get(`game:${gameId}`);
    if (typeof raw !== "object" || raw === null || !isValidGame(raw)) {
        throw new Error(`Game with ID ${gameId} not found or malformed`);
    }
    return raw as Game;
}

function isValidGame(game: any): game is Game {
    return typeof game.id === 'string' &&
        typeof game.startingArticleUrl === 'string' &&
        typeof game.endingArticleUrl === 'string' &&
        typeof game.currentArticleUrl === 'string' &&
        typeof game.minSteps === 'number' &&
        typeof game.stepsTaken === 'number' &&
        typeof game.hasWon === 'boolean';
}

export async function saveGame(game: Game): Promise<void> {
    await redis.set(`game:${game.id}`, JSON.stringify(game), { ex: 3600 });
    console.log(`Game saved: ${JSON.stringify(game)}`);
}

export async function deleteGame(gameId: string): Promise<void> {
    await redis.del(`game:${gameId}`);
    console.log(`Game deleted: ${gameId}`);
}
