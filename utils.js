// Utility Functions (DRY Principle)
const Utils = {
    // DOM Helper
    getElement(id) {
        return document.getElementById(id);
    },
    
    getElementValue(id) {
        const element = this.getElement(id);
        return element ? element.value : null;
    },
    
    setElementValue(id, value) {
        const element = this.getElement(id);
        if (element) element.value = value;
    },
    
    // Vote key generator
    makeVoteKey(city, neighborhood, type = 'neighborhood') {
        return `${type}::${city || 'София'}::${neighborhood}`;
    },
    
    // URL Management
    updateURL(city, neighborhood = '', type = 'neighborhood') {
        const params = new URLSearchParams();
        if (city) params.set('city', city);
        if (neighborhood) params.set('neighborhood', neighborhood);
        if (type && type !== 'neighborhood') params.set('type', type);
        
        // Preserve current hash - query params BEFORE hash
        const currentHash = window.location.hash || '';
        const queryString = params.toString() ? `?${params.toString()}` : '';
        const newURL = `${window.location.pathname}${queryString}${currentHash}`;
        window.history.pushState({ city, neighborhood, type }, '', newURL);
    },
    
    getURLParams() {
        const params = new URLSearchParams(window.location.search);
        const hash = window.location.hash.toLowerCase();
        
        let type = params.get('type') || 'neighborhood';
        
        // Override type based on URL hash (check zabolekari before lekari!)
        if (hash.includes('detskigradini')) {
            type = 'childcare';
        } else if (hash.includes('zabolekari')) {
            type = 'dentists';
        } else if (hash.includes('lekari')) {
            type = 'doctors';
        }
        
        return {
            city: params.get('city') || 'София',
            neighborhood: params.get('neighborhood') || '',
            type: type
        };
    },
    
    // Toast notification
    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        if (type === 'error') {
            toast.style.background = '#dc3545';
        }
        document.body.appendChild(toast);
        
        setTimeout(() => toast.remove(), 3000);
    },
    
    // Debounce function for performance optimization
    debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Throttle function for scroll/resize events
    throttle(func, limit = 100) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

// Expose globally
window.Utils = Utils;
