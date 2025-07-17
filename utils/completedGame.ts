import { type ActiveGame } from './activeGame';
import { redis } from './redis';

export type CompletedGame = {
    id: string;
    startingArticleUrl: string;
    endingArticleUrl: string;
    minSteps: number;
    steps: string[];
    userId: string;
    completedAt: string; // ISO date string
};
function isValidCompletedGame(game: any): game is CompletedGame {
    return (
        typeof game === 'object' &&
        game !== null &&
        typeof game.id === 'string' &&
        typeof game.startingArticleUrl === 'string' &&
        typeof game.endingArticleUrl === 'string' &&
        typeof game.minSteps === 'number' &&
        Array.isArray(game.steps) &&
        (game.steps as any[]).every(step => typeof step === 'string') &&
        typeof game.userId === 'string' &&
        typeof game.completedAt === 'string'
    );
}

export async function createCompletedGame(activeGame: ActiveGame, steps: string[]): Promise<CompletedGame> {
    const completedGame: CompletedGame = {
        id: activeGame.id,
        startingArticleUrl: activeGame.startingArticleUrl,
        endingArticleUrl: activeGame.endingArticleUrl,
        minSteps: activeGame.minSteps,
        steps,
        userId: activeGame.userId,
        completedAt: new Date().toISOString(),
    };
    await saveCompletedGame(completedGame);
    return completedGame;
}

export async function saveCompletedGame(game: CompletedGame): Promise<void> {
    await redis.set(`completedGame:${game.id}`, JSON.stringify(game));
    console.log(`Completed game saved: ${JSON.stringify(game)}`);
}

export async function getCompletedGameFromId(gameId: string) {
    const raw = await redis.get(`completedGame:${gameId}`);
    if (typeof raw !== "object" || raw === null || !isValidCompletedGame(raw)) {
        throw new Error(`Completed game with ID ${gameId} not found or malformed`);
    }
    return raw as CompletedGame;
}

export async function deleteCompletedGame(gameId: string): Promise<void> {
    await redis.del(`completedGame:${gameId}`);
    console.log(`Completed game deleted: ${gameId}`);
}
