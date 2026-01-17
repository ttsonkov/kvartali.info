// Data storage
let ratings = JSON.parse(localStorage.getItem('neighborhoodRatings')) || [];

// Voted neighborhoods (stored per browser)
let votedNeighborhoods = JSON.parse(localStorage.getItem('votedNeighborhoods')) || [];

// Load neighborhoods from JSON
let neighborhoods = [];

// Criteria configuration
const criteria = {
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

// Current form ratings
let currentRatings = {};

// Initialize star ratings
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

// Form submission
document.getElementById('ratingForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const neighborhood = document.getElementById('neighborhood').value;
    const opinion = document.getElementById('opinion').value.trim();
    
    // Check if already voted for this neighborhood
    if (votedNeighborhoods.includes(neighborhood)) {
        showToast('Вече сте гласували за този квартал!', 'error');
        return;
    }
    
    // Validate all criteria are rated
    const allRated = Object.values(currentRatings).every(rating => rating > 0);
    if (!allRated) {
        showToast('Моля оценете всички критерии!', 'error');
        return;
    }
    
    // Save rating
    const ratingData = {
        id: Date.now(),
        neighborhood: neighborhood,
        ratings: { ...currentRatings },
        opinion: opinion,
        timestamp: new Date().toISOString()
    };
    
    ratings.push(ratingData);
    localStorage.setItem('neighborhoodRatings', JSON.stringify(ratings));
    
    // Mark as voted
    votedNeighborhoods.push(neighborhood);
    localStorage.setItem('votedNeighborhoods', JSON.stringify(votedNeighborhoods));
    
    // Disable the voted neighborhood
    updateNeighborhoodOptions();
    
    // Reset form
    document.getElementById('ratingForm').reset();
    document.getElementById('opinion').value = '';
    Object.keys(currentRatings).forEach(key => currentRatings[key] = 0);
    document.querySelectorAll('.stars').forEach(container => {
        container.querySelectorAll('.star').forEach(star => star.classList.remove('active'));
    });
    
    showToast('Оценката е запазена успешно!');
    displayResults();
});

// Display results
function displayResults(filter = '') {
    const container = document.getElementById('resultsContainer');
    
    // Filter ratings
    let filteredRatings = ratings;
    if (filter) {
        filteredRatings = ratings.filter(r => r.neighborhood === filter);
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
    
    // Build HTML
    container.innerHTML = '';
    Object.entries(grouped).forEach(([neighborhood, neighborhoodRatings]) => {
        const avgRatings = {};
        Object.keys(criteria).forEach(criterion => {
            const sum = neighborhoodRatings.reduce((acc, r) => acc + r.ratings[criterion], 0);
            avgRatings[criterion] = (sum / neighborhoodRatings.length).toFixed(1);
        });
        
        const totalAvg = (Object.values(avgRatings).reduce((a, b) => parseFloat(a) + parseFloat(b), 0) / 10).toFixed(1);
        
        // Get opinions
        const opinions = neighborhoodRatings.filter(r => r.opinion).map(r => r.opinion);
        
        const card = document.createElement('div');
        card.className = 'neighborhood-card';
        let opinionHTML = '';
        if (opinions.length > 0) {
            opinionHTML = `
                <div class="opinions-section">
                    <h4>Мнения:</h4>
                    <ul class="opinions-list">
                        ${opinions.map(op => `<li>"${op}"</li>`).join('')}
                    </ul>
                </div>
            `;
        }
        
        card.innerHTML = `
            <h3>${neighborhood} (${neighborhoodRatings.length} ${neighborhoodRatings.length === 1 ? 'оценка' : 'оценки'})</h3>
            <div class="rating-grid">
                ${Object.entries(criteria).map(([key, name]) => `
                    <div class="rating-item">
                        <span>${name}:</span>
                        <span>${avgRatings[key]} ★</span>
                    </div>
                `).join('')}
            </div>
            <div class="average-score">Среден рейтинг: ${totalAvg} / 5.0 ★</div>
            ${opinionHTML}
        `;
        container.appendChild(card);
    });
}

// Filter results
document.getElementById('filterNeighborhood').addEventListener('change', (e) => {
    displayResults(e.target.value);
});

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

// Update neighborhood select to disable voted ones
function updateNeighborhoodOptions() {
    const select = document.getElementById('neighborhood');
    const options = select.querySelectorAll('option');
    options.forEach(option => {
        if (option.value && votedNeighborhoods.includes(option.value)) {
            option.disabled = true;
            option.textContent += ' (вече гласували)';
        }
    });
}

// Initial display
updateNeighborhoodOptions();
displayResults();

// Load neighborhoods from JSON file
fetch('neighborhoods.json')
    .then(response => response.json())
    .then(data => {
        neighborhoods = data.neighborhoods;
        populateSelectOptions();
    })
    .catch(err => console.error('Error loading neighborhoods:', err));

// Populate select options dynamically
function populateSelectOptions() {
    const select1 = document.getElementById('neighborhood');
    const select2 = document.getElementById('filterNeighborhood');
    
    // Clear existing options (keep the first placeholder option)
    while (select1.options.length > 1) {
        select1.remove(1);
    }
    while (select2.options.length > 1) {
        select2.remove(1);
    }
    
    // Add neighborhood options
    neighborhoods.forEach(neighborhood => {
        const opt1 = document.createElement('option');
        opt1.value = neighborhood;
        opt1.textContent = neighborhood;
        select1.appendChild(opt1);
        
        const opt2 = document.createElement('option');
        opt2.value = neighborhood;
        opt2.textContent = neighborhood;
        select2.appendChild(opt2);
    });
    
    updateNeighborhoodOptions();
}
