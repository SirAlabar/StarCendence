import { BaseComponent } from '../../components/BaseComponent';

export interface PaddleSkin 
{
    id: string;
    name: string;
    gradient: string;
}

export const AVAILABLE_PADDLES: PaddleSkin[] = [
    { id: 'default', name: 'Default', gradient: 'from-cyan-500 to-blue-600' },
    { id: 'neon', name: 'Neon', gradient: 'from-pink-500 to-purple-600' },
    { id: 'fire', name: 'Fire', gradient: 'from-red-500 to-orange-600' },
    { id: 'ice', name: 'Ice', gradient: 'from-blue-300 to-cyan-400' },
    { id: 'rainbow', name: 'Rainbow', gradient: 'from-red-500 via-yellow-500 to-blue-500' },
    { id: 'matrix', name: 'Matrix', gradient: 'from-green-500 to-green-700' },
    { id: 'gold', name: 'Gold', gradient: 'from-yellow-400 to-yellow-600' },
    { id: 'shadow', name: 'Shadow', gradient: 'from-gray-700 to-gray-900' }
];

export class PaddleSkinSelection extends BaseComponent 
{
    private onSelect: (skin: PaddleSkin) => void;
    private selectedSkin: PaddleSkin | null = null;
    
    constructor(onSelect: (skin: PaddleSkin) => void) 
    {
        super();
        this.onSelect = onSelect;
        this.selectedSkin = AVAILABLE_PADDLES[0];
    }
    
    render(): string 
    {
        return `
            <div class="p-6 bg-gradient-to-br from-gray-900 to-blue-900/40 rounded-2xl">
                <h2 class="text-3xl font-bold text-cyan-300 mb-6 text-center glow-text-cyan">
                    SELECT YOUR PADDLE
                </h2>
                
                <p class="text-gray-400 text-center mb-8">
                    Choose your paddle skin for the match
                </p>
                
                <div class="grid grid-cols-4 gap-4 mb-6">
                    ${AVAILABLE_PADDLES.map(paddle => `
                        <div class="paddle-card rounded-lg p-6 border-2 border-cyan-500/40 bg-gray-800/60 cursor-pointer hover:border-cyan-500 hover:scale-105 transition-all ${this.selectedSkin?.id === paddle.id ? 'border-cyan-500 scale-105' : ''}" data-paddle-id="${paddle.id}">
                            <div class="w-full h-32 bg-gradient-to-b ${paddle.gradient} rounded-lg mb-3 shadow-lg"></div>
                            <h3 class="text-center font-bold text-cyan-400 text-sm">${paddle.name}</h3>
                        </div>
                    `).join('')}
                </div>
                
                <button id="confirmPaddleBtn" class="w-full py-4 px-6 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xl transition-all shadow-xl shadow-cyan-500/50">
                    CONFIRM SELECTION
                </button>
                
                <style>
                    .glow-text-cyan 
                    {
                        text-shadow: 0 0 20px rgba(34, 211, 238, 0.8), 0 0 40px rgba(34, 211, 238, 0.4);
                    }
                    
                    .paddle-card.selected 
                    {
                        border-color: #22d3ee;
                        transform: scale(1.05);
                        box-shadow: 0 0 30px rgba(34, 211, 238, 0.5);
                    }
                </style>
            </div>
        `;
    }
    
    mount(): void 
    {
        this.attachEventListeners();
    }
    
    private attachEventListeners(): void 
    {
        // Paddle selection
        document.querySelectorAll('.paddle-card').forEach(card => 
        {
            card.addEventListener('click', (e) => 
            {
                const paddleId = (e.currentTarget as HTMLElement).getAttribute('data-paddle-id');
                const paddle = AVAILABLE_PADDLES.find(p => p.id === paddleId);
                
                if (paddle) 
                {
                    this.selectedSkin = paddle;
                    
                    // Update visual selection
                    document.querySelectorAll('.paddle-card').forEach(c => c.classList.remove('selected'));
                    (e.currentTarget as HTMLElement).classList.add('selected');
                }
            });
        });
        
        // Confirm button
        const confirmBtn = document.getElementById('confirmPaddleBtn');
        if (confirmBtn) 
        {
            confirmBtn.addEventListener('click', () => 
            {
                if (this.selectedSkin) 
                {
                    this.onSelect(this.selectedSkin);
                }
            });
        }
    }
    
    public getSelectedSkin(): PaddleSkin | null 
    {
        return this.selectedSkin;
    }
    
    public dispose(): void 
    {
        // Cleanup
    }
}