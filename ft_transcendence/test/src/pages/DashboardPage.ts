import { BaseComponent } from '../components/BaseComponent';

export default class DashboardPage extends BaseComponent 
{
    render(): string 
    {
        return `
            <div class="container mx-auto px-6 py-8">
                <h1 class="text-4xl font-bold font-game text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-8">
                    Player Dashboard
                </h1>
                
                <div class="grid md:grid-cols-3 gap-6 mb-8">
                    <!-- Stats Card -->
                    <div class="bg-gray-800/80 rounded-lg p-6 border border-gray-600">
                        <h3 class="text-lg font-bold text-cyan-400 mb-4">Your Stats</h3>
                        <div class="space-y-2 text-gray-300">
                            <div class="flex justify-between">
                                <span>Games Played:</span>
                                <span class="text-white">42</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Wins:</span>
                                <span class="text-green-400">28</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Win Rate:</span>
                                <span class="text-yellow-400">66.7%</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Recent Games -->
                    <div class="bg-gray-800/80 rounded-lg p-6 border border-gray-600">
                        <h3 class="text-lg font-bold text-purple-400 mb-4">Recent Games</h3>
                        <div class="space-y-2 text-gray-300">
                            <div class="flex justify-between">
                                <span>Pong vs AI</span>
                                <span class="text-green-400">Win</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Pod Racer</span>
                                <span class="text-red-400">Loss</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Tournament</span>
                                <span class="text-yellow-400">2nd</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Quick Actions -->
                    <div class="bg-gray-800/80 rounded-lg p-6 border border-gray-600">
                        <h3 class="text-lg font-bold text-green-400 mb-4">Quick Actions</h3>
                        <div class="space-y-3">
                            <button onclick="navigateTo('/games')" class="w-full bg-cyan-600 text-white py-2 rounded hover:bg-cyan-700">
                                Play Games
                            </button>
                            <button onclick="navigateTo('/tournament')" class="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700">
                                Join Tournament
                            </button>
                            <button onclick="navigateTo('/profile')" class="w-full bg-gray-600 text-white py-2 rounded hover:bg-gray-700">
                                Edit Profile
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="text-center">
                    <button onclick="navigateTo('/')" class="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700">
                        Back to Home
                    </button>
                </div>
            </div>
        `;
    }
}