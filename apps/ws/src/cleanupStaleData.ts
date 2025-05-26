// cleanupStaleData.ts
import { RedisClientType } from "redis";

export async function cleanupStaleData(redis: RedisClientType<{}, {}>) {
    try {
        const roomKeys = await redis.keys("room:*");
        
        if (roomKeys.length > 0) {
            await (redis.del as (...args: string[]) => Promise<number>).apply(redis, roomKeys); //this tells ts explicitly that redis.del accepts a variable number of strings and avoids spread-related inference issues.
        }
        

        console.log("cleaned up stale room data on startup");
    } catch (error) {
        console.error("error cleaning up stale data:", error);
    }
}


