import { BaseComponent } from '../components/BaseComponent';

export default class SettingsPage extends BaseComponent 
{
    render(): string 
    {
        return `
            <div class="container mx-auto px-6 py-8 max-w-4xl">
                <h1 class="text-4xl font-bold font-game text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400 mb-8 text-center">
                    ⚙️ Settings
                </h1>
                
                <div class="space-y-8">
                    <!-- Game Settings -->
                    <div class="bg-gray-800/80 rounded-lg p-6 border border-gray-600">
                        <h2 class="text-2xl font-bold text-orange-400 mb-6">Game Settings</h2>
                        
                        <div class="grid md:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-2">Graphics Quality</label>
                                <select class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-orange-400 focus:outline-none">
                                    <option>Low</option>
                                    <option selected>Medium</option>
                                    <option>High</option>
                                    <option>Ultra</option>
                                </select>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-2">Sound Volume</label>
                                <input type="range" min="0" max="100" value="75" class="w-full">
                                <div class="flex justify-between text-sm text-gray-400 mt-1">
                                    <span>0%</span>
                                    <span>75%</span>
                                    <span>100%</span>
                                </div>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-2">Control Scheme</label>
                                <select class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-orange-400 focus:outline-none">
                                    <option selected>WASD</option>
                                    <option>Arrow Keys</option>
                                    <option>Custom</option>
                                </select>
                            </div>
                            
                            <div class="flex items-center">
                                <input type="checkbox" checked class="mr-3 w-4 h-4 text-orange-400 bg-gray-700 border-gray-600 rounded focus:ring-orange-400">
                                <label class="text-gray-300">Enable particle effects</label>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Account Settings -->
                    <div class="bg-gray-800/80 rounded-lg p-6 border border-gray-600">
                        <h2 class="text-2xl font-bold text-orange-400 mb-6">Account Settings</h2>
                        
                        <div class="space-y-4">
                            <div class="flex items-center justify-between">
                                <div>
                                    <h3 class="text-white font-medium">Two-Factor Authentication</h3>
                                    <p class="text-gray-400 text-sm">Add an extra layer of security</p>
                                </div>
                                <button class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                                    Enable
                                </button>
                            </div>
                            
                            <div class="flex items-center justify-between">
                                <div>
                                    <h3 class="text-white font-medium">Email Notifications</h3>
                                    <p class="text-gray-400 text-sm">Receive game updates and news</p>
                                </div>
                                <input type="checkbox" checked class="w-4 h-4 text-orange-400 bg-gray-700 border-gray-600 rounded">
                            </div>
                            
                            <div class="flex items-center justify-between">
                                <div>
                                    <h3 class="text-white font-medium">Privacy Mode</h3>
                                    <p class="text-gray-400 text-sm">Hide your online status</p>
                                </div>
                                <input type="checkbox" class="w-4 h-4 text-orange-400 bg-gray-700 border-gray-600 rounded">
                            </div>
                        </div>
                    </div>
                    
                    <!-- Danger Zone -->
                    <div class="bg-red-900/20 rounded-lg p-6 border border-red-500/50">
                        <h2 class="text-2xl font-bold text-red-400 mb-6">Danger Zone</h2>
                        
                        <div class="space-y-4">
                            <button class="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700">
                                Reset All Settings
                            </button>
                            <button class="bg-red-800 text-white px-6 py-2 rounded hover:bg-red-900 ml-4">
                                Delete Account
                            </button>
                        </div>
                    </div>
                    
                    <!-- Action Buttons -->
                    <div class="flex justify-center space-x-4">
                        <button class="bg-orange-600 text-white px-8 py-3 rounded-lg hover:bg-orange-700">
                            Save All Changes
                        </button>
                        <button onclick="navigateTo('/dashboard')" class="bg-gray-600 text-white px-8 py-3 rounded-lg hover:bg-gray-700">
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
}