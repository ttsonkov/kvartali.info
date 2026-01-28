// UI Helper functions

// Debounced ad refresh function
const debouncedRefreshAds = Utils?.debounce(() => {
    if (typeof AdSenseManager !== 'undefined') {
        AdSenseManager.refreshAds();
    }
}, CONFIG?.AD_REFRESH_DEBOUNCE || 1000);

// Update star display
function updateStars(container, rating) {
    const stars = container.querySelectorAll('.star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

// Update header city text
function updateHeaderCity(city) {
    const link = Utils.getElement('headerCityLink');
    if (link) {
        link.textContent = city;
    }
}
if (typeof window !== 'undefined') {
    window.updateHeaderCity = updateHeaderCity;
}

// Header city menu functions
function buildHeaderCityMenu() {
    const menu = Utils.getElement('headerCityMenu');
    if (!menu) return;
    
    // Get cityList from DataService
    const cities = DataService.getCities();
    
    if (!cities || cities.length === 0) {
        console.error('No cities found');
        return;
    }
    
    menu.innerHTML = '';
    cities.forEach(city => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = city;
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            AppController.selectCity(city);
        });
        menu.appendChild(btn);
    });
}

function toggleHeaderMenu() {
    const menu = Utils.getElement('headerCityMenu');
    if (!menu) return;
    const isShown = menu.classList.contains('show');
    if (isShown) {
        hideHeaderMenu();
    } else {
        menu.classList.remove('hidden');
        menu.classList.add('show');
    }
}

function hideHeaderMenu() {
    const menu = Utils.getElement('headerCityMenu');
    if (!menu) return;
    menu.classList.remove('show');
    menu.classList.add('hidden');
}

// Update neighborhood select to disable voted ones
function updateNeighborhoodOptions() {
    const select = Utils.getElement('neighborhood');
    const city = Utils.getElementValue('citySelect') || AppState.getCity();
    const options = select.querySelectorAll('option');
    options.forEach(option => {
        if (!option.value) return;
        const key = Utils.makeVoteKey(city, option.value, AppState.getLocationType());
        if (userVotedNeighborhoods.includes(key)) {
            option.disabled = true;
            if (!option.textContent.includes('(Вече сте гласували)')) {
                option.textContent += ' (Вече сте гласували)';
            }
        } else {
            option.disabled = false;
            option.textContent = option.textContent.replace(' (Вече сте гласували)', '');
        }
    });
}

// Populate select options dynamically
function populateSelectOptions(formCity = AppState.getCity(), filterCity = Utils.getElementValue('filterCity')) {
    const select1 = Utils.getElement('neighborhood');
    const select2 = Utils.getElement('filterNeighborhood');

    // Skip populating if in doctors or dentists mode
    if (AppState.getLocationType() === 'doctors' || AppState.getLocationType() === 'dentists') {
        return;
    }

    // Get neighborhoods from DataService based on location type
    const formNeighborhoods = DataService.getNeighborhoodsForCity(formCity, AppState.getLocationType());
    const filterNeighborhoods = DataService.getNeighborhoodsForCity(filterCity, AppState.getLocationType());

    // Clear existing options (keep the first placeholder option)
    while (select1.options.length > 1) {
        select1.remove(1);
    }
    while (select2.options.length > 1) {
        select2.remove(1);
    }

    formNeighborhoods.forEach(neighborhood => {
        const opt1 = document.createElement('option');
        opt1.value = neighborhood;
        opt1.textContent = neighborhood;
        select1.appendChild(opt1);
    });

    filterNeighborhoods.forEach(neighborhood => {
        const opt2 = document.createElement('option');
        opt2.value = neighborhood;
        opt2.textContent = neighborhood;
        select2.appendChild(opt2);
    });

    updateNeighborhoodOptions();
}

// Display results with sorting and advanced filtering
let lazyLoadObserver = null; // Store observer to prevent memory leaks

function displayResults(cityFilter = '', neighborhoodFilter = '', sortBy = 'rating-desc', minVotes = 0, minRating = 0) {
    const container = Utils.getElement('resultsContainer');
    
    // Cleanup old observer to prevent memory leaks
    if (lazyLoadObserver) {
        lazyLoadObserver.disconnect();
        lazyLoadObserver = null;
    }
    
    // Show loading state
    container.innerHTML = '<div class="loading-state"><div class="spinner-large"></div><p>Зареждане на резултати...</p></div>';
    
    // Filter ratings
    let filteredRatings = allRatings;
    
    // Filter by location type
    filteredRatings = filteredRatings.filter(r => (r.locationType || 'neighborhood') === AppState.getLocationType());
    
    // Filter by city (but not for shops - they are independent)
    const isShopsMode = AppState.getLocationType() === 'shops';
    if (!isShopsMode) {
        const city = cityFilter || AppState.getCity();
        filteredRatings = filteredRatings.filter(r => (r.city || 'София') === city);
    }
    
    // For doctors mode, filter by specialty if specified
    if (AppState.getLocationType() === 'doctors' && neighborhoodFilter) {
        filteredRatings = filteredRatings.filter(r => {
            // Extract specialty from "Name (Specialty)" format
            const match = r.neighborhood.match(/\(([^)]+)\)$/);
            const specialty = match ? match[1] : '';
            return specialty === neighborhoodFilter;
        });
    } else if (neighborhoodFilter) {
        filteredRatings = filteredRatings.filter(r => r.neighborhood === neighborhoodFilter);
    }
    
    if (filteredRatings.length === 0) {
        container.innerHTML = '<div class="empty-state">Все още няма добавени оценки</div>';
        return;
    }
    
    // Group by neighborhood and calculate averages
    const grouped = {};
    filteredRatings.forEach(rating => {
        if (!grouped[rating.neighborhood]) {
            grouped[rating.neighborhood] = [];
        }
        grouped[rating.neighborhood].push(rating);
    });

    // Sort neighborhoods by total average descending
    const sortedEntries = Object.entries(grouped).map(([neighborhood, neighborhoodRatings]) => {
        const city = neighborhoodRatings[0]?.city || 'София';
        const locationType = neighborhoodRatings[0]?.locationType || 'neighborhood';
        const avgRatings = {};
        
        // Extract specialty for doctors (from "Name (Specialty)" format)
        let specialty = '';
        if (locationType === 'doctors') {
            const match = neighborhood.match(/\(([^)]+)\)$/);
            specialty = match ? match[1] : '';
        }
        
        if (locationType === 'childcare' || locationType === 'doctors' || locationType === 'dentists' || locationType === 'shops') {
            // For childcare, doctors, dentists and shops: only 'overall' rating
            const sum = neighborhoodRatings.reduce((acc, r) => acc + (r.ratings.overall || 0), 0);
            avgRatings.overall = (sum / neighborhoodRatings.length).toFixed(1);
            const totalAvg = parseFloat(avgRatings.overall);
            return { neighborhood, city, neighborhoodRatings, avgRatings, totalAvg, locationType, specialty };
        } else {
            // For neighborhoods: 10 criteria
            Object.keys(criteria).forEach(criterion => {
                const sum = neighborhoodRatings.reduce((acc, r) => acc + (r.ratings[criterion] || 0), 0);
                avgRatings[criterion] = (sum / neighborhoodRatings.length).toFixed(1);
            });
            const totalAvg = (Object.values(avgRatings).reduce((a, b) => parseFloat(a) + parseFloat(b), 0) / 10).toFixed(1);
            return { neighborhood, city, neighborhoodRatings, avgRatings, totalAvg: parseFloat(totalAvg), locationType, specialty };
        }
    }).sort((a, b) => {
        // For doctors, sort by specialty first, then by rating
        if (a.locationType === 'doctors' && b.locationType === 'doctors') {
            if (a.specialty !== b.specialty) {
                return a.specialty.localeCompare(b.specialty, 'bg');
            }
        }
        return b.totalAvg - a.totalAvg;
    });
    
    // Apply advanced filters (min votes and min rating)
    let displayedEntries = sortedEntries.filter(entry => {
        const voteCount = entry.neighborhoodRatings.length;
        const rating = entry.totalAvg;
        return voteCount >= minVotes && rating >= minRating;
    });
    
    // Apply sorting based on user selection
    displayedEntries = applySorting(displayedEntries, sortBy);
    
    // Update results count
    updateResultsCount(displayedEntries.length);
    
    if (displayedEntries.length === 0) {
        container.innerHTML = '<div class="empty-state">Няма резултати, отговарящи на зададените филтри</div>';
        return;
    }
    
    // Special split layout for childcare (CSS only, keep DOM structure)
    if (AppState.getLocationType() === 'childcare') {
        // Add split layout class to parent container
        const mainContent = document.getElementById('main-content');
        if (mainContent && !mainContent.classList.contains('childcare-split-layout')) {
            mainContent.classList.add('childcare-split-layout');
        }
    } else {
        // Remove split layout class if not childcare
        const mainContent = document.getElementById('main-content');
        if (mainContent && mainContent.classList.contains('childcare-split-layout')) {
            mainContent.classList.remove('childcare-split-layout');
        }
    }
    // Default: original layout, but for childcare the CSS will split visually
    container.innerHTML = '';
    const itemsPerPage = 10;
    const totalPages = Math.ceil(displayedEntries.length / itemsPerPage);
    renderResultBatch(displayedEntries.slice(0, itemsPerPage), container);
    if (displayedEntries.length > itemsPerPage) {
        let currentPage = 1;
        const sentinel = document.createElement('div');
        sentinel.className = 'lazy-load-sentinel';
        sentinel.style.height = '20px';
        container.appendChild(sentinel);
        lazyLoadObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && currentPage < totalPages) {
                    const start = currentPage * itemsPerPage;
                    const end = start + itemsPerPage;
                    const batch = displayedEntries.slice(start, end);
                    sentinel.remove();
                    renderResultBatch(batch, container);
                    if (end < displayedEntries.length) {
                        container.appendChild(sentinel);
                    } else {
                        if (lazyLoadObserver) lazyLoadObserver.disconnect();
                    }
                    currentPage++;
                }
            });
        }, { rootMargin: '100px' });
        lazyLoadObserver.observe(sentinel);
    }
    if (typeof AdSenseManager !== 'undefined' && typeof debouncedRefreshAds !== 'undefined') {
        debouncedRefreshAds();
    }
}

// Helper function to render a batch of results
function renderResultBatch(entries, container) {
    entries.forEach(({ neighborhood, city, neighborhoodRatings, avgRatings, totalAvg, locationType }) => {
        const opinions = neighborhoodRatings.filter(r => r.opinion).map(r => r.opinion);
        const card = document.createElement('div');
        card.className = 'neighborhood-card';
        
        // Create neighborhood filter for opinions
        let opinionHTML = '';
        if (opinions.length > 0) {
            const uniqueNeighborhoods = [...new Set(neighborhoodRatings.map(r => r.neighborhood))];
            let opinionFilterHTML = '';
            if (uniqueNeighborhoods.length > 1) {
                opinionFilterHTML = `
                    <div class="opinion-filter">
                        <select class="neighborhood-opinion-filter" data-neighborhood="${neighborhood}">
                            <option value="">Всички мнения</option>
                            ${uniqueNeighborhoods.map(n => `<option value="${n}">${n}</option>`).join('')}
                        </select>
                    </div>
                `;
            }
            
            opinionHTML = `
                <div class="opinions-section">
                    <h4>Мнения:</h4>
                    ${opinionFilterHTML}
                    <ul class="opinions-list" data-neighborhood="${neighborhood}">
                        ${opinions.map((op, idx) => `<li data-neighborhood="${neighborhoodRatings[neighborhoodRatings.findIndex(r => r.opinion === op)]?.neighborhood}">"${op}"</li>`).join('')}
                    </ul>
                </div>
            `;
        }
        
        // Build rating grid based on type
        let ratingGridHTML = '';
        if (locationType === 'childcare' || locationType === 'doctors' || locationType === 'dentists' || locationType === 'shops') {
            // For childcare, doctors, dentists and shops: show only overall rating
            ratingGridHTML = `
                <div class="rating-item">
                    <span>Оценка:</span>
                    <span>${avgRatings.overall} ★</span>
                </div>
            `;
        } else {
            // For neighborhoods: show all 10 criteria
            ratingGridHTML = Object.entries(criteria).map(([key, name]) => `
                <div class="rating-item">
                    <span>${name}:</span>
                    <span>${avgRatings[key]} ★</span>
                </div>
            `).join('');
        }
        
        card.innerHTML = `
            <h3>${neighborhood} — ${city} (${neighborhoodRatings.length} ${neighborhoodRatings.length === 1 ? 'оценка' : 'оценки'})</h3>
            <div class="rating-grid">
                ${ratingGridHTML}
            </div>
            <div class="average-score">Среден рейтинг: ${totalAvg.toFixed(1)} / 5.0 ★</div>
            ${opinionHTML}
            ${SocialSharing.createShareButtons(neighborhood, totalAvg.toFixed(1), city)}
        `;
        container.appendChild(card);
        
        // Add chart toggle button (only for neighborhoods with 10 criteria)
        if (typeof Charts !== 'undefined') {
            Charts.addChartToggle(card, { neighborhood, avgRatings, locationType });
        }
        
        // Add comparison checkbox (only for neighborhoods)
        if (typeof Comparison !== 'undefined') {
            Comparison.addCompareCheckbox(card, { neighborhood, city, avgRatings, totalAvg, neighborhoodRatings, locationType });
        }
        
        // Add event listener for opinion filter
        if (opinions.length > 0) {
            const filterSelect = card.querySelector('.neighborhood-opinion-filter');
            if (filterSelect) {
                filterSelect.addEventListener('change', (e) => {
                    const opinionsList = card.querySelector('.opinions-list');
                    const selectedNeighborhood = e.target.value;
                    const listItems = opinionsList.querySelectorAll('li');
                    listItems.forEach(item => {
                        if (selectedNeighborhood === '' || item.dataset.neighborhood === selectedNeighborhood) {
                            item.style.display = 'list-item';
                        } else {
                            item.style.display = 'none';
                        }
                    });
                });
            }
        }
    });
    
    // Refresh AdSense ads after results are rendered
    if (typeof AdSenseManager !== 'undefined') {
        AdSenseManager.refreshAds();
    }
}
// Apply sorting to entries
function applySorting(entries, sortBy) {
    const sorted = [...entries];
    
    switch(sortBy) {
        case 'rating-desc':
            return sorted.sort((a, b) => b.totalAvg - a.totalAvg);
        case 'rating-asc':
            return sorted.sort((a, b) => a.totalAvg - b.totalAvg);
        case 'votes-desc':
            return sorted.sort((a, b) => b.neighborhoodRatings.length - a.neighborhoodRatings.length);
        case 'votes-asc':
            return sorted.sort((a, b) => a.neighborhoodRatings.length - b.neighborhoodRatings.length);
        case 'name-asc':
            return sorted.sort((a, b) => a.neighborhood.localeCompare(b.neighborhood, 'bg'));
        case 'name-desc':
            return sorted.sort((a, b) => b.neighborhood.localeCompare(a.neighborhood, 'bg'));
        default:
            return sorted;
    }
}

// Update results count display
function updateResultsCount(count) {
    const countElement = Utils.getElement('resultsCount');
    if (countElement) {
        const text = count === 1 ? '1 резултат' : `${count} резултата`;
        countElement.textContent = text;
    }
}

// Get current filter and sort values
function getCurrentFilters() {
    return {
        cityFilter: AppState.getCity(),
        neighborhoodFilter: Utils.getElementValue('filterNeighborhood') || '',
        sortBy: Utils.getElementValue('sortBy') || 'rating-desc',
        minVotes: parseInt(Utils.getElementValue('minVotes') || 0),
        minRating: parseFloat(Utils.getElementValue('minRating') || 0)
    };
}

// Trigger filtered display
function triggerFilteredDisplay() {
    const filters = getCurrentFilters();
    displayResults(
        filters.cityFilter, 
        filters.neighborhoodFilter, 
        filters.sortBy, 
        filters.minVotes, 
        filters.minRating
    );
}