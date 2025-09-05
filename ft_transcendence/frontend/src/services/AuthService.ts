// AuthService.ts - With Debugging
const API_CONFIG = 
{
  development: 
  {
    AUTH_BASE_URL: 'http://localhost:3001'
  },
  production: 
  {
    AUTH_BASE_URL: 'https://starcendence.dev'
  }
};

const isDevelopment = import.meta.env.MODE === 'development';
const API = isDevelopment ? API_CONFIG.development : API_CONFIG.production;

console.log('🔧 AuthService: Configuration loaded', {
  isDevelopment,
  apiUrl: API.AUTH_BASE_URL
});

// Types for registration operations
export interface RegisterRequest 
{
  email: string;
  username: string;
  password: string;
}

export interface RegisterResponse 
{
  message: string;
}

// AuthService class - focused on registration
export class AuthService 
{
  // Registration - matches your /register endpoint
  static async register(userData: RegisterRequest): Promise<RegisterResponse> 
  {
    console.log('🚀 AuthService.register: Starting registration process');
    console.log('📤 AuthService.register: Request data:', {
      email: userData.email,
      username: userData.username,
      passwordLength: userData.password.length,
      apiUrl: `${API.AUTH_BASE_URL}/register`
    });

    try 
    {
      console.log('🌐 AuthService.register: Making fetch request to:', `${API.AUTH_BASE_URL}/register`);
      
      const requestBody = JSON.stringify(userData);
      console.log('📝 AuthService.register: Request body:', requestBody);

      const response = await fetch(`${API.AUTH_BASE_URL}/register`, 
      {
        method: 'POST',
        headers: 
        {
          'Content-Type': 'application/json',
        },
        body: requestBody
      });

      console.log('📡 AuthService.register: Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      let data;
      try 
      {
        data = await response.json();
        console.log('📊 AuthService.register: Response data:', data);
      }
      catch (parseError) 
      {
        console.error('❌ AuthService.register: Failed to parse response as JSON:', parseError);
        
        // Try to get response as text
        const responseText = await response.text();
        console.log('📄 AuthService.register: Response as text:', responseText);
        
        throw new Error(`Invalid response format: ${response.status} ${response.statusText}`);
      }

      if (!response.ok) 
      {
        console.error('❌ AuthService.register: Request failed:', {
          status: response.status,
          statusText: response.statusText,
          data
        });
        
        throw new Error(data.message || `Registration failed: ${response.status} ${response.statusText}`);
      }

      console.log('✅ AuthService.register: Registration successful:', data);
      return data;
    } 
    catch (error) 
    {
      console.error('💥 AuthService.register: Error occurred:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) 
      {
        console.error('🌐 AuthService.register: Network error - check if backend is running');
        throw new Error('Network error: Unable to connect to server. Please check if the backend is running.');
      }
      
      console.error('📊 AuthService.register: Error details:', {
        name: (error as Error).name,
        message: (error as Error).message,
        stack: (error as Error).stack
      });
      
      throw error;
    }
  }

  // Test connection to backend
  static async testConnection(): Promise<boolean> 
  {
    console.log('🔌 AuthService.testConnection: Testing backend connection');
    
    try 
    {
      const response = await fetch(`${API.AUTH_BASE_URL}/health`, 
      {
        method: 'GET',
        headers: 
        {
          'Content-Type': 'application/json',
        }
      });

      console.log('🏥 AuthService.testConnection: Health check response:', {
        status: response.status,
        ok: response.ok
      });

      return response.ok;
    } 
    catch (error) 
    {
      console.error('❌ AuthService.testConnection: Connection failed:', error);
      return false;
    }
  }
}