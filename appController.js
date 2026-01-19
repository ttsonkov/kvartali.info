// Application Controller (Orchestrates everything - Facade Pattern)
const AppController = {
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
        
        // Set location type from URL if present
        if (urlParams.type && urlParams.type !== 'neighborhood') {
            AppState.setLocationType(urlParams.type);
        }
        
        // Initialize UI
        UIController.updateCityDisplay(AppState.getCity());
        UIController.initStarRatings();
        buildHeaderCityMenu();
        populateSelectOptions(AppState.getCity(), AppState.getCity());
        updateHeaderCity(AppState.getCity());
        
        // Setup event listeners
        EventHandlers.setupAll();
        
        // Apply location type from URL after UI is set up
        if (urlParams.type === 'childcare') {
            this.setLocationType('childcare');
        }
        
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
