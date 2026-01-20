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
        const hostname = window.location.hostname.toLowerCase();
        const isGradiniDomain = hostname === 'gradini.kvartali.eu' || hostname === 'www.gradini.kvartali.eu';
        const isDoctorsDomain = hostname === 'lekari.kvartali.eu' || hostname === 'www.lekari.kvartali.eu';
        
        const params = new URLSearchParams();
        if (city) params.set('city', city);
        if (neighborhood) params.set('neighborhood', neighborhood);
        
        // Don't add type parameter if we're on the corresponding subdomain
        const shouldAddType = type && type !== 'neighborhood' && 
                              !((type === 'childcare' && isGradiniDomain) || 
                                (type === 'doctors' && isDoctorsDomain));
        if (shouldAddType) params.set('type', type);
        
        const newURL = params.toString() ? `?${params.toString()}` : window.location.pathname;
        window.history.pushState({ city, neighborhood, type }, '', newURL);
    },
    
    getURLParams() {
        const params = new URLSearchParams(window.location.search);
        const hostname = window.location.hostname.toLowerCase();
        const isKindergartenDomain = hostname === 'gradini.kvartali.eu' || hostname === 'www.gradini.kvartali.eu';
        const isDoctorsDomain = hostname === 'lekari.kvartali.eu' || hostname === 'www.lekari.kvartali.eu';
        
        let type = params.get('type') || 'neighborhood';
        
        // Override type based on subdomain
        if (isKindergartenDomain) {
            type = 'childcare';
        } else if (isDoctorsDomain) {
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
    }
};

// Expose globally
window.Utils = Utils;
