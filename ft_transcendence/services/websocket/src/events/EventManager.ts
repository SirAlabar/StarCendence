//  Event routing and handling
import { ConnectionInfo, WebSocketMessage } from '../types/connection.types';

export type EventHandler = (message: WebSocketMessage, connection: ConnectionInfo) => Promise<void> | void;

export class EventManager
{
  private static handlers: Map<string, EventHandler> = new Map();

  static registerHandler(eventType: string, handler: EventHandler): void
  {
    this.handlers.set(eventType, handler);
  }

  static unregisterHandler(eventType: string): void
  {
    this.handlers.delete(eventType);
  }

  static async handleMessage(message: WebSocketMessage, connection: ConnectionInfo): Promise<void>
  {
    try
    {
      const handler = this.handlers.get(message.type);
      if (handler)
      {
        await handler(message, connection);
      }
      else
      {
        console.warn(`[EventManager] No handler registered for event type: ${message.type}`);
      }
    }
    catch (error)
    {
      console.error(`[EventManager] Error handling message type ${message.type}:`, error);
    }
  }

  static getRegisteredEventTypes(): string[]
  {
    return Array.from(this.handlers.keys());
  }

  static hasHandler(eventType: string): boolean
  {
    return this.handlers.has(eventType);
  }
}
