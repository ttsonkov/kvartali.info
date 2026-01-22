// Event Handlers (Single Responsibility - User Interactions)
const EventHandlers = {
    // Setup all event listeners
    setupAll() {
        this.setupLocationTypeButtons();
        this.setupNeighborhoodSelectors();
        this.setupSortingAndFiltering();
        this.setupHeaderMenu();
        this.setupBrowserNavigation();
        this.setupFormSubmission();
    },
    
    setupLocationTypeButtons() {
        const btnNeighborhoods = Utils.getElement('btnNeighborhoods');
        const btnChildcare = Utils.getElement('btnChildcare');
        const btnDoctors = Utils.getElement('btnDoctors');
        const btnDentists = Utils.getElement('btnDentists');
        
        if (btnNeighborhoods) {
            btnNeighborhoods.addEventListener('click', () => {
                const city = AppState.getCity();
                const params = new URLSearchParams();
                if (city && city !== 'София') params.set('city', city);
                const queryString = params.toString() ? `?${params.toString()}` : '';
                window.location.href = `/${queryString}`;
            });
        }
        
        if (btnChildcare) {
            btnChildcare.addEventListener('click', () => {
                const city = AppState.getCity();
                const params = new URLSearchParams();
                if (city && city !== 'София') params.set('city', city);
                const queryString = params.toString() ? `?${params.toString()}` : '';
                window.location.href = `/${queryString}#/detskigradini`;
            });
        }
        
        if (btnDoctors) {
            btnDoctors.addEventListener('click', () => {
                const city = AppState.getCity();
                const params = new URLSearchParams();
                if (city && city !== 'София') params.set('city', city);
                const queryString = params.toString() ? `?${params.toString()}` : '';
                window.location.href = `/${queryString}#/lekari`;
            });
        }
        
        if (btnDentists) {
            btnDentists.addEventListener('click', () => {
                const city = AppState.getCity();
                const params = new URLSearchParams();
                if (city && city !== 'София') params.set('city', city);
                const queryString = params.toString() ? `?${params.toString()}` : '';
                window.location.href = `/${queryString}#/zabolekari`;
            });
        }
    },
    
    
    setupNeighborhoodSelectors() {
        const neighborhood = Utils.getElement('neighborhood');
        if (neighborhood) {
            neighborhood.addEventListener('change', (e) => {
                const selectedNeighborhood = e.target.value;
                
                Utils.setElementValue('filterNeighborhood', selectedNeighborhood);
                triggerFilteredDisplay();
            });
        }
        
        const filterNeighborhood = Utils.getElement('filterNeighborhood');
        if (filterNeighborhood) {
            // Debounced filter for better performance
            const debouncedFilter = Utils.debounce(() => {
                triggerFilteredDisplay();
            }, 300);
            
            filterNeighborhood.addEventListener('change', () => {
                debouncedFilter();
            });
        }
    },
    
    setupSortingAndFiltering() {
        // Sort by dropdown
        const sortBy = Utils.getElement('sortBy');
        if (sortBy) {
            sortBy.addEventListener('change', () => {
                triggerFilteredDisplay();
                
                // Track sorting in analytics
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'sort_change', {
                        event_category: 'filtering',
                        event_label: sortBy.value
                    });
                }
            });
        }
        
        // Min votes slider
        const minVotes = Utils.getElement('minVotes');
        const minVotesValue = Utils.getElement('minVotesValue');
        if (minVotes && minVotesValue) {
            minVotes.addEventListener('input', (e) => {
                minVotesValue.textContent = e.target.value;
            });
            
            minVotes.addEventListener('change', () => {
                triggerFilteredDisplay();
                
                // Track filtering in analytics
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'filter_votes', {
                        event_category: 'filtering',
                        value: parseInt(minVotes.value)
                    });
                }
            });
        }
        
        // Min rating slider
        const minRating = Utils.getElement('minRating');
        const minRatingValue = Utils.getElement('minRatingValue');
        if (minRating && minRatingValue) {
            minRating.addEventListener('input', (e) => {
                minRatingValue.textContent = parseFloat(e.target.value).toFixed(1);
            });
            
            minRating.addEventListener('change', () => {
                triggerFilteredDisplay();
                
                // Track filtering in analytics
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'filter_rating', {
                        event_category: 'filtering',
                        value: parseFloat(minRating.value)
                    });
                }
            });
        }
        
        // Reset filters button
        const resetFilters = Utils.getElement('resetFilters');
        if (resetFilters) {
            resetFilters.addEventListener('click', () => {
                // Reset all filter controls
                Utils.setElementValue('filterNeighborhood', '');
                Utils.setElementValue('sortBy', 'rating-desc');
                Utils.setElementValue('minVotes', '0');
                Utils.setElementValue('minRating', '0');
                
                if (minVotesValue) minVotesValue.textContent = '0';
                if (minRatingValue) minRatingValue.textContent = '0.0';
                
                // Trigger display refresh
                triggerFilteredDisplay();
                
                // Track reset in analytics
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'reset_filters', {
                        event_category: 'filtering'
                    });
                }
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
