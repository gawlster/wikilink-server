import { v4 as uuidv4 } from 'uuid';
import { redis } from './redis';
import { CompletedGame } from './completedGame';

export enum CATEGORY {
    RANDOM = "random",
    SCIENCE = "science"
}

export type SeededGame = {
    id: string;
    startingArticleUrl: string;
    endingArticleUrl: string;
    minSteps: number;
    category: CATEGORY;
}
function isValidSeededGame(game: any): game is SeededGame {
    return (
        typeof game === 'object' &&
        game !== null &&
        typeof game.id === 'string' &&
        typeof game.startingArticleUrl === 'string' &&
        typeof game.endingArticleUrl === 'string' &&
        typeof game.minSteps === 'number'
    );
}

export async function createSeededGame(startingArticleUrl: string, endingArticleUrl: string, minSteps: number, category: CATEGORY = CATEGORY.RANDOM): Promise<SeededGame> {
    const seededGame: SeededGame = {
        id: uuidv4(),
        startingArticleUrl,
        endingArticleUrl,
        minSteps,
        category,
    }
    await saveSeededGame(seededGame);
    return seededGame;
}

export async function createSeededGameFromCompletedGame(game: CompletedGame) {
    const seededGame: SeededGame = {
        id: uuidv4(),
        startingArticleUrl: game.startingArticleUrl,
        endingArticleUrl: game.endingArticleUrl,
        minSteps: game.minSteps,
        category: CATEGORY.RANDOM,
    }
    await saveSeededGame(seededGame);
    return seededGame;
}

export async function saveSeededGame(game: SeededGame): Promise<void> {
    await redis.set(`seededGame:${game.id}`, JSON.stringify(game));
    console.log(`Seeded game saved: ${JSON.stringify(game)}`);
}

export async function getSeededGameFromId(gameId: string) {
    const raw = await redis.get(`seededGame:${gameId}`);
    if (typeof raw !== "object" || raw === null || !isValidSeededGame(raw)) {
        console.log(`Seeded game with ID ${gameId} not found or malformed`);
        throw new Error(`Seeded game with ID ${gameId} not found or malformed`);
    }
    return raw as SeededGame;
}

export async function deleteSeededGame(gameId: string): Promise<void> {
    await redis.del(`seededGame:${gameId}`);
    console.log(`Seeded game deleted: ${gameId}`);
}
