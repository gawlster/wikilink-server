import { User } from "./user";
import jwt from 'jsonwebtoken';

export function generateToken(userId: string): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT secret is not defined");
    }
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET as string, {
        expiresIn: '1h'
    })
    return token;
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

export function verifyTokenAndGenerateNew(token: string): string | null {
    const userId = verifyTokenAndReturnUserId(token);
    if (!userId) {
        return null;
    }
    return generateToken(userId);
}
