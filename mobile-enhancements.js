// Mobile Enhancements - Touch gestures, PWA install prompt, etc.

const MobileEnhancements = {
    // Touch gesture handling for swipe between categories
    touchStartX: 0,
    touchEndX: 0,
    minSwipeDistance: 50,
    
    init() {
        this.setupTouchGestures();
        this.setupPWAInstallPrompt();
    },
    
    setupTouchGestures() {
        const container = document.querySelector('.container');
        if (!container) return;
        
        container.addEventListener('touchstart', (e) => {
            this.touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        container.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].screenX;
            this.handleSwipeGesture();
        }, { passive: true });
    },
    
    handleSwipeGesture() {
        const swipeDistance = this.touchEndX - this.touchStartX;
        
        // Ignore small movements
        if (Math.abs(swipeDistance) < this.minSwipeDistance) {
            return;
        }
        
        const currentType = AppState.getLocationType();
        const types = ['neighborhood', 'childcare', 'doctors', 'dentists'];
        const currentIndex = types.indexOf(currentType);
        
        let newIndex;
        
        // Swipe right - previous category
        if (swipeDistance > 0) {
            newIndex = currentIndex > 0 ? currentIndex - 1 : types.length - 1;
        } 
        // Swipe left - next category
        else {
            newIndex = currentIndex < types.length - 1 ? currentIndex + 1 : 0;
        }
        
        const newType = types[newIndex];
        this.navigateToType(newType);
    },
    
    navigateToType(type) {
        const city = AppState.getCity();
        Utils.updateURL(city, '', type);
        location.reload();
    },
    
    // PWA Install Prompt
    deferredPrompt: null,
    
    setupPWAInstallPrompt() {
        // Listen for beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later
            this.deferredPrompt = e;
            // Show install button
            this.showInstallButton();
        });
        
        // Listen for app installed event
        window.addEventListener('appinstalled', () => {
            console.log('PWA installed successfully');
            this.hideInstallButton();
            Utils.showToast('Приложението е инсталирано успешно!', 'success');
        });
    },
    
    showInstallButton() {
        // Create install button if it doesn't exist
        let installBtn = document.getElementById('pwa-install-btn');
        if (installBtn) {
            installBtn.style.display = 'block';
            return;
        }
        
        installBtn = document.createElement('button');
        installBtn.id = 'pwa-install-btn';
        installBtn.className = 'pwa-install-button';
        installBtn.innerHTML = '📱 Инсталирай приложението';
        installBtn.addEventListener('click', () => this.installPWA());
        
        // Add to header
        const header = document.querySelector('header');
        if (header) {
            header.appendChild(installBtn);
        }
    },
    
    hideInstallButton() {
        const installBtn = document.getElementById('pwa-install-btn');
        if (installBtn) {
            installBtn.style.display = 'none';
        }
    },
    
    async installPWA() {
        if (!this.deferredPrompt) {
            return;
        }
        
        // Show the install prompt
        this.deferredPrompt.prompt();
        
        // Wait for the user to respond to the prompt
        const { outcome } = await this.deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }
        
        // Clear the deferredPrompt
        this.deferredPrompt = null;
        this.hideInstallButton();
    }
};

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        MobileEnhancements.init();
    });
} else {
    MobileEnhancements.init();
}

// Expose globally
window.MobileEnhancements = MobileEnhancements;
