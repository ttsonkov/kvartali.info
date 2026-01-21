// Application Controller (Orchestrates everything - Facade Pattern)
const AppController = {
    // Detect if running on gradini subdomain
    isKindergartenDomain() {
        const hostname = window.location.hostname.toLowerCase();
        return hostname === 'gradini.kvartali.eu' || hostname === 'www.gradini.kvartali.eu' ||
               hostname === 'gradini.localhost' || hostname === 'www.gradini.localhost';
    },
    
    // Detect if running on lekari subdomain
    isDoctorsDomain() {
        const hostname = window.location.hostname.toLowerCase();
        return hostname === 'lekari.kvartali.eu' || hostname === 'www.lekari.kvartali.eu' ||
               hostname === 'lekari.localhost' || hostname === 'www.lekari.localhost';
    },
    
    // Detect if running on zabolekari subdomain
    isDentistsDomain() {
        const hostname = window.location.hostname.toLowerCase();
        return hostname === 'zabolekari.kvartali.eu' || hostname === 'www.zabolekari.kvartali.eu' ||
               hostname === 'zabolekari.localhost' || hostname === 'www.zabolekari.localhost';
    },
    
    // Initialize application
    init() {
        // Initialize services
        DataService.init();
        
        // Verify data is loaded
        if (!DataService.isDataLoaded()) {
            console.error('cityNeighborhoods data not loaded');
            Utils.showToast('Грешка: данните за градовете не са заредени', 'error');
            return;
        }
        
        // Read URL parameters
        const urlParams = Utils.getURLParams();
        AppState.setCity(urlParams.city);
        
        // Determine location type: prioritize subdomain, then URL param
        let locationType = 'neighborhood';
        if (this.isKindergartenDomain()) {
            locationType = 'childcare';
        } else if (this.isDoctorsDomain()) {
            locationType = 'doctors';
        } else if (this.isDentistsDomain()) {
            locationType = 'dentists';
        } else if (urlParams.type && urlParams.type !== 'neighborhood') {
            locationType = urlParams.type;
        }
        
        // Set location type BEFORE any UI initialization
        AppState.setLocationType(locationType);
        console.log('Initial location type set to:', AppState.getLocationType());
        
        // Initialize UI
        UIController.updateCityDisplay(AppState.getCity());
        UIController.initStarRatings();
        buildHeaderCityMenu();
        updateHeaderCity(AppState.getCity());
        
        // Populate selects based on location type
        populateSelectOptions(AppState.getCity(), AppState.getCity());
        
        // Update UI for the current location type
        UIController.updateLocationTypeUI(locationType);
        
        // Update page branding based on subdomain
        if (this.isKindergartenDomain()) {
            const pageTitle = document.getElementById('pageTitle');
            if (pageTitle) {
                const titleSpan = pageTitle.querySelector('span:first-child');
                if (titleSpan) titleSpan.textContent = '🏫 Детски градини:';
            }
            document.title = 'Детски градини на България - Оценки и мнения | GradiniEU';
        } else if (this.isDoctorsDomain()) {
            const pageTitle = document.getElementById('pageTitle');
            if (pageTitle) {
                const titleSpan = pageTitle.querySelector('span:first-child');
                if (titleSpan) titleSpan.textContent = '⚕️ Лекари:';
            }
            document.title = 'Лекари на България - Оценки и мнения | DoctorsEU';
        } else if (this.isDentistsDomain()) {
            const pageTitle = document.getElementById('pageTitle');
            if (pageTitle) {
                const titleSpan = pageTitle.querySelector('span:first-child');
                if (titleSpan) titleSpan.textContent = '🦷 Зъболекари:';
            }
            document.title = 'Зъболекари на България - Оценки и мнения | ZabolekariEU';
        }
        
        // Setup event listeners
        EventHandlers.setupAll();
        
        // Display results for the current location type
        displayResults(AppState.getCity(), '');
        updateNeighborhoodOptions();
        
        // Update URL with the correct type parameter
        Utils.updateURL(AppState.getCity(), urlParams.neighborhood || '', locationType);
        
        // Initialize Firebase
        if (typeof firebase !== 'undefined') {
            initFirebase();
        } else {
            console.error('Firebase SDK not loaded');
            Utils.showToast('Firebase SDK не е зареден', 'error');
        }
    },
    
    // City selection handler
    selectCity(city) {
        const newCity = city || 'София';
        AppState.setCity(newCity);
        
        UIController.updateCityDisplay(newCity);
        UIController.updateLocationTypeUI(AppState.getLocationType());
        populateSelectOptions(newCity, newCity);
        
        const neighborhoodFilter = Utils.getElementValue('filterNeighborhood') || '';
        displayResults(newCity, neighborhoodFilter);
        updateNeighborhoodOptions();
        hideHeaderMenu();
        
        Utils.updateURL(newCity, neighborhoodFilter, AppState.getLocationType());
    },
    
    // Location type change handler
    setLocationType(type) {
        console.log('setLocationType called with:', type);
        AppState.setLocationType(type);
        console.log('currentLocationType is now:', AppState.getLocationType());
        
        UIController.updateLocationTypeUI(type);
        
        // Repopulate selectors
        const city = AppState.getCity();
        populateSelectOptions(city, city);
        
        // Clear form
        Utils.setElementValue('neighborhood', '');
        Utils.setElementValue('filterNeighborhood', '');
        AppState.clearRatings();
        document.querySelectorAll('.stars span').forEach(star => 
            star.classList.remove('active')
        );
        
        // Refresh results
        const filterCity = Utils.getElementValue('filterCity') || city;
        displayResults(filterCity, '');
        updateNeighborhoodOptions();
        
        Utils.updateURL(filterCity, '', type);
    }
};

// Expose globally
window.AppController = AppController;

// Setup global error handlers
window.addEventListener('error', (event) => {
    const msg = event?.error?.message || event?.message || 'Неочаквана грешка в страницата';
    console.error('Global error:', event.error || event);
    try { Utils.showToast(`Грешка: ${msg}`, 'error'); } catch (_) {}
});

window.addEventListener('unhandledrejection', (event) => {
    const msg = event?.reason?.message || 'Неуловено обещание (Promise) - грешка';
    console.error('Unhandled rejection:', event.reason || event);
    try { Utils.showToast(`Грешка: ${msg}`, 'error'); } catch (_) {}
});

// Start app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AppController.init());
} else {
    AppController.init();
}
