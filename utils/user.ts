import { v4 as uuidv4 } from 'uuid';
import { redis } from './redis';
import bcrypt from 'bcryptjs';

export type User = {
    id: string;
    email: string;
    passwordHash: string;
}
function isValidUser(user: any): user is User {
    return (
        typeof user === 'object' &&
        user !== null &&
        typeof user.id === 'string' &&
        typeof user.email === 'string' &&
        typeof user.passwordHash === 'string'
    );
}

export async function createUser(email: string, password: string): Promise<User> {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const user: User = {
        id: uuidv4(),
        email,
        passwordHash
    }

    await saveUser(user);
    return user;
}

export async function saveUser(user: User): Promise<void> {
    await redis.set(`user:${user.id}`, JSON.stringify(user));
    console.log(`User saved: ${JSON.stringify(user)}`);
}

export async function getUserFromId(id: string) {
    const raw = await redis.get(`user:${id}`);
    console.log(`Raw user data for ID ${id}:`, raw);
    if (typeof raw !== "object" || raw === null || !isValidUser(raw)) {
        console.log(`User with ID ${id} not found or malformed`);
        throw new Error(`User with ID ${id} not found or malformed`);
    }
    return raw as User;
}

export async function getUserFromEmail(email: string): Promise<User | null> {
    const keys = await redis.keys('user:*');
    for (const key of keys) {
        const userId = key.split(':')[1];
        const user = await getUserFromId(userId);
        if (user.email === email) {
            return user;
        }
    }
    return null;
}

export async function isPasswordValid(user: User, password: string): Promise<boolean> {
    return await bcrypt.compare(password, user.passwordHash);
}

export async function deleteUser(id: string): Promise<void> {
    await redis.del(`user:${id}`);
    console.log(`User deleted: ${id}`);
}
