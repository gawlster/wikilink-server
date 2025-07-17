import jwt from 'jsonwebtoken';
import { redis } from './redis';

function generateAccessToken(userId: string): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT secret is not defined");
    }
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET as string, {
        expiresIn: '1h'
    })
    return token;
}

function generateRefreshToken(userId: string): string {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) {
        throw new Error("JWT refresh secret is not defined");
    }
    const token = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET as string, {
        expiresIn: '7d'
    });
    return token;
}

export function generateTokens(userId: string): { accessToken: string; refreshToken: string } {
    const accessToken = generateAccessToken(userId);
    const refreshToken = generateRefreshToken(userId);
    return { accessToken, refreshToken };
}

export async function verifyTokens(tokens: { accessToken: string; refreshToken: string }): Promise<{ accessToken: string; refreshToken: string; userId: string } | null> {
    const accessSecret = process.env.JWT_SECRET;
    const refreshSecret = process.env.JWT_REFRESH_SECRET;

    if (!accessSecret || !refreshSecret) {
        throw new Error("JWT secrets are not defined");
    }

    try {
        const decodedAccessToken = jwt.verify(tokens.accessToken, accessSecret) as { id: string };
        return {
            ...tokens,
            userId: decodedAccessToken.id
        };
    } catch (accessError) {
        if (accessError.name !== 'TokenExpiredError') {
            console.error("Invalid access token", accessError);
            return null;
        }
        try {
            const storedRefresh = await redis.get(`refreshToken:${tokens.refreshToken}`);
            if (!storedRefresh) {
                console.error("Refresh token not found in database");
                return null;
            }
            const decodedRefreshToken = jwt.verify(tokens.refreshToken, refreshSecret) as { id: string };
            const newAccessToken = generateAccessToken(decodedRefreshToken.id);
            const newRefreshToken = generateRefreshToken(decodedRefreshToken.id);
            await redis.del(`refreshToken:${tokens.refreshToken}`);
            await redis.set(`refreshToken:${newRefreshToken}`, decodedRefreshToken.id, { ex: 60 * 60 * 24 * 7 });
            return { accessToken: newAccessToken, refreshToken: newRefreshToken, userId: decodedRefreshToken.id };
        } catch (refreshError) {
            console.error("Invalid tokens", accessError, refreshError);
            return null;
        }
    }
}

export function verifyTokenAndReturnUserId(token: string): string | null {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT secret is not defined");
    }
    try {
        const decoded = jwt.verify(token, secret) as { id: string };
        return decoded.id;
    } catch (error) {
        console.error("Invalid token", error);
        return null;
    }
}
