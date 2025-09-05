import { BaseComponent } from '../components/BaseComponent';
import { LoginForm } from '../components/auth/LoginForm';

export default class LoginPage extends BaseComponent 
{
    private loginForm: LoginForm | null = null;

    render(): string 
    {
        return `
            <div class="max-w-md mx-auto">
                <div class="bg-gray-800/80 backdrop-blur rounded-3xl p-8 border border-gray-600">
                    <div class="text-center mb-8">
                        <h1 class="text-3xl font-bold font-game text-cyan-400 mb-2">Welcome Back</h1>
                        <p class="text-gray-300">Sign in to your account</p>
                    </div>
                    
                    <div id="login-form-container"></div>
                    
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
        setTimeout(() => {
            this.initializeLoginForm();
        }, 50);
    }

    private initializeLoginForm(): void 
    {
        const container = document.getElementById('login-form-container');
        if (container) 
        {
            this.loginForm = new LoginForm(container);
        }
    }

    destroy(): void 
    {
        if (this.loginForm) 
        {
            this.loginForm.destroy();
            this.loginForm = null;
        }
    }
}