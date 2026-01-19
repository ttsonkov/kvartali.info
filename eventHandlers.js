// Event Handlers (Single Responsibility - User Interactions)
const EventHandlers = {
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
        
        if (btnNeighborhoods) {
            btnNeighborhoods.addEventListener('click', () => {
                AppController.setLocationType('neighborhood');
            });
        }
        
        if (btnChildcare) {
            btnChildcare.addEventListener('click', () => {
                AppController.setLocationType('childcare');
            });
        }
    },
    
    
    setupNeighborhoodSelectors() {
        const neighborhood = Utils.getElement('neighborhood');
        if (neighborhood) {
            neighborhood.addEventListener('change', (e) => {
                const selectedNeighborhood = e.target.value;
                const city = Utils.getElementValue('citySelect');
                
                Utils.setElementValue('filterNeighborhood', selectedNeighborhood);
                if (selectedNeighborhood) {
                    displayResults(city, selectedNeighborhood);
                    Utils.updateURL(city, selectedNeighborhood);
                }
            });
        }
        
        const filterNeighborhood = Utils.getElement('filterNeighborhood');
        if (filterNeighborhood) {
            filterNeighborhood.addEventListener('change', (e) => {
                const city = Utils.getElementValue('filterCity');
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
