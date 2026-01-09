export abstract class BaseComponent {
    protected container: HTMLElement | null = null;
    
    abstract render(): string;
    
    mount(selector: string): void {
        this.container = document.querySelector(selector);
        if (!this.container) 
        {
            return;
        }
        
        this.container.innerHTML = this.render();
        this.afterMount();
    }
    
    protected afterMount(): void 
    {
        // Override in child components for post-render logic
    }
    
    protected addClass(className: string): string 
    {
        // Helper method to build Tailwind classes programmatically
        return className;
    }
}

// Tailwind class builder helpers
export const tw = {
    // Layout
    flex: 'flex',
    flexCol: 'flex-col',
    items: {
        center: 'items-center',
        start: 'items-start',
        end: 'items-end'
    },
    justify: {
        center: 'justify-center',
        between: 'justify-between',
        start: 'justify-start'
    },
    
    // Spacing
    p: (size: number) => `p-${size}`,
    px: (size: number) => `px-${size}`,
    py: (size: number) => `py-${size}`,
    m: (size: number) => `m-${size}`,
    gap: (size: number) => `gap-${size}`,
    
    // Background
    bg: {
        gradient: 'bg-gradient-to-r from-purple-500 to-cyan-400',
        surface: 'bg-gradient-to-br from-gray-800/80 to-gray-900/80',
        transparent: 'bg-transparent'
    },
    
    // Text
    text: {
        white: 'text-white',
        cyan: 'text-cyan-400',
        purple: 'text-purple-400',
        gray: 'text-gray-400',
        xl: 'text-xl',
        '2xl': 'text-2xl',
        '3xl': 'text-3xl'
    },
    
    // Border
    border: 'border border-gray-600',
    rounded: {
        lg: 'rounded-lg',
        xl: 'rounded-xl',
        '2xl': 'rounded-2xl'
    },
    
    // Effects
    hover: {
        opacity: 'hover:opacity-80',
        scale: 'hover:scale-105'
    },
    transition: 'transition-all duration-300'
};