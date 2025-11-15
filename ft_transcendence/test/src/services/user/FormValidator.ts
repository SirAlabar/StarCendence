// FormValidator.ts
export class FormValidator 
{
  static validateEmail(email: string): string | null 
  {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email) 
    {
      return 'Email is required';
    }
    
    if (!emailRegex.test(email)) 
    {
      return 'Please enter a valid email address';
    }
    
    if (email.length > 255) 
    {
      return 'Email is too long';
    }
    
    return null;
  }

  static validateUsername(username: string): string | null 
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

  static validatePassword(password: string): string | null 
  {
    if (!password) 
    {
      return 'Password is required';
    }
    
    if (password.length < 8) 
    {
      return 'Password must be at least 8 characters';
    }
    
    if (password.length > 72) 
    {
      return 'Password is too long';
    }
    
    // Match your backend regex: at least one lowercase, uppercase, digit, and special char
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.])[A-Za-z\d@$!%*?&.]{8,}$/;
    if (!passwordRegex.test(password)) 
    {
      return 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character';
    }
    
    return null;
  }

  static validatePasswordConfirm(password: string, confirmPassword: string): string | null 
  {
    if (password !== confirmPassword) 
    {
      return 'Passwords do not match';
    }
    
    return null;
  }
}