/**
 * Simple Toast Utility - A+++++ UI/UX
 * Lightweight toast implementation without external dependencies
 */

interface ToastOptions {
  duration?: number;
  type?: 'success' | 'error' | 'loading' | 'info';
}

class ToastManager {
  private container: HTMLElement | null = null;
  private toasts: Map<string, HTMLElement> = new Map();

  private createContainer() {
    if (this.container) return this.container;
    
    this.container = document.createElement('div');
    this.container.className = 'fixed top-4 right-4 z-50 space-y-2';
    document.body.appendChild(this.container);
    return this.container;
  }

  private createToast(message: string, options: ToastOptions = {}) {
    const { duration = 3000, type = 'info' } = options;
    const id = Math.random().toString(36).substr(2, 9);
    
    const toast = document.createElement('div');
    toast.className = `
      bg-white border rounded-lg shadow-lg px-4 py-3 max-w-sm
      transform transition-all duration-300 ease-in-out
      ${type === 'success' ? 'border-green-200 bg-green-50' : ''}
      ${type === 'error' ? 'border-red-200 bg-red-50' : ''}
      ${type === 'loading' ? 'border-blue-200 bg-blue-50' : ''}
    `.trim().replace(/\s+/g, ' ');
    
    const icon = type === 'success' ? '✅' : 
                 type === 'error' ? '❌' : 
                 type === 'loading' ? '⏳' : 'ℹ️';
    
    toast.innerHTML = `
      <div class="flex items-center space-x-2">
        <span>${icon}</span>
        <span class="text-sm text-gray-800">${message}</span>
      </div>
    `;
    
    // Animate in
    toast.style.transform = 'translateX(100%)';
    toast.style.opacity = '0';
    
    this.createContainer().appendChild(toast);
    this.toasts.set(id, toast);
    
    // Trigger animation
    requestAnimationFrame(() => {
      toast.style.transform = 'translateX(0)';
      toast.style.opacity = '1';
    });
    
    // Auto remove
    if (type !== 'loading' && duration > 0) {
      setTimeout(() => this.remove(id), duration);
    }
    
    return id;
  }

  private remove(id: string) {
    const toast = this.toasts.get(id);
    if (!toast) return;
    
    toast.style.transform = 'translateX(100%)';
    toast.style.opacity = '0';
    
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
      this.toasts.delete(id);
    }, 300);
  }

  success(message: string, duration?: number) {
    return this.createToast(message, { type: 'success', duration });
  }

  error(message: string, duration?: number) {
    return this.createToast(message, { type: 'error', duration });
  }

  loading(message: string) {
    return this.createToast(message, { type: 'loading', duration: 0 });
  }

  info(message: string, duration?: number) {
    return this.createToast(message, { type: 'info', duration });
  }

  dismiss(id: string) {
    this.remove(id);
  }
}

export const toast = new ToastManager();