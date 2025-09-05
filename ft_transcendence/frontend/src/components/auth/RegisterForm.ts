export class RegisterForm 
{
    private container: HTMLElement;
    private form: HTMLFormElement | null = null;
    private usernameInput: HTMLInputElement | null = null;
    private emailInput: HTMLInputElement | null = null;
    private passwordInput: HTMLInputElement | null = null;
    private confirmPasswordInput: HTMLInputElement | null = null;
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
        `;
    }

    private initializeElements(): void 
    {
        this.form = this.container.querySelector('#register-form') as HTMLFormElement;
        this.usernameInput = this.container.querySelector('#username-input') as HTMLInputElement;
        this.emailInput = this.container.querySelector('#email-input') as HTMLInputElement;
        this.passwordInput = this.container.querySelector('#password-input') as HTMLInputElement;
        this.confirmPasswordInput = this.container.querySelector('#confirm-password-input') as HTMLInputElement;
        this.submitButton = this.container.querySelector('#submit-button') as HTMLButtonElement;
        this.messageContainer = this.container.querySelector('#message-container') as HTMLDivElement;
    }

    private attachEventListeners(): void 
    {
        if (this.form) 
        {
            this.form.addEventListener('submit', this.handleSubmit.bind(this));
        }
        
        if (this.usernameInput) 
        {
            this.usernameInput.addEventListener('blur', () => this.validateField('username'));
        }
        
        if (this.emailInput) 
        {
            this.emailInput.addEventListener('blur', () => this.validateField('email'));
        }
        
        if (this.passwordInput) 
        {
            this.passwordInput.addEventListener('blur', () => this.validateField('password'));
        }
        
        if (this.confirmPasswordInput) 
        {
            this.confirmPasswordInput.addEventListener('blur', () => this.validateField('confirmPassword'));
        }
    }

    private validateField(field: string): boolean 
    {
        if (!this.usernameInput || !this.emailInput || !this.passwordInput || !this.confirmPasswordInput) 
        {
            return false;
        }

        let error: string | null = null;
        
        switch (field) 
        {
            case 'username':
                error = this.validateUsername(this.usernameInput.value.trim());
                break;
            case 'email':
                error = this.validateEmail(this.emailInput.value.trim());
                break;
            case 'password':
                error = this.validatePassword(this.passwordInput.value);
                break;
            case 'confirmPassword':
                error = this.validatePasswordConfirm(
                    this.passwordInput.value,
                    this.confirmPasswordInput.value
                );
                break;
        }

        if (error) 
        {
            this.showMessage(error, 'error');
            return false;
        }
        
        return true;
    }

    private validateUsername(username: string): string | null 
    {
        if (!username) return 'Username is required';
        if (username.length < 3) return 'Username must be at least 3 characters';
        if (username.length > 30) return 'Username must be less than 30 characters';
        if (!/^[a-zA-Z0-9._-]+$/.test(username)) 
        {
            return 'Username can only contain letters, numbers, dots, underscores, and hyphens';
        }
        return null;
    }

    private validateEmail(email: string): string | null 
    {
        if (!email) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return 'Please enter a valid email address';
        if (email.length > 255) return 'Email is too long';
        return null;
    }

    private validatePassword(password: string): string | null 
    {
        if (!password) return 'Password is required';
        if (password.length < 8) return 'Password must be at least 8 characters';
        if (password.length > 72) return 'Password is too long';
        
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.])[A-Za-z\d@$!%*?&.]{8,}$/;
        if (!passwordRegex.test(password)) 
        {
            return 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character';
        }
        return null;
    }

    private validatePasswordConfirm(password: string, confirmPassword: string): string | null 
    {
        if (password !== confirmPassword) return 'Passwords do not match';
        return null;
    }

    private validateAllFields(): boolean 
    {
        const validations = [
            this.validateField('username'),
            this.validateField('email'),
            this.validateField('password'),
            this.validateField('confirmPassword')
        ];

        return validations.every(isValid => isValid);
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
            this.submitButton.textContent = loading ? 'Creating Account...' : 'Create Account';
        }
    }

    private async handleSubmit(event: Event): Promise<void> 
    {
        event.preventDefault();
        event.stopPropagation();
        
        this.clearMessages();
        
        if (!this.validateAllFields()) 
        {
            return;
        }

        if (!this.usernameInput || !this.emailInput || !this.passwordInput) 
        {
            this.showMessage('Form elements not found', 'error');
            return;
        }

        const userData = 
        {
            username: this.usernameInput.value.trim(),
            email: this.emailInput.value.trim(),
            password: this.passwordInput.value
        };

        this.setLoading(true);

        try 
        {
            const response = await fetch('http://localhost:3001/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
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
                this.showMessage(`${data.message} Please login with your credentials.`, 'success');
                
                setTimeout(() => 
                {
                    (window as any).navigateTo('/login');
                }, 2000);
            } 
            else 
            {
                this.showMessage(data.message || 'Registration failed', 'error');
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
                this.showMessage((error as Error).message || 'Registration failed', 'error');
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

    public destroy(): void 
    {
        if (this.form) 
        {
            this.form.removeEventListener('submit', this.handleSubmit.bind(this));
        }
    }
}