import { BaseComponent } from '../components/BaseComponent';
import { RegisterForm } from '../components/auth/RegisterForm';

export default class RegisterPage extends BaseComponent 
{
    private registerForm: RegisterForm | null = null;

    render(): string 
    {
        return `
            <div class="max-w-md mx-auto">
                <div class="bg-gray-800/80 backdrop-blur rounded-3xl p-8 border border-gray-600">
                    <div class="text-center mb-8">
                        <h1 class="text-3xl font-bold font-game text-purple-400 mb-2">Join Transcendence</h1>
                        <p class="text-gray-300">Create your gaming account</p>
                    </div>
                    
                    <div id="register-form-container"></div>
                    
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
        setTimeout(() => {
            this.initializeRegisterForm();
        }, 50);
    }

    private initializeRegisterForm(): void 
    {
        const container = document.getElementById('register-form-container');
        if (container) 
        {
            this.registerForm = new RegisterForm(container);
        }
    }

    destroy(): void 
    {
        if (this.registerForm) 
        {
            this.registerForm.destroy();
            this.registerForm = null;
        }
    }
}