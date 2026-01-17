// Data storage
let ratings = JSON.parse(localStorage.getItem('neighborhoodRatings')) || [];

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
        timestamp: new Date().toISOString()
    };
    
    ratings.push(ratingData);
    localStorage.setItem('neighborhoodRatings', JSON.stringify(ratings));
    
    // Reset form
    document.getElementById('ratingForm').reset();
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
        
        const card = document.createElement('div');
        card.className = 'neighborhood-card';
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
        `;
        container.appendChild(card);
    });
}

// Filter results
document.getElementById('filterNeighborhood').addEventListener('change', (e) => {
    displayResults(e.target.value);
});

// Clear all data
document.getElementById('clearData').addEventListener('click', () => {
    if (confirm('Сигурни ли сте, че искате да изтриете всички данни?')) {
        ratings = [];
        localStorage.removeItem('neighborhoodRatings');
        displayResults();
        showToast('Всички данни са изтрити');
    }
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

// Initial display
displayResults();
