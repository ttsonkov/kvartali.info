// UI Helper functions

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

// Toast notification
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

// Update header city text
function updateHeaderCity(city) {
    const link = document.getElementById('headerCityLink');
    if (link) {
        link.textContent = city;
    }
}

// Header city menu functions
function buildHeaderCityMenu() {
    const menu = document.getElementById('headerCityMenu');
    if (!menu) return;
    
    // Get cityList from cityNeighborhoods object
    const cities = Object.keys(cityNeighborhoods || {});
    
    if (!cities || cities.length === 0) {
        console.error('No cities found in cityNeighborhoods', cityNeighborhoods);
        return;
    }
    
    menu.innerHTML = '';
    cities.forEach(city => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = city;
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            applyCitySelection(city);
        });
        menu.appendChild(btn);
    });
}

function toggleHeaderMenu() {
    const menu = document.getElementById('headerCityMenu');
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
    const menu = document.getElementById('headerCityMenu');
    if (!menu) return;
    menu.classList.remove('show');
    menu.classList.add('hidden');
}

// Update neighborhood select to disable voted ones
function updateNeighborhoodOptions() {
    const select = document.getElementById('neighborhood');
    const city = document.getElementById('citySelect').value || currentCity;
    const options = select.querySelectorAll('option');
    options.forEach(option => {
        if (!option.value) return;
        const key = makeVoteKey(city, option.value, currentLocationType);
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
function populateSelectOptions(formCity = currentCity, filterCity = document.getElementById('filterCity').value) {
    const select1 = document.getElementById('neighborhood');
    const select2 = document.getElementById('filterNeighborhood');

    // Choose data source based on location type
    const dataSource = currentLocationType === 'childcare' ? childcareNeighborhoods : cityNeighborhoods;
    const formNeighborhoods = dataSource[formCity] || [];
    const filterNeighborhoods = dataSource[filterCity] || [];

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

// Display results
function displayResults(cityFilter = '', neighborhoodFilter = '') {
    const container = document.getElementById('resultsContainer');
    
    // Filter ratings
    let filteredRatings = allRatings;
    
    // Filter by location type
    filteredRatings = filteredRatings.filter(r => (r.locationType || 'neighborhood') === currentLocationType);
    
    if (cityFilter) {
        filteredRatings = filteredRatings.filter(r => (r.city || 'София') === cityFilter);
    }
    if (neighborhoodFilter) {
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
        
        if (locationType === 'childcare') {
            // For childcare: only 'overall' rating
            const sum = neighborhoodRatings.reduce((acc, r) => acc + (r.ratings.overall || 0), 0);
            avgRatings.overall = (sum / neighborhoodRatings.length).toFixed(1);
            const totalAvg = parseFloat(avgRatings.overall);
            return { neighborhood, city, neighborhoodRatings, avgRatings, totalAvg, locationType };
        } else {
            // For neighborhoods: 10 criteria
            Object.keys(criteria).forEach(criterion => {
                const sum = neighborhoodRatings.reduce((acc, r) => acc + (r.ratings[criterion] || 0), 0);
                avgRatings[criterion] = (sum / neighborhoodRatings.length).toFixed(1);
            });
            const totalAvg = (Object.values(avgRatings).reduce((a, b) => parseFloat(a) + parseFloat(b), 0) / 10).toFixed(1);
            return { neighborhood, city, neighborhoodRatings, avgRatings, totalAvg: parseFloat(totalAvg), locationType };
        }
    }).sort((a, b) => b.totalAvg - a.totalAvg);

    // Build HTML
    container.innerHTML = '';
    sortedEntries.forEach(({ neighborhood, city, neighborhoodRatings, avgRatings, totalAvg, locationType }) => {
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
        if (locationType === 'childcare') {
            // For childcare: show only overall rating
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
        `;
        container.appendChild(card);
        
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
}
