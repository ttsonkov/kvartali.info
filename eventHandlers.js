// Event Handlers (Single Responsibility - User Interactions)
const EventHandlers = {
    // Helper to get base domain (e.g., 'kvartali.eu' or 'localhost')
    getBaseDomain() {
        const hostname = window.location.hostname.toLowerCase();
        // If it's localhost, return 'localhost'
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'localhost';
        }
        // If it's a subdomain (gradini.kvartali.eu, lekari.kvartali.eu), extract base domain
        if (hostname.includes('gradini.') || hostname.includes('lekari.')) {
            return hostname.replace(/^(www\.)?(gradini\.|lekari\.)/, '');
        }
        // Otherwise return as is (kvartali.eu, www.kvartali.eu)
        return hostname.replace(/^www\./, '');
    },
    
    // Setup all event listeners
    setupAll() {
        this.setupLocationTypeButtons();
        this.setupNeighborhoodSelectors();
        this.setupHeaderMenu();
        this.setupBrowserNavigation();
        this.setupFormSubmission();
    },
    
    setupLocationTypeButtons() {
        const btnNeighborhoods = Utils.getElement('btnNeighborhoods');
        const btnChildcare = Utils.getElement('btnChildcare');
        const btnDoctors = Utils.getElement('btnDoctors');
        
        if (btnNeighborhoods) {
            btnNeighborhoods.addEventListener('click', () => {
                // Redirect to main domain only if on subdomain
                const hostname = window.location.hostname.toLowerCase();
                if (hostname.includes('gradini.') || hostname.includes('lekari.')) {
                    const city = AppState.getCity();
                    const params = new URLSearchParams();
                    if (city) params.set('city', city);
                    const baseDomain = this.getBaseDomain();
                    const newURL = `${window.location.protocol}//${baseDomain}${window.location.port ? ':' + window.location.port : ''}/${params.toString() ? '?' + params.toString() : ''}`;
                    window.location.href = newURL;
                } else {
                    AppController.setLocationType('neighborhood');
                }
            });
        }
        
        if (btnChildcare) {
            btnChildcare.addEventListener('click', () => {
                // Redirect to gradini subdomain if not already there
                const hostname = window.location.hostname.toLowerCase();
                if (!hostname.includes('gradini.')) {
                    const city = AppState.getCity();
                    const params = new URLSearchParams();
                    if (city) params.set('city', city);
                    const baseDomain = this.getBaseDomain();
                    const newURL = `${window.location.protocol}//gradini.${baseDomain}${window.location.port ? ':' + window.location.port : ''}/${params.toString() ? '?' + params.toString() : ''}`;
                    window.location.href = newURL;
                } else {
                    AppController.setLocationType('childcare');
                }
            });
        }
        
        if (btnDoctors) {
            btnDoctors.addEventListener('click', () => {
                // Redirect to lekari subdomain if not already there
                const hostname = window.location.hostname.toLowerCase();
                if (!hostname.includes('lekari.')) {
                    const city = AppState.getCity();
                    const params = new URLSearchParams();
                    if (city) params.set('city', city);
                    const baseDomain = this.getBaseDomain();
                    const newURL = `${window.location.protocol}//lekari.${baseDomain}${window.location.port ? ':' + window.location.port : ''}/${params.toString() ? '?' + params.toString() : ''}`;
                    window.location.href = newURL;
                } else {
                    AppController.setLocationType('doctors');
                }
            });
        }
    },
    
    
    setupNeighborhoodSelectors() {
        const neighborhood = Utils.getElement('neighborhood');
        if (neighborhood) {
            neighborhood.addEventListener('change', (e) => {
                const selectedNeighborhood = e.target.value;
                const city = AppState.getCity();
                
                Utils.setElementValue('filterNeighborhood', selectedNeighborhood);
                displayResults(city, selectedNeighborhood);
                Utils.updateURL(city, selectedNeighborhood);
            });
        }
        
        const filterNeighborhood = Utils.getElement('filterNeighborhood');
        if (filterNeighborhood) {
            filterNeighborhood.addEventListener('change', (e) => {
                const city = AppState.getCity();
                const selectedNeighborhood = e.target.value;
                
                Utils.setElementValue('neighborhood', selectedNeighborhood);
                displayResults(city, selectedNeighborhood);
                Utils.updateURL(city, selectedNeighborhood);
            });
        }
    },
    
    setupHeaderMenu() {
        const headerCityLink = Utils.getElement('headerCityLink');
        if (headerCityLink) {
            headerCityLink.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleHeaderMenu();
            });
        }
        
        document.addEventListener('click', (e) => {
            const menu = Utils.getElement('headerCityMenu');
            const link = Utils.getElement('headerCityLink');
            if (!menu || !link) return;
            if (!menu.contains(e.target) && !link.contains(e.target)) {
                hideHeaderMenu();
            }
        });
    },
    
    setupBrowserNavigation() {
        window.addEventListener('popstate', () => {
            const urlParams = Utils.getURLParams();
            if (urlParams.type && urlParams.type !== AppState.getLocationType()) {
                AppController.setLocationType(urlParams.type);
            }
            AppController.selectCity(urlParams.city);
            if (urlParams.neighborhood) {
                Utils.setElementValue('filterNeighborhood', urlParams.neighborhood);
                displayResults(urlParams.city, urlParams.neighborhood);
            }
        });
    },
    
    setupFormSubmission() {
        const form = Utils.getElement('ratingForm');
        if (form) {
            form.addEventListener('submit', handleFormSubmit);
        }
    }
};

// Expose globally
window.EventHandlers = EventHandlers;
