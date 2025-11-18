// Redis channel event handlers
import { redisBroadcast } from '../broadcasting/RedisBroadcast';

async function handleGameStart(message: any, channel: string): Promise<void>
{
  console.log(` Game start event received on channel ${channel}:`, message);
}

// Register Redis channel handlers
redisBroadcast.registerChannelHandler('game', 'game.start', handleGameStart);


