/**
 * Notification System Tester Component
 * 
 * Debug component to test notifications without backend.
 * Add this to any page temporarily to test the notification system.
 * 
 * Usage:
 * import { NotificationTester } from './components/notifications/NotificationTester';
 * const tester = new NotificationTester();
 * tester.mount('#app'); // Or any container
 */

import { BaseComponent } from '../BaseComponent';
import { globalWebSocketHandler } from '../../services/websocket/GlobalWebSocketHandler';

export class NotificationTester extends BaseComponent {
    private testCounter = 0;

    render(): string {
        return `
            <div class="fixed bottom-4 left-4 z-[9999] bg-gray-900 border border-cyan-500 rounded-lg p-4 shadow-2xl max-w-md">
                <h3 class="text-white font-bold text-lg mb-3">🧪 Notification Tester</h3>
                <div class="space-y-2">
                    <button id="test-chat" class="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors">
                        💬 Test Chat Message (Normal)
                    </button>
                    <button id="test-invitation" class="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors">
                        🎮 Test Lobby Invitation (High)
                    </button>
                    <button id="test-friend-request" class="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors">
                        👥 Test Friend Request (High)
                    </button>
                    <button id="test-game-started" class="w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm transition-colors">
                        🎯 Test Game Started (Normal)
                    </button>
                    <button id="test-achievement" class="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm transition-colors">
                        🏆 Test Achievement (Normal)
                    </button>
                    <button id="test-expired-invitation" class="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors">
                        ⏰ Test Expired Invitation
                    </button>
                    <button id="test-multiple" class="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm transition-colors">
                        📦 Test Multiple Notifications
                    </button>
                    <button id="close-tester" class="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors mt-4">
                        ✕ Close Tester
                    </button>
                </div>
                <p class="text-xs text-gray-400 mt-3">
                    Counter: <span id="test-counter">0</span> notifications sent
                </p>
            </div>
        `;
    }

    protected afterMount(): void {
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        document.getElementById('test-chat')?.addEventListener('click', () => this.testChatMessage());
        document.getElementById('test-invitation')?.addEventListener('click', () => this.testInvitation());
        document.getElementById('test-friend-request')?.addEventListener('click', () => this.testFriendRequest());
        document.getElementById('test-game-started')?.addEventListener('click', () => this.testGameStarted());
        document.getElementById('test-achievement')?.addEventListener('click', () => this.testAchievement());
        document.getElementById('test-expired-invitation')?.addEventListener('click', () => this.testExpiredInvitation());
        document.getElementById('test-multiple')?.addEventListener('click', () => this.testMultiple());
        document.getElementById('close-tester')?.addEventListener('click', () => this.remove());
    }

    private testChatMessage(): void {
        const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'];
        const messages = [
            'Hey, how are you?',
            'Want to play a game?',
            'Check out this cool feature!',
            'See you later!',
            'Good game!'
        ];
        
        const randomName = names[Math.floor(Math.random() * names.length)];
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];

        globalWebSocketHandler['handleMessage']({
            type: 'chat:message',
            payload: {
                id: `chat_${Date.now()}`,
                userId: `user_${Math.floor(Math.random() * 1000)}`,
                username: randomName,
                avatarUrl: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
                message: randomMessage,
                timestamp: Date.now()
            }
        });

        this.incrementCounter();
    }

    private testInvitation(): void {
        const names = ['Alice', 'Bob', 'Charlie', 'Diana'];
        const games = ['pong', 'race', 'tournament'];
        
        const randomName = names[Math.floor(Math.random() * names.length)];
        const randomGame = games[Math.floor(Math.random() * games.length)];

        globalWebSocketHandler['handleMessage']({
            type: 'lobby:invitation',
            payload: {
                invitationId: `inv_${Date.now()}`,
                lobbyId: `lobby_${Math.floor(Math.random() * 1000)}`,
                gameType: randomGame,
                fromUserId: `user_${Math.floor(Math.random() * 1000)}`,
                fromUsername: randomName,
                fromAvatarUrl: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
                timestamp: Date.now(),
                expiresAt: Date.now() + 300000 // 5 minutes
            }
        });

        this.incrementCounter();
    }

    private testFriendRequest(): void {
        const names = ['Alex', 'Morgan', 'Taylor', 'Jordan', 'Casey'];
        const randomName = names[Math.floor(Math.random() * names.length)];

        globalWebSocketHandler['handleMessage']({
            type: 'notification:new',
            payload: {
                id: `notif_${Date.now()}`,
                type: 'friend_request',
                title: 'New Friend Request',
                message: `${randomName} wants to be your friend`,
                timestamp: Date.now(),
                data: {
                    userId: `user_${Math.floor(Math.random() * 1000)}`,
                    username: randomName,
                    avatarUrl: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`
                }
            }
        });

        this.incrementCounter();
    }

    private testGameStarted(): void {
        globalWebSocketHandler['handleMessage']({
            type: 'notification:new',
            payload: {
                id: `notif_${Date.now()}`,
                type: 'game_started',
                title: 'Game Started',
                message: 'Your pong match has begun!',
                timestamp: Date.now(),
                data: {
                    lobbyId: `lobby_${Math.floor(Math.random() * 1000)}`,
                    gameType: 'pong'
                }
            }
        });

        this.incrementCounter();
    }

    private testAchievement(): void {
        const achievements = [
            { title: 'First Victory', message: 'Win your first game' },
            { title: 'Winning Streak', message: 'Win 5 games in a row' },
            { title: 'Perfect Game', message: 'Win without losing a point' },
            { title: 'Social Butterfly', message: 'Add 10 friends' },
            { title: 'Tournament Master', message: 'Win a tournament' }
        ];
        
        const randomAchievement = achievements[Math.floor(Math.random() * achievements.length)];

        globalWebSocketHandler['handleMessage']({
            type: 'notification:new',
            payload: {
                id: `notif_${Date.now()}`,
                type: 'achievement',
                title: `🏆 ${randomAchievement.title}`,
                message: randomAchievement.message,
                timestamp: Date.now(),
                data: {}
            }
        });

        this.incrementCounter();
    }

    private testExpiredInvitation(): void {
        globalWebSocketHandler['handleMessage']({
            type: 'lobby:invitation',
            payload: {
                invitationId: `inv_expired_${Date.now()}`,
                lobbyId: `lobby_${Math.floor(Math.random() * 1000)}`,
                gameType: 'pong',
                fromUserId: 'user_999',
                fromUsername: 'ExpiredUser',
                timestamp: Date.now() - 400000, // 6.5 minutes ago
                expiresAt: Date.now() - 100000  // Already expired
            }
        });

        this.incrementCounter();
        
        setTimeout(() => {
            alert('The expired invitation should disappear automatically!');
        }, 1000);
    }

    private testMultiple(): void {
        console.log('🚀 Sending 5 notifications in sequence...');
        
        this.testChatMessage();
        setTimeout(() => this.testInvitation(), 500);
        setTimeout(() => this.testFriendRequest(), 1000);
        setTimeout(() => this.testAchievement(), 1500);
        setTimeout(() => this.testGameStarted(), 2000);
    }

    private incrementCounter(): void {
        this.testCounter++;
        const counterEl = document.getElementById('test-counter');
        if (counterEl) {
            counterEl.textContent = this.testCounter.toString();
        }
    }

    private remove(): void {
        if (this.container) {
            this.container.remove();
        }
    }
}
