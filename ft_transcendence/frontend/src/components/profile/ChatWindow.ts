// ChatModal.ts - Private chat modal component
import { BaseComponent } from '../BaseComponent';
import ChatService from '../../services/chat/ChatService';
import ChatNotificationService from '../../services/chat/ChatNotificationService';
import { webSocketService } from '../../services/websocket/WebSocketService';
import { ChatMessage } from '../../types/chat.types';
import { getBaseUrl } from '@/types/api.types';
import { Modal } from '@/components/common/Modal';

interface ChatModalProps 
{
    friendId: string;
    friendUsername: string;
    friendAvatar: string | null;
    onClose: () => void;
}

export class ChatModal extends BaseComponent 
{
    private props: ChatModalProps;
    private messages: ChatMessage[] = [];
    private isLoading: boolean = true;
    private isSending: boolean = false;
    private currentUserId: string = '';
    private wsMessageHandler: ((data: any) => void) | null = null;
    
    constructor(props: ChatModalProps) 
    {
        super();
        this.props = props;
        
        // Get current user ID from JWT token
        const token = localStorage.getItem('accessToken');
        if (token) 
        {
            try 
            {
                const payload = JSON.parse(atob(token.split('.')[1]));
                this.currentUserId = payload.sub || '';
            } 
            catch (error) 
            {
                this.currentUserId = '';
            }
        }
        else
        {
            this.currentUserId = '';
        }
    }
    
    render(): string 
    {
        const avatarUrl = this.props.friendAvatar ? `${getBaseUrl()}${this.props.friendAvatar}` : null;
        
        return `
            <div class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4" id="chat-modal-overlay">
                <div class="bg-gray-900/95 border-2 border-cyan-500/50 rounded-xl w-full max-w-2xl h-[600px] flex flex-col shadow-[0_0_30px_#00ffff88]">
                    <!-- Chat Header -->
                    ${this.renderHeader(avatarUrl)}
                    
                    <!-- Messages Container -->
                    ${this.renderMessagesContainer()}
                    
                    <!-- Input Area -->
                    ${this.renderInputArea()}
                </div>
            </div>
            
            <style>
                .chat-message-own {
                    background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%);
                    border-radius: 18px 18px 4px 18px;
                    padding: 12px 16px;
                    max-width: 70%;
                    margin-left: auto;
                    box-shadow: 0 2px 8px rgba(6, 182, 212, 0.3);
                }
                
                .chat-message-friend {
                    background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
                    border-radius: 18px 18px 18px 4px;
                    padding: 12px 16px;
                    max-width: 70%;
                    margin-right: auto;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                }
                
                .chat-timestamp {
                    font-size: 11px;
                    color: #9ca3af;
                    margin-top: 4px;
                }
                
                .chat-input {
                    background: rgba(31, 41, 55, 0.5);
                    border: 2px solid #374151;
                    color: white;
                    padding: 12px 16px;
                    border-radius: 12px;
                    resize: none;
                    transition: all 0.3s ease;
                }
                
                .chat-input:focus {
                    outline: none;
                    border-color: #06b6d4;
                    box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.1);
                }
                
                .chat-send-button {
                    background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%);
                    border: none;
                    color: white;
                    padding: 12px 24px;
                    border-radius: 12px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 0 10px rgba(6, 182, 212, 0.5);
                }
                
                .chat-send-button:hover:not(:disabled) {
                    box-shadow: 0 0 20px rgba(6, 182, 212, 0.8);
                    transform: translateY(-2px);
                }
                
                .chat-send-button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                
                .messages-container {
                    scrollbar-width: thin;
                    scrollbar-color: #06b6d4 #1f2937;
                }
                
                .messages-container::-webkit-scrollbar {
                    width: 8px;
                }
                
                .messages-container::-webkit-scrollbar-track {
                    background: #1f2937;
                    border-radius: 4px;
                }
                
                .messages-container::-webkit-scrollbar-thumb {
                    background: #06b6d4;
                    border-radius: 4px;
                }
                
                .messages-container::-webkit-scrollbar-thumb:hover {
                    background: #0ea5e9;
                }
            </style>
        `;
    }
    
    private renderHeader(avatarUrl: string | null): string 
    {
        const avatarContent = avatarUrl
            ? `<img src="${avatarUrl}" alt="${this.props.friendUsername}" class="w-12 h-12 rounded-full object-cover border-2 border-cyan-400">`
            : `<div class="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-xl font-bold text-white border-2 border-cyan-400">
                ${this.props.friendUsername.charAt(0).toUpperCase()}
            </div>`;
        
        return `
            <div class="flex items-center justify-between p-4 border-b border-cyan-500/30">
                <div class="flex items-center gap-3">
                    ${avatarContent}
                    <div>
                        <h3 class="text-xl font-bold text-cyan-400" style="text-shadow: 0 0 10px #00ffff;">
                            ${this.escapeHtml(this.props.friendUsername)}
                        </h3>
                        <p class="text-sm text-gray-400">Private Chat</p>
                    </div>
                </div>
                <button id="close-chat-btn" class="text-gray-400 hover:text-cyan-400 transition-colors p-2">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
        `;
    }

    private renderMessagesContainer(): string 
    {
    
        if (this.isLoading) 
        {
            return `
                <div class="flex-1 flex items-center justify-center">
                    <div class="text-cyan-400 flex flex-col items-center gap-3">
                        <svg class="animate-spin h-10 w-10" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p class="text-sm">Loading messages...</p>
                    </div>
                </div>
            `;
        }
        
        if (this.messages.length === 0) 
        {
            return `
                <div class="flex-1 flex items-center justify-center">
                    <div class="text-center text-gray-400">
                        <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                        </svg>
                        <p class="text-lg mb-2">No messages yet</p>
                        <p class="text-sm">Say hi to ${this.escapeHtml(this.props.friendUsername)}! 👋</p>
                    </div>
                </div>
            `;
        }
        return `
            <div id="messages-container" class="flex-1 overflow-y-auto p-4 space-y-4 messages-container">
                ${this.messages.map(msg => this.renderMessage(msg)).join('')}
            </div>
        `;
    }
    
    private renderMessage(message: ChatMessage): string 
    {
        const isOwn = message.senderId === this.currentUserId;

        const messageClass = isOwn ? 'chat-message-own' : 'chat-message-friend';
        const alignClass = isOwn ? 'flex justify-end' : 'flex justify-start';
        
        const timestamp = message.timestamp ? new Date(message.timestamp) : new Date(message.createdAt);
        const timeString = timestamp.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        return `
            <div class="${alignClass}">
                <div class="${messageClass}">
                    <p class="text-white break-words">${this.escapeHtml(message.content)}</p>
                    <div class="chat-timestamp">${timeString}</div>
                </div>
            </div>
        `;
    }
    
    private renderInputArea(): string 
    {
        return `
            <div class="border-t border-cyan-500/30 p-4">
                <div class="flex gap-3">
                    <textarea
                        id="chat-input"
                        class="chat-input flex-1"
                        placeholder="Type your message..."
                        rows="2"
                        ${this.isSending ? 'disabled' : ''}
                    ></textarea>
                    <button
                        id="send-btn"
                        class="chat-send-button"
                        ${this.isSending ? 'disabled' : ''}
                    >
                        ${this.isSending ? 'Sending...' : 'Send'}
                    </button>
                </div>
                <p class="text-xs text-gray-500 mt-2">Press Enter to send, Shift+Enter for new line</p>
            </div>
        `;
    }
    
    async afterMount(): Promise<void> 
    {
        // Setup UI event listeners
        this.setupEventListeners();
        
        // Load message history
        await this.loadMessages();
        
        // Subscribe to WebSocket messages
        this.subscribeToNewMessages();
        
        // Mark messages as read
        await this.markAsRead();
        
        // Scroll to bottom
        this.scrollToBottom();
    }

    private async loadMessages(): Promise<void> 
    {
        try 
        {
            this.isLoading = true;
            
            const messages = await ChatService.getChatHistory(this.props.friendId);
            this.messages = messages;

            this.isLoading = false;

            this.updateMessagesDisplay();
        } 
        catch (error) 
        {
            this.isLoading = false;
            this.messages = [];
            this.updateMessagesDisplay();
        }
    }
        
    private setupEventListeners(): void 
    {
        // Close button
        const closeBtn = document.getElementById('close-chat-btn');
        if (closeBtn) 
        {
            closeBtn.addEventListener('click', () => this.handleClose());
        }
        
        // Overlay click to close
        const overlay = document.getElementById('chat-modal-overlay');
        if (overlay) 
        {
            overlay.addEventListener('click', (e) => 
            {
                if (e.target === overlay) 
                {
                    this.handleClose();
                }
            });
        }
        
        // Send button
        const sendBtn = document.getElementById('send-btn');
        if (sendBtn) 
        {
            sendBtn.addEventListener('click', () => this.handleSend());
        }
        
        // Input area - Enter key to send
        const input = document.getElementById('chat-input') as HTMLTextAreaElement;
        if (input) 
        {
            input.addEventListener('keydown', (e) => 
            {
                if (e.key === 'Enter' && !e.shiftKey) 
                {
                    e.preventDefault();
                    this.handleSend();
                }
            });
        }
        
        // Escape key to close
        document.addEventListener('keydown', this.handleEscapeKey);
    }
    
    private handleEscapeKey = (e: KeyboardEvent): void => 
    {
        if (e.key === 'Escape') 
        {
            this.handleClose();
        }
    }
    
    private subscribeToNewMessages(): void 
    {
        // Create handler function
        this.wsMessageHandler = (data: any) => 
        {
            try 
            {
                // Extract message data from payload
                const payload = data.payload || data;
                const senderId = payload.senderId || data.senderId;
                const messageText = payload.message || data.message;
                const messageId = payload.messageId || data.messageId;
                const timestamp = payload.timestamp || data.timestamp || Date.now();
                
                // Only add messages from this friend
                if (senderId === this.props.friendId) 
                {
                    const newMessage: ChatMessage = {
                        id: messageId || `ws_${Date.now()}`,
                        senderId: senderId,
                        content: messageText,
                        timestamp: new Date(timestamp),
                        createdAt: new Date(timestamp),
                        isRead: true
                    };
                    
                    this.messages.push(newMessage);
                    this.updateMessagesDisplay();
                    this.scrollToBottom();
                    
                    // Mark as read immediately
                    this.markAsRead();
                }
            } 
            catch (error) 
            {

            }
        };
        
        // Register with WebSocketService
        webSocketService.on('chat:message', this.wsMessageHandler);
    }
    
    private async handleSend(): Promise<void> 
    {
        const input = document.getElementById('chat-input') as HTMLTextAreaElement;
        if (!input) 
        {
            return;
        }
        
        const message = input.value.trim();
        
        if (!message || this.isSending) 
        {
            return;
        }
        
        try 
        {
            this.isSending = true;
            this.updateInputArea();

            // Try WebSocket first (for real-time delivery)
            const wsSent = webSocketService.send('chat:message', {
                targetUserId: this.props.friendId,
                message: message
            });
            
            if (!wsSent) 
            {
                // Fallback to HTTP if WebSocket is not available
                await ChatService.sendMessage(this.props.friendId, message);
            }
            
            // Add to local messages (optimistic update)
            const newMessage: ChatMessage = {
                id: `temp_${Date.now()}`,
                senderId: this.currentUserId,
                content: message,
                timestamp: new Date(),
                createdAt: new Date(),
                isRead: false
            };
            
            this.messages.push(newMessage);
 
            input.value = '';
            this.isSending = false;
            this.updateInputArea();
            this.updateMessagesDisplay();
            this.scrollToBottom();
        } 
        catch (error) 
        {
            this.isSending = false;
            this.updateInputArea();
            await Modal.alert('Error', 'Failed to send message. Please try again.');
        }
    }
    
    private async markAsRead(): Promise<void> 
    {
        try 
        {
            await ChatService.markAsRead(this.props.friendId);
            ChatNotificationService.clearUnread(this.props.friendId);
        } 
        catch (error) 
        {

        }
    }
    
    private updateMessagesDisplay(): void 
    {
        const modal = document.getElementById('chat-modal-overlay');
        if (!modal) 
        {
            return;
        }
        
        const mainContainer = modal.querySelector('.bg-gray-900\\/95');
        if (!mainContainer) 
        {
            return;
        }
        
        // Get all children
        const children = Array.from(mainContainer.children);
        
        if (children.length >= 2) 
        {
            const messagesArea = children[1];
            const newContent = document.createElement('div');
            newContent.className = 'flex-1 overflow-y-auto';
            newContent.innerHTML = this.renderMessagesContainer();
            
            messagesArea.replaceWith(newContent.firstElementChild || newContent);
            
            // Scroll to bottom
            requestAnimationFrame(() => 
            {
                this.scrollToBottom();
            });
        }
    }
    
    private updateInputArea(): void 
    {
        const modal = document.getElementById('chat-modal-overlay');
        if (!modal) 
        {
            return;
        }
        
        const inputArea = modal.querySelector('.border-t');
        if (!inputArea) 
        {
            return;
        }
        
        inputArea.innerHTML = this.renderInputArea().match(/<div class="flex gap-3">[\s\S]*?<\/div>\s*<p class="text-xs[\s\S]*?<\/p>/)?.[0] || '';
        
        // Re-attach event listeners to new elements
        const sendBtn = document.getElementById('send-btn');
        if (sendBtn) 
        {
            sendBtn.addEventListener('click', () => this.handleSend());
        }
        
        const input = document.getElementById('chat-input') as HTMLTextAreaElement;
        if (input) 
        {
            input.addEventListener('keydown', (e) => 
            {
                if (e.key === 'Enter' && !e.shiftKey) 
                {
                    e.preventDefault();
                    this.handleSend();
                }
            });
        }
    }
    
    private scrollToBottom(): void 
    {
        requestAnimationFrame(() => 
        {
            const container = document.getElementById('messages-container');
            if (container) 
            {
                container.scrollTop = container.scrollHeight;
            }
        });
    }
    
    unmount(): void 
    {
        // Remove WebSocket listener
        if (this.wsMessageHandler) 
        {
            webSocketService.off('chat:message', this.wsMessageHandler);
            this.wsMessageHandler = null;
        }
        
        // Remove keyboard listener
        document.removeEventListener('keydown', this.handleEscapeKey);
    }
    
    private handleClose(): void 
    {
        this.unmount();
        this.props.onClose();
    }
    
    private escapeHtml(text: string): string 
    {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}