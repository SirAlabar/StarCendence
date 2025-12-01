import { createClient } from 'redis';

let baseClient: ReturnType<typeof createClient> | null = null;
let publisher : ReturnType<typeof createClient> | null = null;
let subscriber : ReturnType<typeof createClient> | null = null;

export async function initializeRedis () {

}

export async function getRedisClient() {

}