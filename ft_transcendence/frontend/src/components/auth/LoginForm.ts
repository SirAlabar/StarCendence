export class LoginForm 
{
    private container: HTMLElement;
    private form: HTMLFormElement | null = null;
    private emailInput: HTMLInputElement | null = null;
    private passwordInput: HTMLInputElement | null = null;
    private submitButton: HTMLButtonElement | null = null;
    private messageContainer: HTMLDivElement | null = null;

    constructor(container: HTMLElement) 
    {
        this.container = container;
        this.render();
        this.initializeElements();
        this.attachEventListeners();
    }

    private render(): void 
    {
        this.container.innerHTML = `
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
        `;
    }

    private initializeElements(): void 
    {
        this.form = this.container.querySelector('#login-form') as HTMLFormElement;
        this.emailInput = this.container.querySelector('#email-input') as HTMLInputElement;
        this.passwordInput = this.container.querySelector('#password-input') as HTMLInputElement;
        this.submitButton = this.container.querySelector('#submit-button') as HTMLButtonElement;
        this.messageContainer = this.container.querySelector('#message-container') as HTMLDivElement;
    }

    private attachEventListeners(): void 
    {
        if (this.form) 
        {
            this.form.addEventListener('submit', this.handleSubmit.bind(this));
        }

        if (this.passwordInput) 
        {
            this.passwordInput.addEventListener('keypress', (event) => 
            {
                if (event.key === 'Enter') 
                {
                    this.handleSubmit(event);
                }
            });
        }
    }

    private validateInputs(): boolean 
    {
        if (!this.emailInput || !this.passwordInput) 
        {
            this.showMessage('Form elements not found', 'error');
            return false;
        }

        const email = this.emailInput.value.trim();
        const password = this.passwordInput.value;

        if (!email) 
        {
            this.showMessage('Email is required', 'error');
            return false;
        }

        if (!password) 
        {
            this.showMessage('Password is required', 'error');
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) 
        {
            this.showMessage('Please enter a valid email address', 'error');
            return false;
        }

        return true;
    }

    private showMessage(message: string, type: 'success' | 'error'): void 
    {
        if (!this.messageContainer) return;
        
        const bgColor = type === 'success' ? 'bg-green-500/20 border-green-500' : 'bg-red-500/20 border-red-500';
        const textColor = type === 'success' ? 'text-green-300' : 'text-red-300';
        
        this.messageContainer.innerHTML = `
            <div class="${bgColor} border rounded-lg p-3 mb-4">
                <p class="${textColor} text-sm">${message}</p>
            </div>
        `;
    }

    private clearMessages(): void 
    {
        if (this.messageContainer) 
        {
            this.messageContainer.innerHTML = '';
        }
    }

    private setLoading(loading: boolean): void 
    {
        if (this.submitButton) 
        {
            this.submitButton.disabled = loading;
            this.submitButton.textContent = loading ? 'Signing In...' : 'Sign In';
        }

        if (this.emailInput) this.emailInput.disabled = loading;
        if (this.passwordInput) this.passwordInput.disabled = loading;
    }

    private async handleSubmit(event: Event): Promise<void> 
    {
        event.preventDefault();
        event.stopPropagation();
        
        this.clearMessages();
        
        if (!this.validateInputs()) 
        {
            return;
        }

        if (!this.emailInput || !this.passwordInput) 
        {
            this.showMessage('Form elements not found', 'error');
            return;
        }

        this.setLoading(true);

        try 
        {
            const response = await fetch('http://localhost:3001/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: this.emailInput.value.trim(),
                    password: this.passwordInput.value
                })
            });
            
            let data;
            try 
            {
                data = await response.json();
            } 
            catch (parseError) 
            {
                throw new Error('Invalid response from server');
            }
            
            if (response.ok) 
            {
                if (data.token) 
                {
                    localStorage.setItem('auth_token', data.token);
                }
                
                this.showMessage('Login successful! Redirecting to profile...', 'success');
                
                setTimeout(() => {
                    (window as any).navigateTo('/profile');
                }, 1500);
            } 
            else 
            {
                this.showMessage(data.message || 'Login failed', 'error');
            }

        } 
        catch (error) 
        {
            if (error instanceof TypeError && error.message.includes('fetch')) 
            {
                this.showMessage('Network error: Unable to connect to server.', 'error');
            } 
            else 
            {
                this.showMessage((error as Error).message || 'Login failed', 'error');
            }
        } 
        finally 
        {
            this.setLoading(false);
        }
    }

    public clearForm(): void 
    {
        if (this.form) 
        {
            this.form.reset();
        }
        this.clearMessages();
    }

    public focus(): void 
    {
        if (this.emailInput) 
        {
            this.emailInput.focus();
        }
    }

    public setEmail(email: string): void 
    {
        if (this.emailInput) 
        {
            this.emailInput.value = email;
        }
    }

    public destroy(): void 
    {
        if (this.form) 
        {
            this.form.removeEventListener('submit', this.handleSubmit.bind(this));
        }
        
        if (this.passwordInput) 
        {
            this.passwordInput.removeEventListener('keypress', () => {});
        }
    }
}