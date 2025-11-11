import { BaseComponent } from '../../components/BaseComponent';
import { RegisterService } from '../../services/auth/RegisterService';

export default class RegisterPage extends BaseComponent 
{
    private usernameInput: HTMLInputElement | null = null;
    private emailInput: HTMLInputElement | null = null;
    private passwordInput: HTMLInputElement | null = null;
    private confirmPasswordInput: HTMLInputElement | null = null;
    private submitButton: HTMLButtonElement | null = null;
    private messageContainer: HTMLElement | null = null;

    render(): string 
    {
        return `
            <div class="max-w-md mx-auto">
                <div class="bg-gray-800/80 backdrop-blur rounded-3xl p-8 border border-gray-600">
                    <div class="text-center mb-8">
                        <h1 class="text-3xl font-bold font-game text-purple-400 mb-2">Join Transcendence</h1>
                        <p class="text-gray-300">Create your gaming account</p>
                    </div>
                    
                    <form class="space-y-6" id="register-form">
                        <div id="message-container" class="mb-4"></div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-2">Username</label>
                            <input 
                                type="text" 
                                id="username-input"
                                name="username"
                                class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-400 focus:outline-none" 
                                placeholder="Choose a username" 
                                required
                            >
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-2">Email</label>
                            <input 
                                type="email" 
                                id="email-input"
                                name="email"
                                class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-400 focus:outline-none" 
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
                                class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-400 focus:outline-none" 
                                placeholder="••••••••" 
                                required
                            >
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
                            <input 
                                type="password" 
                                id="confirm-password-input"
                                name="confirmPassword"
                                class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-400 focus:outline-none" 
                                placeholder="••••••••" 
                                required
                            >
                        </div>
                        
                        <button 
                            type="submit" 
                            id="submit-button"
                            class="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 rounded-lg font-bold hover:scale-105 transition-transform"
                        >
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

    protected afterMount(): void 
    {
        this.initializeElements();
        this.attachEventListeners();
    }

    private initializeElements(): void 
    {
        this.usernameInput = document.getElementById('username-input') as HTMLInputElement;
        this.emailInput = document.getElementById('email-input') as HTMLInputElement;
        this.passwordInput = document.getElementById('password-input') as HTMLInputElement;
        this.confirmPasswordInput = document.getElementById('confirm-password-input') as HTMLInputElement;
        this.submitButton = document.getElementById('submit-button') as HTMLButtonElement;
        this.messageContainer = document.getElementById('message-container');
    }

    private attachEventListeners(): void 
    {
        const form = document.getElementById('register-form');
        if (form) 
        {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
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

    private validateUsername(username: string): string | null 
    {
        if (!username) 
        {
            return 'Username is required';
        }
        if (username.length < 3) 
        {
            return 'Username must be at least 3 characters';
        }
        if (username.length > 30) 
        {
            return 'Username must be less than 30 characters';
        }
        if (!/^[a-zA-Z0-9._-]+$/.test(username)) 
        {
            return 'Username can only contain letters, numbers, dots, underscores, and hyphens';
        }
        return null;
    }

    private validateEmail(email: string): string | null 
    {
        if (!email) 
        {
            return 'Email is required';
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) 
        {
            return 'Please enter a valid email address';
        }
        return null;
    }

    private validatePassword(password: string): string | null 
    {
        if (!password) 
        {
            return 'Password is required';
        }
        if (password.length < 8) 
        {
            return 'Password must be at least 8 characters';
        }
        
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.])[A-Za-z\d@$!%*?&.]{8,}$/;
        if (!passwordRegex.test(password)) 
        {
            return 'Password must contain uppercase, lowercase, number, and special character';
        }
        return null;
    }

    private async handleSubmit(event: Event): Promise<void> 
    {
        event.preventDefault();
        
        if (!this.usernameInput || !this.emailInput || !this.passwordInput || !this.confirmPasswordInput) 
        {
            return;
        }

        const username = this.usernameInput.value.trim();
        const email = this.emailInput.value.trim();
        const password = this.passwordInput.value;
        const confirmPassword = this.confirmPasswordInput.value;

        // Validate username
        const usernameError = this.validateUsername(username);
        if (usernameError) 
        {
            this.showMessage(usernameError, 'error');
            return;
        }

        // Validate email
        const emailError = this.validateEmail(email);
        if (emailError) 
        {
            this.showMessage(emailError, 'error');
            return;
        }

        // Validate password
        const passwordError = this.validatePassword(password);
        if (passwordError) 
        {
            this.showMessage(passwordError, 'error');
            return;
        }

        // Validate password match
        if (password !== confirmPassword) 
        {
            this.showMessage('Passwords do not match', 'error');
            return;
        }

        if (this.submitButton) 
        {
            this.submitButton.disabled = true;
            this.submitButton.textContent = 'Creating Account...';
        }

        try 
        {
            const response = await RegisterService.register({ username, email, password });
            
            this.showMessage(`${response.message} Redirecting to login...`, 'success');
            
            setTimeout(() => 
            {
                if ((window as any).navigateTo) 
                {
                    (window as any).navigateTo('/login');
                } 
                else 
                {
                    window.location.href = '/login';
                }
            }, 2000);
        } 
        catch (error: any) 
        {
            console.error('Registration error:', error);
            this.showMessage(error.message || 'Network error. Please try again.', 'error');
        } 
        finally 
        {
            if (this.submitButton) 
            {
                this.submitButton.disabled = false;
                this.submitButton.textContent = 'Create Account';
            }
        }
    }
}