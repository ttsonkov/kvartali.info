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
        
        // Determine location type from URL params
        const locationType = urlParams.type || 'neighborhood';
        
        // Set location type BEFORE any UI initialization
        AppState.setLocationType(locationType);
        
        // Initialize UI
        UIController.updateCityDisplay(AppState.getCity());
        UIController.initStarRatings();
        buildHeaderCityMenu();
        updateHeaderCity(AppState.getCity());
        
        // Populate selects based on location type
        populateSelectOptions(AppState.getCity(), AppState.getCity());
        
        // Update UI for the current location type
        UIController.updateLocationTypeUI(locationType);
        
        // Update page branding based on path
        if (locationType === 'childcare') {
            const pageTitle = document.getElementById('pageTitle');
            if (pageTitle) {
                const titleSpan = pageTitle.querySelector('span:first-child');
                if (titleSpan) titleSpan.textContent = '🏫 Детски градини:';
            }
            document.title = 'Детски градини на България - Оценки и мнения | KvartaliEU';
        } else if (locationType === 'doctors') {
            const pageTitle = document.getElementById('pageTitle');
            if (pageTitle) {
                const titleSpan = pageTitle.querySelector('span:first-child');
                if (titleSpan) titleSpan.textContent = '⚕️ Лекари:';
            }
            document.title = 'Лекари на България - Оценки и мнения | KvartaliEU';
        } else if (locationType === 'dentists') {
            const pageTitle = document.getElementById('pageTitle');
            if (pageTitle) {
                const titleSpan = pageTitle.querySelector('span:first-child');
                if (titleSpan) titleSpan.textContent = '🦷 Зъболекари:';
            }
            document.title = 'Зъболекари на България - Оценки и мнения | KvartaliEU';
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
        
        // Update SEO
        if (window.SEOEnhancements) {
            SEOEnhancements.refresh();
        }
    },
    
    // Location type change handler
    setLocationType(type) {
        AppState.setLocationType(type);
        
        UIController.updateLocationTypeUI(type);
        
        // Repopulate selectors
        const city = AppState.getCity();
        populateSelectOptions(city, city);
        
        // Clear form
        Utils.setElementValue('neighborhood', '');
        Utils.setElementValue('filterNeighborhood', '');
        AppState.clearRatings();
        
        // Update SEO
        if (window.SEOEnhancements) {
            SEOEnhancements.refresh();
        }
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
