import { BaseComponent } from '../components/BaseComponent';
import { LoginService } from '../services/LoginService';
import { OAuthService } from '../services/OAuthService';
import { FormValidator } from '../services/FormValidator';

export default class LoginPage extends BaseComponent 
{
    private emailInput: HTMLInputElement | null = null;
    private passwordInput: HTMLInputElement | null = null;
    private usernameInput: HTMLInputElement | null = null;
    private confirmPasswordInput: HTMLInputElement | null = null;
    private submitButton: HTMLButtonElement | null = null;
    private messageContainer: HTMLElement | null = null;
    private mode: 'login' | 'set-username' = 'login';
    private tempToken: string = '';

    render(): string 
    {
        this.checkMode();
        
        if (this.mode === 'set-username') 
        {
            return this.renderUsernameSetup();
        }
        return this.renderLogin();
    }

    private checkMode(): void 
    {
        const params = new URLSearchParams(window.location.search);
        const setupMode = params.get('mode');
        
        // Check for temp token in sessionStorage
        const token = sessionStorage.getItem('oauth_temp_token');

        if (setupMode === 'setup' && token) 
        {
            this.mode = 'set-username';
            this.tempToken = token;
        }
    }

    private renderLogin(): string 
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
                    
                    <div class="my-6 flex items-center">
                        <div class="flex-1 border-t border-gray-600"></div>
                        <span class="px-4 text-gray-400 text-sm">OR</span>
                        <div class="flex-1 border-t border-gray-600"></div>
                    </div>
                    
                    <button 
                        id="google-oauth-button"
                        class="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-gray-800 py-3 rounded-lg font-bold hover:scale-105 transition-transform flex items-center justify-center gap-3"
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19.9895 10.1871C19.9895 9.36767 19.9214 8.76973 19.7742 8.14966H10.1992V11.848H15.8195C15.7062 12.7671 15.0943 14.1512 13.7346 15.0813L13.7155 15.2051L16.7429 17.4969L16.9527 17.5174C18.879 15.7789 19.9895 13.221 19.9895 10.1871Z" fill="#4285F4"/>
                            <path d="M10.1993 19.9313C12.9527 19.9313 15.2643 19.0454 16.9527 17.5174L13.7346 15.0813C12.8734 15.6682 11.7176 16.0779 10.1993 16.0779C7.50243 16.0779 5.21352 14.3395 4.39759 11.9366L4.27799 11.9466L1.13003 14.3273L1.08887 14.4391C2.76588 17.6945 6.21061 19.9313 10.1993 19.9313Z" fill="#34A853"/>
                            <path d="M4.39748 11.9366C4.18219 11.3166 4.05759 10.6521 4.05759 9.96565C4.05759 9.27909 4.18219 8.61473 4.38615 7.99466L4.38045 7.8626L1.19304 5.44366L1.08875 5.49214C0.397576 6.84305 0.000976562 8.36008 0.000976562 9.96565C0.000976562 11.5712 0.397576 13.0882 1.08875 14.4391L4.39748 11.9366Z" fill="#FBBC05"/>
                            <path d="M10.1993 3.85336C12.1142 3.85336 13.406 4.66168 14.1425 5.33718L17.0207 2.59107C15.253 0.985496 12.9527 0 10.1993 0C6.2106 0 2.76588 2.23672 1.08887 5.49214L4.38626 7.99466C5.21352 5.59183 7.50242 3.85336 10.1993 3.85336Z" fill="#EB4335"/>
                        </svg>
                        Continue with Google
                    </button>
                    
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

    private renderUsernameSetup(): string 
    {
        return `
            <div class="max-w-md mx-auto">
                <div class="bg-gray-800/80 backdrop-blur rounded-3xl p-8 border border-gray-600">
                    <div class="text-center mb-8">
                        <h1 class="text-3xl font-bold font-game text-cyan-400 mb-2">Complete Your Account</h1>
                        <p class="text-gray-300">Set your username and password</p>
                    </div>
                    
                    <form class="space-y-6" id="username-form">
                        <div id="message-container" class="mb-4"></div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-2">Username</label>
                            <input 
                                type="text" 
                                id="username-input"
                                name="username"
                                class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-cyan-400 focus:outline-none" 
                                placeholder="Choose a username" 
                                minlength="3"
                                maxlength="30"
                                required
                            >
                            <p class="text-gray-400 text-sm mt-2">3-30 characters, letters, numbers, dots, underscores, hyphens</p>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-2">Password</label>
                            <input 
                                type="password" 
                                id="password-input"
                                name="password"
                                class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-cyan-400 focus:outline-none" 
                                placeholder="••••••••"
                                minlength="8"
                                required
                            >
                            <p class="text-gray-400 text-sm mt-2">You can login with Google or email/password</p>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
                            <input 
                                type="password" 
                                id="confirm-password-input"
                                name="confirmPassword"
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
                            Complete Setup
                        </button>
                    </form>
                    
                    <div class="mt-8 text-center">
                        <button id="back-to-login" class="text-gray-400 hover:text-white">
                            ← Back to Login
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
        if (this.mode === 'login') 
        {
            this.emailInput = document.getElementById('email-input') as HTMLInputElement;
            this.passwordInput = document.getElementById('password-input') as HTMLInputElement;
        } 
        else 
        {
            this.usernameInput = document.getElementById('username-input') as HTMLInputElement;
            this.passwordInput = document.getElementById('password-input') as HTMLInputElement;
            this.confirmPasswordInput = document.getElementById('confirm-password-input') as HTMLInputElement;
        }
        
        this.submitButton = document.getElementById('submit-button') as HTMLButtonElement;
        this.messageContainer = document.getElementById('message-container');
    }

    private attachEventListeners(): void 
    {
        if (this.mode === 'login') 
        {
            const form = document.getElementById('login-form');
            if (form) 
            {
                form.addEventListener('submit', (e) => this.handleSubmit(e));
            }

            const googleButton = document.getElementById('google-oauth-button');
            if (googleButton) 
            {
                googleButton.addEventListener('click', () => this.handleGoogleLogin());
            }
        } 
        else 
        {
            const form = document.getElementById('username-form');
            if (form) 
            {
                form.addEventListener('submit', (e) => this.handleUsernameSubmit(e));
            }

            const backButton = document.getElementById('back-to-login');
            if (backButton) 
            {
                backButton.addEventListener('click', () => this.backToLogin());
            }
        }
    }

    private handleGoogleLogin(): void 
    {
        OAuthService.initiateGoogleLogin();
    }

    private backToLogin(): void 
    {
        // Clear temp token
        sessionStorage.removeItem('oauth_temp_token');
        
        if ((window as any).navigateTo) 
        {
            (window as any).navigateTo('/login');
        } 
        else 
        {
            window.location.href = '/login';
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
        event.preventDefault();
        
        if (!this.emailInput || !this.passwordInput) 
        {
            console.error('LoginPage: Inputs not found');
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
            await LoginService.login({ email, password });
            
            if (LoginService.isAuthenticated()) 
            {
                this.showMessage('Login successful! Redirecting...', 'success');
                
                setTimeout(() => 
                {
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
                console.error('LoginPage: Login failed');
                this.showMessage('Login failed. Please try again.', 'error');
            }
        } 
        catch (error: any) 
        {
            console.error('LoginPage: Error:', error);
            this.showMessage(error.message || 'Network error. Please try again.', 'error');
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

    private async handleUsernameSubmit(event: Event): Promise<void> 
    {
        event.preventDefault();
        
        if (!this.usernameInput || !this.passwordInput || !this.confirmPasswordInput) 
        {
            console.error('LoginPage: Input fields not found');
            return;
        }

        const username = this.usernameInput.value.trim();
        const password = this.passwordInput.value;
        const confirmPassword = this.confirmPasswordInput.value;

        // Validate username using FormValidator
        const usernameError = FormValidator.validateUsername(username);
        if (usernameError) 
        {
            this.showMessage(usernameError, 'error');
            return;
        }

        // Validate password
        const passwordError = FormValidator.validatePassword(password);
        if (passwordError) 
        {
            this.showMessage(passwordError, 'error');
            return;
        }

        const passwordMatchError = FormValidator.validatePasswordConfirm(password, confirmPassword);
        if (passwordMatchError) 
        {
            this.showMessage(passwordMatchError, 'error');
            return;
        }

        if (this.submitButton) 
        {
            this.submitButton.disabled = true;
            this.submitButton.textContent = 'Creating Account...';
        }

        try 
        {
            await OAuthService.setUsername(
            {
                tempToken: this.tempToken,
                username: username,
                password: password
            });

            // Clear the temp token after successful setup
            sessionStorage.removeItem('oauth_temp_token');

            this.showMessage('Account created successfully! Redirecting...', 'success');
            
            setTimeout(() => 
            {
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
        catch (error: any) 
        {
            console.error('LoginPage: Error:', error);
            this.showMessage(error.message || 'Failed to create account. Please try again.', 'error');
        } 
        finally 
        {
            if (this.submitButton) 
            {
                this.submitButton.disabled = false;
                this.submitButton.textContent = 'Complete Setup';
            }
        }
    }
}