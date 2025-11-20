// Modal dialog component
export class Modal 
{
    private static isModalOpen: boolean = false;

    public static async confirm(
        title: string,
        message: string,
        confirmText: string = 'CONFIRM',
        cancelText: string = 'CANCEL',
        isDanger: boolean = false
    ): Promise<boolean> 
    {
        if (Modal.isModalOpen) 
        {
            return false;
        }
        Modal.isModalOpen = true;

        return new Promise((resolve) => 
        {
            const modal = document.createElement('div');
            modal.id = 'confirm-modal';
            
            const confirmButtonClass = isDanger 
                ? 'neon-border-red px-5 py-2 rounded-lg font-bold text-red-400 hover:text-red-300 transition-all text-sm'
                : 'neon-border px-5 py-2 rounded-lg font-bold text-cyan-400 hover:text-cyan-300 transition-all text-sm';
            
            modal.innerHTML = `
                <div class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div class="bg-gray-900/95 border-2 border-cyan-500/50 rounded-xl p-6 max-w-md w-full text-center shadow-[0_0_20px_#00ffff88]">
                        <h2 class="text-2xl font-bold text-cyan-400 mb-4 tracking-wide" style="text-shadow: 0 0 10px #00ffff;">
                            ${Modal.escapeHtml(title)}
                        </h2>
                        <p class="text-gray-300 mb-6 text-sm sm:text-base">${Modal.escapeHtml(message)}</p>
                        <div class="flex justify-center gap-4">
                            <button id="confirm-yes" class="${confirmButtonClass}">
                                ${Modal.escapeHtml(confirmText)}
                            </button>
                            <button id="confirm-cancel" class="neon-border px-5 py-2 rounded-lg font-bold text-cyan-400 hover:text-cyan-300 transition-all text-sm">
                                ${Modal.escapeHtml(cancelText)}
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            let isCleanedUp = false;
            
            // ESC key handler
            const handleEscape = (e: KeyboardEvent) => 
            {
                if (e.key === 'Escape') 
                {
                    cleanup(false);
                }
            };
            document.addEventListener('keydown', handleEscape);
            
            const cleanup = (result: boolean) => 
            {
                if (isCleanedUp) 
                {
                    return;
                }
                isCleanedUp = true;
                
                // ALWAYS remove event listener
                document.removeEventListener('keydown', handleEscape);
                
                modal.remove();
                Modal.isModalOpen = false;
                resolve(result);
            };
            
            modal.querySelector('#confirm-yes')?.addEventListener('click', () => cleanup(true));
            modal.querySelector('#confirm-cancel')?.addEventListener('click', () => cleanup(false));
        });
    }

    public static async alert(
        title: string,
        message: string,
        buttonText: string = 'OK'
    ): Promise<void> 
    {
        if (Modal.isModalOpen) 
        {
            return;
        }
        Modal.isModalOpen = true;

        return new Promise((resolve) => 
        {
            const modal = document.createElement('div');
            modal.id = 'alert-modal';
            
            modal.innerHTML = `
                <div class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div class="bg-gray-900/95 border-2 border-cyan-500/50 rounded-xl p-6 max-w-md w-full text-center shadow-[0_0_20px_#00ffff88]">
                        <h2 class="text-2xl font-bold text-cyan-400 mb-4 tracking-wide" style="text-shadow: 0 0 10px #00ffff;">
                            ${Modal.escapeHtml(title)}
                        </h2>
                        <p class="text-gray-300 mb-6 text-sm sm:text-base">
                            ${Modal.escapeHtml(message)}
                        </p>
                        <button id="alert-ok" class="neon-border px-6 py-2 rounded-lg font-bold text-cyan-400 hover:text-cyan-300 transition-all text-sm">
                            ${Modal.escapeHtml(buttonText)}
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);

            let isCleanedUp = false;

            // ESC key handler
            const handleEscape = (e: KeyboardEvent) => 
            {
                if (e.key === 'Escape') 
                {
                    cleanup();
                }
            };
            document.addEventListener('keydown', handleEscape);

            const cleanup = () => 
            {
                if (isCleanedUp) 
                {
                    return;
                }
                isCleanedUp = true;

                document.removeEventListener('keydown', handleEscape);

                modal.remove();
                Modal.isModalOpen = false;
                resolve();
            };

            modal.querySelector('#alert-ok')?.addEventListener('click', cleanup);
        });
    }

    public static showConfirm(
        title: string,
        message: string,
        confirmText: string = 'CONFIRM',
        cancelText: string = 'CANCEL',
        isDanger: boolean = false,
        onConfirm?: () => void,
        onCancel?: () => void
    ): void 
    {
        Modal.confirm(title, message, confirmText, cancelText, isDanger)
            .then((result) => 
            {
                if (result && onConfirm) 
                {
                    onConfirm();
                }
                if (!result && onCancel) 
                {
                    onCancel();
                }
            });
    }

    public static showAlert(
        title: string,
        message: string,
        buttonText: string = 'OK'
    ): void 
    {
        void Modal.alert(title, message, buttonText);
    }

    private static escapeHtml(text: string): string 
    {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}