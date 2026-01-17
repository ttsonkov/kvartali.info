// Main application logic

// Toast notification (moved here to be available early)
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    if (type === 'error') {
        toast.style.background = '#dc3545';
    }
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

let currentCity = "София";
let currentRatings = {};

// Helper functions
const makeVoteKey = (city, neighborhood) => `${city || 'София'}::${neighborhood}`;

const getNeighborhoodsForCity = (city) => {
    if (!city) return allNeighborhoods;
    return cityNeighborhoods[city] || [];
};

// URL management
function updateURL(city, neighborhood = '') {
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (neighborhood) params.set('neighborhood', neighborhood);
    
    const newURL = params.toString() ? `?${params.toString()}` : window.location.pathname;
    window.history.pushState({ city, neighborhood }, '', newURL);
}

function getURLParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        city: params.get('city') || 'София',
        neighborhood: params.get('neighborhood') || ''
    };
}

// Central city selection handler
function applyCitySelection(city) {
    const newCity = city || 'София';
    currentCity = newCity;

    const citySelect = document.getElementById('citySelect');
    if (citySelect) citySelect.value = newCity;

    const filterCitySelect = document.getElementById('filterCity');
    if (filterCitySelect) filterCitySelect.value = newCity;

    updateHeaderCity(newCity);
    populateSelectOptions(newCity, newCity);

    const currentNeighborhoodFilter = document.getElementById('filterNeighborhood')?.value || '';
    displayResults(newCity, currentNeighborhoodFilter);
    updateNeighborhoodOptions();
    hideHeaderMenu();
    
    // Update URL
    updateURL(newCity, currentNeighborhoodFilter);
}

// Initialize star ratings
function initStarRatings() {
    document.querySelectorAll('.stars').forEach(starsContainer => {
        const criterion = starsContainer.dataset.criterion;
        currentRatings[criterion] = 0;
        
        for (let i = 1; i <= 5; i++) {
            const star = document.createElement('span');
            star.className = 'star';
            star.textContent = '★';
            star.dataset.value = i;
            
            star.addEventListener('click', () => {
                currentRatings[criterion] = i;
                updateStars(starsContainer, i);
            });
            
            starsContainer.appendChild(star);
        }
    });
}

// Event listeners setup
function setupEventListeners() {
    // City selector change
    document.getElementById('citySelect').addEventListener('change', (e) => {
        applyCitySelection(e.target.value);
    });

    // Filter results
    document.getElementById('filterCity').addEventListener('change', (e) => {
        const city = e.target.value || currentCity;
        applyCitySelection(city);
    });

    document.getElementById('filterNeighborhood').addEventListener('change', (e) => {
        const city = document.getElementById('filterCity').value;
        displayResults(city, e.target.value);
        updateURL(city, e.target.value);
    });

    // Header city link toggles menu
    document.getElementById('headerCityLink').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleHeaderMenu();
    });

    // Close menu on outside click
    document.addEventListener('click', (e) => {
        const menu = document.getElementById('headerCityMenu');
        const link = document.getElementById('headerCityLink');
        if (!menu || !link) return;
        if (!menu.contains(e.target) && !link.contains(e.target)) {
            hideHeaderMenu();
        }
    });

    // Handle browser back/forward buttons
    window.addEventListener('popstate', (e) => {
        const urlParams = getURLParams();
        applyCitySelection(urlParams.city);
        if (urlParams.neighborhood) {
            const filterSelect = document.getElementById('filterNeighborhood');
            if (filterSelect) {
                filterSelect.value = urlParams.neighborhood;
                displayResults(urlParams.city, urlParams.neighborhood);
            }
        }
    });

    // Form submission
    document.getElementById('ratingForm').addEventListener('submit', handleFormSubmit);
}

// Initialize application
function initApp() {
    // Verify data is loaded
    if (!cityNeighborhoods || Object.keys(cityNeighborhoods).length === 0) {
        console.error('cityNeighborhoods data not loaded', cityNeighborhoods);
        showToast('Грешка: данните за градовете не са заредени', 'error');
        return;
    }
    
    // Read URL parameters
    const urlParams = getURLParams();
    currentCity = urlParams.city;
    
    // Set city selector to current city
    const citySelect = document.getElementById('citySelect');
    if (citySelect) {
        citySelect.value = currentCity;
    }
    
    const filterCitySelect = document.getElementById('filterCity');
    if (filterCitySelect) {
        filterCitySelect.value = currentCity;
    }
    
    initStarRatings();
    buildHeaderCityMenu();
    populateSelectOptions(currentCity, currentCity);
    updateHeaderCity(currentCity);
    setupEventListeners();
    
    // Wait for Firebase SDK to load
    if (typeof firebase !== 'undefined') {
        initFirebase();
    } else {
        console.error('Firebase SDK not loaded');
        showToast('Firebase SDK не е зареден', 'error');
    }
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
