const API_CONFIG = 
{
  development: 
  {
    AUTH_BASE_URL: 'http://localhost:3001'
  },
  production: 
  {
    AUTH_BASE_URL: 'https://starcendence.dev/api/auth'
  }
};

const isDevelopment = import.meta.env.MODE === 'development';
const API = isDevelopment ? API_CONFIG.development : API_CONFIG.production;

export interface RegisterRequest 
{
  username: string;
  email: string;
  password: string;
}

export interface RegisterResponse 
{
  message: string;
}

export class RegisterService 
{
  static async register(credentials: RegisterRequest): Promise<RegisterResponse> 
  {
    try 
    {
      const response = await fetch(`${API.AUTH_BASE_URL}/register`, 
      {
        method: 'POST',
        headers: 
        {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();

      if (!response.ok) 
      {
        throw new Error(data.error || data.message || 'Registration failed');
      }

      return data;
    } 
    catch (error) 
    {
      console.error('Registration error:', error);
      throw error;
    }
  }
}