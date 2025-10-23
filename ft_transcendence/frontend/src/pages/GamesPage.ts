import { BaseComponent } from '../components/BaseComponent';

export default class GamesPage extends BaseComponent
{
    render(): string
    {
        return `
            <div class="container mx-auto px-6 py-12 text-center">
                <h1 class="text-5xl font-bold font-game glow-text mb-8">
                    Choose Your Game
                </h1>
                <p class="text-xl text-gray-300 mb-12">
                    Experience epic gaming in stunning 3D environments
                </p>
                
                <div class="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
                    <!-- Pong Game Card -->
                    <div class="game-card pong-card rounded-3xl p-10 border border-gray-600 transition-all group">
                        <div class="aspect-video bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-2xl flex items-center justify-center mb-8">
                            <div class="text-8xl opacity-70 group-hover:scale-110 transition-transform">🏓</div>
                        </div>
                        <h3 class="text-3xl font-bold text-cyan-400 mb-4">3D Pong</h3>
                            <p class="text-gray-300 mb-8 text-lg">
                                Classic Pong reimagined in stunning 3D. Battle friends or AI opponents in real-time multiplayer matches.
                            </p>                        
                        <div class="mt-auto">
                            <button onclick="navigateTo('/pong')" class="neon-button-blue w-full py-4 rounded-lg font-bold transition-all duration-300">
                                Play Pong
                            </button>
                        </div>
                    </div>
                    
                    <!-- Pod Racer Game Card -->
                    <div class="game-card racer-card rounded-3xl p-10 border border-gray-600 transition-all group flex flex-col">
                        <!-- Video Container -->
                        <div class="aspect-video bg-gradient-to-br from-purple-900/60 to-pink-900/70 rounded-2xl overflow-hidden mb-8 relative">
                            <video 
                                class="w-full h-full object-cover rounded-2xl"
                                muted
                                loop
                                autoplay
                                preload="metadata"
                            >
                                <source src="assets/images/demo_racer.mp4" type="video/mp4">
                                <!-- Fallback -->
                                <div class="w-full h-full flex items-center justify-center">
                                    <div class="text-8xl opacity-70">🏎️</div>
                                </div>
                            </video>
                            
                            <!-- Play overlay on hover -->
                            <div class="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <div class="bg-black/50 rounded-full p-3">
                                    <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M8 5v10l8-5-8-5z"/>
                                    </svg>
                                </div>
                            </div>
                        </div>
                        
                        <h3 class="text-3xl font-bold text-purple-400 mb-4">Star Wars Pod Racer</h3>
                        <p class="text-gray-300 mb-8 text-lg">Race through alien worlds at breakneck speeds. Master the art of podracing with realistic physics.</p>
                        <div class="mt-auto">
                            <button onclick="navigateTo('/pod-racer')" class="neon-button-primary w-full py-4 rounded-lg font-bold transition-all duration-300">
                                Start Racing
                            </button>
                        </div>
                    </div>
                </div>

                <style>
                    /* Glowing text effect for the title */
                    .glow-text {
                        background: linear-gradient(45deg, #63eafe, #a855f7);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        -webkit-text-stroke: 1px rgba(0, 0, 0, 0.3);
                        background-clip: text;
                        text-shadow: 0 0 20px #63eafe, 0 0 40px #63eafe, 0 0 60px #63eafe;
                        animation: text-glow 3s ease-in-out infinite alternate;
                    }

                    @keyframes text-glow {
                        0% { text-shadow: 0 0 10px #63eafe, 0 0 20px #63eafe, 0 0 30px #63eafe; }
                        100% { text-shadow: 0 0 15px #a855f7, 0 0 30px #a855f7, 0 0 45px #a855f7; }
                    }

                    /* Cards with neon effects and thematic backgrounds */
                    .game-card {
                        backdrop-filter: blur(10px);
                        position: relative;
                        overflow: hidden;
                    }

                    /* Pong card - dark blue gradient */
                    .pong-card {
                        background: linear-gradient(145deg, 
                            rgba(30, 58, 87, 0.8) 0%, 
                            rgba(17, 24, 39, 0.9) 50%,
                            rgba(15, 23, 42, 0.9) 100%);
                        border-color: rgba(14, 165, 233, 0.4);
                    }

                    .pong-card:hover {
                        border-color: rgba(14, 165, 233, 0.8);
                    }

                    /* Racer card - dark purple gradient */
                    .racer-card {
                        background: linear-gradient(145deg, 
                            rgba(67, 56, 87, 0.8) 0%, 
                            rgba(31, 41, 55, 0.9) 50%,
                            rgba(30, 27, 52, 0.9) 100%);
                        border-color: rgba(168, 85, 247, 0.4);
                    }

                    .racer-card:hover {
                        border-color: rgba(168, 85, 247, 0.8);
                    }

                    .game-card:hover {
                        transform: translateY(-8px) scale(1.02);
                        backdrop-filter: blur(15px);
                    }

                    .pong-card:hover {
                        box-shadow: 
                            0 15px 40px rgba(14, 165, 233, 0.3),
                            0 0 30px rgba(59, 130, 246, 0.2);
                    }

                    .racer-card:hover {
                        box-shadow: 
                            0 15px 40px rgba(168, 85, 247, 0.3),
                            0 0 30px rgba(99, 234, 254, 0.2);
                    }

                    /* Buttons with same effect as Start Racing from PodSelection */
                    .neon-button-primary {
                        background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
                        color: white;
                        border: none;
                        box-shadow: 
                            0 0 20px rgba(168, 85, 247, 0.4),
                            inset 0 1px 0 rgba(255, 255, 255, 0.2);
                    }

                    .neon-button-primary:hover {
                        background: linear-gradient(135deg, #9333ea 0%, #db2777 100%);
                        box-shadow: 
                            0 0 30px rgba(168, 85, 247, 0.6),
                            0 0 50px rgba(236, 72, 153, 0.3),
                            inset 0 1px 0 rgba(255, 255, 255, 0.3);
                        transform: translateY(-2px);
                    }

                    /* Blue button for Pong */
                    .neon-button-blue {
                        background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%);
                        color: white;
                        border: none;
                        box-shadow: 
                            0 0 20px rgba(14, 165, 233, 0.4),
                            inset 0 1px 0 rgba(255, 255, 255, 0.2);
                    }

                    .neon-button-blue:hover {
                        background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%);
                        box-shadow: 
                            0 0 30px rgba(14, 165, 233, 0.6),
                            0 0 50px rgba(59, 130, 246, 0.3),
                            inset 0 1px 0 rgba(255, 255, 255, 0.3);
                        transform: translateY(-2px);
                    }
                </style>
            </div>
        `;
    }
}