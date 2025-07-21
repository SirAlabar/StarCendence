import { BaseComponent } from '../components/BaseComponent';

export default class RegisterPage extends BaseComponent 
{
    render(): string 
    {
        return `
            <div class="max-w-md mx-auto">
                <div class="bg-gray-800/80 backdrop-blur rounded-3xl p-8 border border-gray-600">
                    <div class="text-center mb-8">
                        <h1 class="text-3xl font-bold font-game text-purple-400 mb-2">Join Transcendence</h1>
                        <p class="text-gray-300">Create your gaming account</p>
                    </div>
                    
                    <form class="space-y-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-2">Username</label>
                            <input type="text" class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-400 focus:outline-none" placeholder="Choose a username">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-2">Email</label>
                            <input type="email" class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-400 focus:outline-none" placeholder="your@email.com">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-2">Password</label>
                            <input type="password" class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-400 focus:outline-none" placeholder="••••••••">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
                            <input type="password" class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-400 focus:outline-none" placeholder="••••••••">
                        </div>
                        
                        <button type="submit" class="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 rounded-lg font-bold hover:scale-105 transition-transform">
                            Create Account
                        </button>
                    </form>
                    
                    <div class="mt-6 text-center">
                        <p class="text-gray-400">Already have an account?</p>
                        <button onclick="navigateTo('/login')" class="text-purple-400 hover:text-purple-300 font-medium">
                            Sign in here
                        </button>
                    </div>
                    
                    <div class="mt-8 text-center">
                        <button onclick="navigateTo('/')" class="text-gray-400 hover:text-white">
                            ← Back to Home
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
}