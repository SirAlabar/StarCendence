import { webSocketService } from './WebSocketService';
import { Lobby, LobbyPlayer, LobbyInvitation, LobbySettings } from '../../types/lobby.types';
import UserService from '../user/UserService';
import { AVAILABLE_PODS } from '../../game/utils/PodConfig';

/**
 * Lobby Service
 * Business logic for lobby operations
 */
class LobbyService 
{
    private currentLobby: Lobby | null = null;
    private pendingInvitations: LobbyInvitation[] = [];
    private lobbyUpdateCallback: ((lobby: Lobby) => void) | null = null;
    
    async createLobby(gameType: 'pong' | 'podracer', maxPlayers: number = 4): Promise<Lobby> 
    {
        console.log('[LobbyService] 🎮 Creating lobby', { gameType, maxPlayers });
        
        try 
        {
            if (!webSocketService.isConnected()) 
            {
                await webSocketService.connect();
            }
            
            const currentUser = await UserService.getProfile();
            const lobbyId = await webSocketService.createLobby(gameType, maxPlayers);
            
            const settings: LobbySettings = {
                maxScore: gameType === 'pong' ? 5 : undefined,
                allowAI: true,
                allowSpectators: false,
                isPrivate: false
            };
            
            const lobby: Lobby = {
                id: lobbyId,
                gameType,
                hostId: currentUser.id,
                hostUsername: currentUser.username,
                players: [
                    {
                        id: '0',
                        userId: currentUser.id,
                        username: currentUser.username,
                        avatarUrl: currentUser.avatarUrl || '/assets/images/default-avatar.jpeg',
                        isOnline: true,
                        isReady: false,
                        isHost: true,
                        isAI: false,
                        customization: gameType === 'podracer' ? AVAILABLE_PODS[0] : null,
                        joinedAt: new Date()
                    }
                ],
                maxPlayers,
                status: 'waiting',
                settings,
                createdAt: new Date()
            };
            
            this.currentLobby = lobby;
            this.subscribeToLobbyUpdates(lobbyId);
            
            console.log('[LobbyService] ✅ Lobby created:', lobbyId);
            return lobby;
        }
        catch (error) 
        {
            console.error('[LobbyService] ❌ Failed to create lobby:', error);
            throw error;
        }
    }
    
    async joinLobby(lobbyId: string): Promise<Lobby> 
    {
        console.log('[LobbyService] 🚪 Joining lobby:', lobbyId);
        
        try 
        {
            if (!webSocketService.isConnected()) 
            {
                await webSocketService.connect();
            }
            
            await webSocketService.joinLobby(lobbyId);
            this.subscribeToLobbyUpdates(lobbyId);
            
            console.log('[LobbyService] ✅ Joined lobby');
            
            if (!this.currentLobby) 
            {
                throw new Error('Lobby not found');
            }
            
            return this.currentLobby;
        }
        catch (error) 
        {
            console.error('[LobbyService] ❌ Failed to join lobby:', error);
            throw error;
        }
    }
    
    async leaveLobby(): Promise<void> 
    {
        if (!this.currentLobby) 
        {
            console.log('[LobbyService] ⚠️ No active lobby');
            return;
        }
        
        const lobbyId = this.currentLobby.id;
        console.log('[LobbyService] 🚪 Leaving lobby:', lobbyId);
        
        try 
        {
            await webSocketService.leaveLobby(lobbyId);
            webSocketService.unsubscribeLobby(lobbyId);
            
            this.currentLobby = null;
            this.lobbyUpdateCallback = null;
            
            console.log('[LobbyService] ✅ Left lobby');
        }
        catch (error) 
        {
            console.error('[LobbyService] ❌ Failed to leave lobby:', error);
            throw error;
        }
    }
    
    async invitePlayer(friendUserId: string, friendUsername: string): Promise<void> 
    {
        if (!this.currentLobby) 
        {
            throw new Error('No active lobby');
        }
        
        console.log('[LobbyService] 📨 Inviting player:', { friendUserId, friendUsername });
        
        try 
        {
            await webSocketService.sendInvitation(this.currentLobby.id, friendUserId);
            console.log('[LobbyService] ✅ Invitation sent');
        }
        catch (error) 
        {
            console.error('[LobbyService] ❌ Failed to send invitation:', error);
            throw error;
        }
    }
    
    async acceptInvitation(invitationId: string): Promise<void> 
    {
        console.log('[LobbyService] ✅ Accepting invitation:', invitationId);
        
        try 
        {
            await webSocketService.acceptInvitation(invitationId);
            this.pendingInvitations = this.pendingInvitations.filter(
                inv => inv.id !== invitationId
            );
            console.log('[LobbyService] ✅ Invitation accepted');
        }
        catch (error) 
        {
            console.error('[LobbyService] ❌ Failed to accept invitation:', error);
            throw error;
        }
    }
    
    async declineInvitation(invitationId: string): Promise<void> 
    {
        console.log('[LobbyService] ❌ Declining invitation:', invitationId);
        
        try 
        {
            await webSocketService.declineInvitation(invitationId);
            this.pendingInvitations = this.pendingInvitations.filter(
                inv => inv.id !== invitationId
            );
            console.log('[LobbyService] ✅ Invitation declined');
        }
        catch (error) 
        {
            console.error('[LobbyService] ❌ Failed to decline invitation:', error);
            throw error;
        }
    }
    
    async updateReadyStatus(isReady: boolean): Promise<void> 
    {
        if (!this.currentLobby) 
        {
            throw new Error('No active lobby');
        }
        
        console.log('[LobbyService] 🎯 Updating ready status:', isReady);
        
        try 
        {
            await webSocketService.updateReadyStatus(this.currentLobby.id, isReady);
            console.log('[LobbyService] ✅ Ready status updated');
        }
        catch (error) 
        {
            console.error('[LobbyService] ❌ Failed to update ready status:', error);
            throw error;
        }
    }
    
    async updateCustomization(customization: any): Promise<void> 
    {
        if (!this.currentLobby) 
        {
            throw new Error('No active lobby');
        }
        
        console.log('[LobbyService] 🎨 Updating customization');
        
        try 
        {
            await webSocketService.updateCustomization(this.currentLobby.id, customization);
            console.log('[LobbyService] ✅ Customization updated');
        }
        catch (error) 
        {
            console.error('[LobbyService] ❌ Failed to update customization:', error);
            throw error;
        }
    }
    
    async sendChatMessage(message: string): Promise<void> 
    {
        if (!this.currentLobby) 
        {
            throw new Error('No active lobby');
        }
        
        console.log('[LobbyService] 💬 Sending chat message');
        
        try 
        {
            await webSocketService.sendChatMessage(this.currentLobby.id, message);
            console.log('[LobbyService] ✅ Chat message sent');
        }
        catch (error) 
        {
            console.error('[LobbyService] ❌ Failed to send message:', error);
            throw error;
        }
    }
    
    private subscribeToLobbyUpdates(lobbyId: string): void 
    {
        console.log('[LobbyService] 👂 Subscribing to updates:', lobbyId);
        
        webSocketService.onLobbyUpdate(lobbyId, (updatedLobby: Lobby) => 
        {
            console.log('[LobbyService] 🔄 Lobby updated');
            this.currentLobby = updatedLobby;
            
            if (this.lobbyUpdateCallback) 
            {
                this.lobbyUpdateCallback(updatedLobby);
            }
        });
        
        webSocketService.onPlayerJoin(lobbyId, (player: LobbyPlayer) => 
        {
            console.log('[LobbyService] 👤 Player joined:', player);
            
            if (this.currentLobby) 
            {
                this.currentLobby.players.push(player);
                
                if (this.lobbyUpdateCallback) 
                {
                    this.lobbyUpdateCallback(this.currentLobby);
                }
            }
        });
        
        webSocketService.onPlayerLeave(lobbyId, (playerId: string) => 
        {
            console.log('[LobbyService] 👤 Player left:', playerId);
            
            if (this.currentLobby) 
            {
                this.currentLobby.players = this.currentLobby.players.filter(
                    p => p.userId !== playerId
                );
                
                if (this.lobbyUpdateCallback) 
                {
                    this.lobbyUpdateCallback(this.currentLobby);
                }
            }
        });
    }
    
    onLobbyUpdate(callback: (lobby: Lobby) => void): void 
    {
        this.lobbyUpdateCallback = callback;
    }
    
    getCurrentLobby(): Lobby | null 
    {
        return this.currentLobby;
    }
    
    getPendingInvitations(): LobbyInvitation[] 
    {
        return this.pendingInvitations;
    }
    
    addPendingInvitation(invitation: LobbyInvitation): void 
    {
        this.pendingInvitations.push(invitation);
    }
    
    canStartGame(): boolean 
    {
        if (!this.currentLobby) 
        {
            return false;
        }
        
        if (this.currentLobby.players.length < 2) 
        {
            return false;
        }
        
        const nonHostPlayers = this.currentLobby.players.filter(p => !p.isHost);
        const allReady = nonHostPlayers.every(p => p.isReady || p.isAI);
        
        return allReady;
    }
}

export default new LobbyService();