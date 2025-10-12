import { BaseComponent } from '../components/BaseComponent';

export default class LoginPage extends BaseComponent 
{
    private emailInput: HTMLInputElement | null = null;
    private passwordInput: HTMLInputElement | null = null;
    private submitButton: HTMLButtonElement | null = null;
    private messageContainer: HTMLElement | null = null;

    render(): string 
    {
        return `
            <div class="max-w-md mx-auto">
                <div class="bg-gray-800/80 backdrop-blur rounded-3xl p-8 border border-gray-600">
                    <div class="text-center mb-8">
                        <h1 class="text-3xl font-bold font-game text-cyan-400 mb-2">Welcome Back</h1>
                        <p class="text-gray-300">Sign in to your account</p>
                    </div>
                    
                    <form class="space-y-6" id="login-form">
                        <div id="message-container" class="mb-4"></div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-2">Email</label>
                            <input 
                                type="email" 
                                id="email-input"
                                name="email"
                                class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-cyan-400 focus:outline-none" 
                                placeholder="your@email.com" 
                                required
                            >
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-2">Password</label>
                            <input 
                                type="password" 
                                id="password-input"
                                name="password"
                                class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-cyan-400 focus:outline-none" 
                                placeholder="••••••••" 
                                required
                            >
                        </div>
                        
                        <button 
                            type="submit" 
                            id="submit-button"
                            class="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 rounded-lg font-bold hover:scale-105 transition-transform"
                        >
                            Sign In
                        </button>
                    </form>
                    
                    <div class="mt-6 text-center">
                        <p class="text-gray-400">Don't have an account?</p>
                        <button onclick="navigateTo('/register')" class="text-cyan-400 hover:text-cyan-300 font-medium">
                            Create one here
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

    protected afterMount(): void 
    {
        console.log('🔥 LoginPage: afterMount called');
        this.initializeElements();
        this.attachEventListeners();
    }

    private initializeElements(): void 
    {
        this.emailInput = document.getElementById('email-input') as HTMLInputElement;
        this.passwordInput = document.getElementById('password-input') as HTMLInputElement;
        this.submitButton = document.getElementById('submit-button') as HTMLButtonElement;
        this.messageContainer = document.getElementById('message-container');
        console.log('🔥 LoginPage: Elements initialized');
    }

    private attachEventListeners(): void 
    {
        const form = document.getElementById('login-form');
        if (form) 
        {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
            console.log('🔥 LoginPage: Event listener attached');
        }
    }

    private showMessage(message: string, type: 'success' | 'error'): void 
    {
        if (!this.messageContainer) 
        {
            return;
        }
        
        const bgColor = type === 'success' ? 'bg-green-500/20 border-green-500' : 'bg-red-500/20 border-red-500';
        const textColor = type === 'success' ? 'text-green-300' : 'text-red-300';
        
        this.messageContainer.innerHTML = `
            <div class="${bgColor} border rounded-lg p-3 mb-4">
                <p class="${textColor} text-sm">${message}</p>
            </div>
        `;
    }

    private async handleSubmit(event: Event): Promise<void> 
    {
        console.log('🔥 LoginPage: handleSubmit called');
        event.preventDefault();
        
        if (!this.emailInput || !this.passwordInput) 
        {
            console.error('🔥 LoginPage: Inputs not found');
            return;
        }

        const email = this.emailInput.value.trim();
        const password = this.passwordInput.value;

        if (!email || !password) 
        {
            this.showMessage('Please fill in all fields', 'error');
            return;
        }

        if (this.submitButton) 
        {
            this.submitButton.disabled = true;
            this.submitButton.textContent = 'Signing In...';
        }

        try 
        {
            console.log('🔥 LoginPage: Sending login request...');
            const response = await fetch('http://localhost:3001/login', 
            {
                method: 'POST',
                headers: 
                { 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            console.log('🔥 LoginPage: Response received:', data);
            
            // FIX: Handle the nested token structure
            const tokenData = data.token || data;
            console.log('🔥 Access Token Detected:', tokenData.accessToken);
            
            if (response.ok && tokenData.accessToken)
            {
                console.log('🔥 LoginPage: Login successful!');
                localStorage.setItem('access_token', tokenData.accessToken);
                console.log('🔥 LoginPage: Token saved:', localStorage.getItem('access_token'));
                
                if (tokenData.refreshToken) 
                {
                    localStorage.setItem('refresh_token', tokenData.refreshToken);
                }
                
                this.showMessage('Login successful! Redirecting...', 'success');
                
                setTimeout(() => 
                {
                    console.log('🔥 LoginPage: REDIRECTING NOW!');
                    
                    if ((window as any).navigateTo) 
                    {
                        (window as any).navigateTo('/profile');
                    } 
                    else 
                    {
                        window.location.href = '/profile';
                    }
                }, 1500);
            } 
            else 
            {
                console.error('🔥 LoginPage: Login failed:', data);
                this.showMessage(data.message || 'Login failed', 'error');
            }
        } 
        catch (error) 
        {
            console.error('🔥 LoginPage: Error:', error);
            this.showMessage('Network error. Please try again.', 'error');
        } 
        finally 
        {
            if (this.submitButton) 
            {
                this.submitButton.disabled = false;
                this.submitButton.textContent = 'Sign In';
            }
        }
    }
}