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

// Global error handlers to surface runtime issues
window.addEventListener('error', (event) => {
    const msg = event?.error?.message || event?.message || 'Неочаквана грешка в страницата';
    console.error('Global error:', event.error || event);
    try { showToast(`Грешка: ${msg}`, 'error'); } catch (_) {}
});

window.addEventListener('unhandledrejection', (event) => {
    const msg = event?.reason?.message || 'Неуловено обещание (Promise) - грешка';
    console.error('Unhandled rejection:', event.reason || event);
    try { showToast(`Грешка: ${msg}`, 'error'); } catch (_) {}
});

let currentCity = "София";
let currentRatings = {};
let currentLocationType = "neighborhood"; // 'neighborhood' or 'childcare'

// Detect if running on kindergarten subdomain
function isKindergartenDomain() {
    const hostname = window.location.hostname.toLowerCase();
    return hostname === 'gradini.kvartali.eu' || hostname === 'www.gradini.kvartali.eu' ||
           hostname === 'gradini.localhost' || hostname === 'www.gradini.localhost';
}

// Detect if running on lekari subdomain
function isDoctorsDomain() {
    const hostname = window.location.hostname.toLowerCase();
    return hostname === 'lekari.kvartali.eu' || hostname === 'www.lekari.kvartali.eu' ||
           hostname === 'lekari.localhost' || hostname === 'www.lekari.localhost';
}

// Vote key includes location type to distinguish childcare from neighborhoods
const makeVoteKey = (city, neighborhood, type = "neighborhood") => `${type}::${city || 'София'}::${neighborhood}`;

// Fallback data in case data.js fails to load
if (typeof cityNeighborhoods === 'undefined') {
    console.warn('data.js not loaded, using fallback data');
    window.cityNeighborhoods = {
        "София": ["Център", "Младост", "Люлин", "Надежда"],
        "Пловдив": ["Център", "Капана", "Гладно поле", "Западен"],
        "Варна": ["Център", "Морска гара", "Младост", "Бриз"],
        "Бургас": ["Море", "Море", "Песчаница", "Разград"],
        "Благоевград": ["Артизан", "Варошин"],
        "Велико Търново": ["Младост", "Парк"],
        "Габрово": ["Артизан", "Младост"],
        "Добрич": ["Артизан", "Младост"],
        "Видин": ["Артизан", "Младост"],
        "Враца": ["Артизан", "Младост"],
        "Разград": ["Артизан", "Младост"],
        "Русе": ["Алеи Възраждане", "Възраждане"],
        "Кюстендил": ["Артизан", "Младост"],
        "Монтана": ["Артизан", "Младост"],
        "Пазарджик": ["Артизан", "Младост"],
        "Перник": ["Артизан", "Младост"],
        "Плевен": ["Център", "Младост"],
        "Сливен": ["Артизан", "Младост"],
        "Смолян": ["Артизан", "Младост"],
        "Стара Загора": ["Център", "Младост"],
        "Търговище": ["Артизан", "Младост"],
        "Хасково": ["Артизан", "Младост"],
        "Шумен": ["Артизан", "Младост"]
    };
}

// Ensure criteria is defined
if (typeof criteria === 'undefined') {
    console.warn('data.js criteria not loaded, using fallback');
    window.criteria = {
        location: 'Локация',
        cleanliness: 'Чистота',
        transport: 'Транспорт',
        buildings: 'Сграден фонд',
        security: 'Сигурност',
        infrastructure: 'Инфраструктура',
        education: 'Училища и ДГ',
        healthcare: 'Здравеопазване',
        shopping: 'Магазини',
        entertainment: 'Забавления'
    };
}

// Ensure allNeighborhoods is defined
if (typeof allNeighborhoods === 'undefined') {
    window.allNeighborhoods = Object.values(cityNeighborhoods).flat();
}

// Ensure childcareNeighborhoods fallback
if (typeof childcareNeighborhoods === 'undefined') {
    console.warn('childcareNeighborhoods not loaded, using empty fallback');
    window.childcareNeighborhoods = {};
    Object.keys(cityNeighborhoods).forEach(city => {
        window.childcareNeighborhoods[city] = [];
    });
}

// Helper functions
const getNeighborhoodsForCity = (city) => {
    if (!city) return allNeighborhoods;
    return cityNeighborhoods[city] || [];
};

// URL management
function updateURL(city, neighborhood = '', type = 'neighborhood') {
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (neighborhood) params.set('neighborhood', neighborhood);
    if (type && type !== 'neighborhood') params.set('type', type);
    
    const newURL = params.toString() ? `?${params.toString()}` : window.location.pathname;
    window.history.pushState({ city, neighborhood, type }, '', newURL);
}

function getURLParams() {
    const params = new URLSearchParams(window.location.search);
    let type = params.get('type') || 'neighborhood';
    
    // Override type based on subdomain
    if (isKindergartenDomain()) {
        type = 'childcare';
    } else if (isDoctorsDomain()) {
        type = 'doctors';
    }
    
    return {
        city: params.get('city') || 'София',
        neighborhood: params.get('neighborhood') || '',
        type: type
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
    updateURL(newCity, currentNeighborhoodFilter, currentLocationType);
}

// Switch between neighborhoods and childcare facilities
function setLocationType(type) {
    console.log('setLocationType called with:', type);
    currentLocationType = type;
    console.log('currentLocationType is now:', currentLocationType);
    
    // Update button states
    document.getElementById('btnNeighborhoods').classList.toggle('active', type === 'neighborhood');
    document.getElementById('btnChildcare').classList.toggle('active', type === 'childcare');
    
    // Update form labels and placeholders
    const neighborhoodLabel = document.getElementById('neighborhoodLabel');
    const neighborhoodPlaceholder = document.getElementById('neighborhoodPlaceholder');
    const filterNeighborhoodPlaceholder = document.getElementById('filterNeighborhoodPlaceholder');
    const opinionTextarea = document.getElementById('opinion');
    const headerSubtitle = document.getElementById('headerSubtitle');
    
    if (type === 'childcare') {
        neighborhoodLabel.textContent = 'Детска градина/ясла:';
        neighborhoodPlaceholder.textContent = 'Изберете детска градина...';
        filterNeighborhoodPlaceholder.textContent = 'Всички детски градини';
        opinionTextarea.placeholder = 'Напишете вашето мнение за детската градина...';
        if (headerSubtitle) {
            headerSubtitle.textContent = `Оцени детските градини и ясли на град ${currentCity} и дай мнение за тях.`;
        }
        // Show childcare criteria, hide neighborhood criteria
        document.getElementById('neighborhoodCriteria').style.display = 'none';
        document.getElementById('childcareCriteria').style.display = 'grid';
    } else {
        neighborhoodLabel.textContent = 'Квартал:';
        neighborhoodPlaceholder.textContent = 'Изберете квартал...';
        filterNeighborhoodPlaceholder.textContent = 'Всички квартали';
        opinionTextarea.placeholder = 'Напишете вашето мнение за квартала...';
        if (headerSubtitle) {
            headerSubtitle.textContent = 'Оценете кварталите на всички областни градове по 10 критерия';
        }
        // Show neighborhood criteria, hide childcare criteria
        document.getElementById('neighborhoodCriteria').style.display = 'grid';
        document.getElementById('childcareCriteria').style.display = 'none';
    }
    
    // Repopulate neighborhood/childcare selectors
    const city = document.getElementById('citySelect').value || currentCity;
    console.log('Repopulating for city:', city, 'with type:', type);
    populateSelectOptions(city, city);
    
    // Clear form
    document.getElementById('neighborhood').value = '';
    document.getElementById('filterNeighborhood').value = '';
    currentRatings = {};
    document.querySelectorAll('.stars span').forEach(star => star.classList.remove('active'));
    
    // Refresh results with current filter city
    const filterCity = document.getElementById('filterCity')?.value || city;
    console.log('Displaying results for city:', filterCity);
    displayResults(filterCity, '');
    
    // Update neighborhood options based on votes
    updateNeighborhoodOptions();

    // Update URL with new type
    updateURL(filterCity, '', type);
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
    // Location type toggle buttons
    const btnNeighborhoods = document.getElementById('btnNeighborhoods');
    const btnChildcare = document.getElementById('btnChildcare');
    
    if (btnNeighborhoods) {
        btnNeighborhoods.addEventListener('click', () => {
            console.log('Switching to neighborhoods');
            setLocationType('neighborhood');
        });
    }
    
    if (btnChildcare) {
        btnChildcare.addEventListener('click', () => {
            console.log('Switching to childcare');
            setLocationType('childcare');
        });
    }

    // City selector change
    document.getElementById('citySelect').addEventListener('change', (e) => {
        applyCitySelection(e.target.value);
    });

    // Neighborhood selector change in form - sync with filter
    document.getElementById('neighborhood').addEventListener('change', (e) => {
        const selectedNeighborhood = e.target.value;
        const currentCity = document.getElementById('citySelect').value;
        
        // Update filter neighborhood selector
        const filterNeighborhood = document.getElementById('filterNeighborhood');
        if (filterNeighborhood && selectedNeighborhood) {
            filterNeighborhood.value = selectedNeighborhood;
            
            // Update results display
            displayResults(currentCity, selectedNeighborhood);
            updateURL(currentCity, selectedNeighborhood);
        }
    });

    // Filter results
    document.getElementById('filterCity').addEventListener('change', (e) => {
        const city = e.target.value || currentCity;
        applyCitySelection(city);
    });

    document.getElementById('filterNeighborhood').addEventListener('change', (e) => {
        const city = document.getElementById('filterCity').value;
        const selectedNeighborhood = e.target.value;
        
        // Sync form neighborhood selector
        const formNeighborhood = document.getElementById('neighborhood');
        if (formNeighborhood && selectedNeighborhood) {
            formNeighborhood.value = selectedNeighborhood;
        }
        
        displayResults(city, selectedNeighborhood);
        updateURL(city, selectedNeighborhood);
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
                if (urlParams.type && urlParams.type !== currentLocationType) {
                    setLocationType(urlParams.type);
                }
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
    
        // Set location type from URL if present
        if (urlParams.type && urlParams.type !== 'neighborhood') {
            currentLocationType = urlParams.type;
        }
    
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
    
        // Apply location type from URL after UI is set up
        if (urlParams.type === 'childcare') {
            setLocationType('childcare');
        }
    
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
