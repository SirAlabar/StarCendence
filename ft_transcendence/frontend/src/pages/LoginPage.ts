import { BaseComponent } from '../components/BaseComponent';
import { LoginService } from '../services/auth/LoginService';
import { OAuthService } from '../services/auth/OAuthService';
import { FormValidator } from '../services/user/FormValidator';

export default class LoginPage extends BaseComponent 
{
    private emailInput: HTMLInputElement | null = null;
    private passwordInput: HTMLInputElement | null = null;
    private usernameInput: HTMLInputElement | null = null;
    private twofaCodeInput: HTMLInputElement | null = null;
    private submitButton: HTMLButtonElement | null = null;
    private messageContainer: HTMLElement | null = null;
    private mode: 'login' | 'set-username' | '2fa-verify' = 'login';
    private tempToken: string = '';

    render(): string 
    {
        this.checkMode();
        
        if (this.mode === 'set-username') 
        {
            return this.renderUsernameSetup();
        }
        
        if (this.mode === '2fa-verify') 
        {
            return this.render2FAVerify();
        }
        
        return this.renderLogin();
    }

    private checkMode(): void
    {
        const params = new URLSearchParams(window.location.search);
        const setupMode = params.get('mode');
        const oauthToken = sessionStorage.getItem('oauth_temp_token');
        const temp2faToken = sessionStorage.getItem('temp_2fa_token');

        if (setupMode === 'setup' && oauthToken) 
        {
            this.mode = 'set-username';
            this.tempToken = oauthToken;
        }
        else if (temp2faToken) 
        {
            this.mode = '2fa-verify';
            this.tempToken = temp2faToken;
        }
        else 
        {
            this.mode = 'login';
            this.tempToken = '';
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

    private render2FAVerify(): string 
    {
        return `
            <div class="max-w-md mx-auto">
                <div class="bg-gray-800/80 backdrop-blur rounded-3xl p-8 border border-gray-600">
                    <div class="text-center mb-8">
                        <h1 class="text-3xl font-bold font-game text-cyan-400 mb-2">Two-Factor Authentication</h1>
                        <p class="text-gray-300">Enter the 6-digit code from your authenticator app</p>
                    </div>
                    
                    <form class="space-y-6" id="2fa-form">
                        <div id="message-container" class="mb-4"></div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-2 text-center">Verification Code</label>
                            <input 
                                type="text" 
                                id="2fa-code-input"
                                name="code"
                                maxlength="6"
                                class="w-full px-4 py-4 bg-gray-700 border border-gray-600 rounded-lg text-white text-center text-2xl font-mono tracking-widest focus:border-cyan-400 focus:outline-none" 
                                placeholder="000000"
                                autocomplete="off"
                                required
                            >
                            <p class="text-gray-400 text-sm mt-2 text-center">Enter the code from your authenticator app</p>
                        </div>
                        
                        <button 
                            type="submit" 
                            id="submit-button"
                            class="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 rounded-lg font-bold hover:scale-105 transition-transform"
                        >
                            Verify & Login
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

    private renderUsernameSetup(): string 
    {
        return `
            <div class="max-w-md mx-auto">
                <div class="bg-gray-800/80 backdrop-blur rounded-3xl p-8 border border-gray-600">
                    <div class="text-center mb-8">
                        <h1 class="text-3xl font-bold font-game text-cyan-400 mb-2">Complete Your Account</h1>
                        <p class="text-gray-300">Choose your username</p>
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
        else if (this.mode === '2fa-verify') 
        {
            this.twofaCodeInput = document.getElementById('2fa-code-input') as HTMLInputElement;
        }
        else 
        {
            this.usernameInput = document.getElementById('username-input') as HTMLInputElement;
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
        else if (this.mode === '2fa-verify') 
        {
            const form = document.getElementById('2fa-form');
            if (form) 
            {
                form.addEventListener('submit', (e) => this.handle2FASubmit(e));
            }

            const backButton = document.getElementById('back-to-login');
            if (backButton) 
            {
                backButton.addEventListener('click', () => {
                    this.backToLogin();
                });
            }

            // Auto-submit when 6 digits entered
            const codeInput = document.getElementById('2fa-code-input') as HTMLInputElement;
            if (codeInput) 
            {
                codeInput.addEventListener('input', (e) => 
                {
                    const value = (e.target as HTMLInputElement).value;
                    // Only allow numbers
                    (e.target as HTMLInputElement).value = value.replace(/[^0-9]/g, '');
                });
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
                backButton.addEventListener('click', () => {
                    this.backToLogin();
                });
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
        sessionStorage.removeItem('temp_2fa_token');
        this.tempToken = '';
        this.mode = 'login';

        if (this.dispose) 
        {
            this.dispose();
        }
        
        this.mount('#auth-content');
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
            const response = await LoginService.login({ email, password });
           
            if (response.type === 'TEMP' && response.tempToken) 
            {
                this.tempToken = response.tempToken;
                this.mode = '2fa-verify';
                sessionStorage.setItem('temp_2fa_token', response.tempToken);
                if (this.dispose) 
                {
                    this.dispose();
                }
                
                this.mount('#auth-content');
                return;
            }

            // Normal login without 2FA
            if (response.accessToken) 
            {
                this.showMessage('Login successful! Redirecting...', 'success');
                
                setTimeout(() => 
                {
                    if (this.dispose) 
                    {
                        this.dispose();
                    }

                    const redirectPath = localStorage.getItem('redirectAfterLogin') || '/profile';
                    localStorage.removeItem('redirectAfterLogin');

                    if ((window as any).navigateTo)
                    {
                        (window as any).navigateTo(redirectPath);
                    }
                    else
                    {
                        window.location.href = redirectPath;
                    }
                }, 1500);
            } 
            else 
            {
                console.error('LoginPage: No tokens received');
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

    private async handle2FASubmit(event: Event): Promise<void> 
    {
        event.preventDefault();
        
        if (!this.twofaCodeInput)
        {
            console.error('LoginPage: 2FA code input not found');
            return;
        }

        const code = this.twofaCodeInput.value.trim();

        if (code.length !== 6) 
        {
            this.showMessage('Please enter a 6-digit code', 'error');
            return;
        }

        if (!this.tempToken) 
        {
            this.showMessage('Session expired. Please login again.', 'error');
            this.backToLogin();
            return;
        }

        if (this.submitButton) 
        {
            this.submitButton.disabled = true;
            this.submitButton.textContent = 'Verifying...';
        }

        try 
        {
            await LoginService.verify2FALogin(this.tempToken, code);

            sessionStorage.removeItem('temp_2fa_token');
            this.tempToken = '';

            this.showMessage('2FA verification successful! Redirecting...', 'success');
            
            setTimeout(() => 
            {
                if (this.dispose) 
                {
                    this.dispose();
                }

                const redirectPath = localStorage.getItem('redirectAfterLogin') || '/profile';
                localStorage.removeItem('redirectAfterLogin');

                if ((window as any).navigateTo)
                {
                    (window as any).navigateTo(redirectPath);
                }
                else
                {
                    window.location.href = redirectPath;
                }
            }, 1500);
        } 
        catch (error: any) 
        {
            console.error('LoginPage: 2FA Error:', error);
            this.showMessage(error.message || 'Invalid code. Please try again.', 'error');
            this.twofaCodeInput.value = '';
            this.twofaCodeInput.focus();
        } 
        finally 
        {
            if (this.submitButton) 
            {
                this.submitButton.disabled = false;
                this.submitButton.textContent = 'Verify & Login';
            }
        }
    }
    
    private async handleUsernameSubmit(event: Event): Promise<void> 
    {
        event.preventDefault();
        
        if (!this.usernameInput) 
        {
            console.error('LoginPage: Username input not found');
            return;
        }

        const username = this.usernameInput.value.trim();

        const usernameError = FormValidator.validateUsername(username);
        if (usernameError) 
        {
            this.showMessage(usernameError, 'error');
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
                username: username
            });

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

    private dispose(): void 
    {
        this.emailInput = null;
        this.passwordInput = null;
        this.usernameInput = null;
        this.twofaCodeInput = null;
        this.submitButton = null;
        this.messageContainer = null;
    }
}