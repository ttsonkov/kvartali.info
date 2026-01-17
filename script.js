// Firebase setup
let firebaseApp;
let db;
let auth;
let currentUser = null;

// Cloud-backed data caches
let allRatings = []; // all ratings from Firestore
let userVotedNeighborhoods = []; // neighborhoods this user has voted

// Load neighborhoods from data
let neighborhoods = [
    "Абдовица",
    "Аерогара",
    "Американски колеж",
    "Банишора",
    "Барите",
    "Батареята",
    "Белите брези",
    "Бенковски",
    "Борово",
    "Ботунец",
    "Бояна",
    "Бункера",
    "Бъкстон",
    "Витоша",
    "Военна рампа",
    "Враждебна",
    "Връбница-1",
    "Връбница-2",
    "Гевгелийски квартал",
    "Гео Милев",
    "Горна баня",
    "Горубляне",
    "Гоце Делчев",
    "Група-Зоопарк",
    "Гърдова глава",
    "Дианабад",
    "Димитър Миленков",
    "Драгалевци",
    "Дружба 1",
    "Дружба 2",
    "Дървеница",
    "Западен парк",
    "Захарна фабрика",
    "Зона Б-18",
    "Зона Б-19",
    "Зона Б-5",
    "Иван Вазов",
    "Изгрев",
    "Изток",
    "Илинден",
    "Илиянци",
    "Искър",
    "Карпузица",
    "Киноцентъра",
    "Княжево",
    "Красна поляна 1",
    "Красна поляна 2",
    "Красна поляна 3",
    "Красно село",
    "Кремиковци",
    "Крива река",
    "Кръстова вада",
    "Лагера",
    "Лев Толстой",
    "Левски В",
    "Левски Г",
    "Лозенец",
    "Люлин vendar",
    "Люлин 1",
    "Люлин 2",
    "Люлин 3",
    "Люлин 4",
    "Люлин 5",
    "Люлин 6",
    "Люлин 7",
    "Люлин 8",
    "Люлин 9",
    "Люлин 10",
    "Малинова долина",
    "Манастирски ливади запад",
    "Манастирски ливади изток",
    "Младост 1",
    "Младост 1А",
    "Младост 2",
    "Младост 3",
    "Младост 4",
    "Модерно предградие",
    "Надежда I",
    "Надежда II",
    "Надежда III",
    "Надежда IV",
    "Обеля",
    "Обеля 2",
    "Овча купел 1",
    "Овча купел 2",
    "Орландовци",
    "Подуяне",
    "Полигона",
    "Разсадник-Коньовица",
    "Република",
    "Света Троица",
    "Свобода",
    "Сердика",
    "Сеславци",
    "Симеоново",
    "Славия",
    "Слатина",
    "Стрелбище",
    "Студентски град",
    "Сухата река",
    "Суходол",
    "Требич",
    "Триъгълника-Надежда",
    "Факултета",
    "Филиповци",
    "Фондови жилища",
    "Фохар",
    "Хаджи Димитър",
    "Хиподрума",
    "Хладилника",
    "Христо Ботев",
    "Христо Смирненски",
    "Център",
    "Челопечене",
    "Чепинско шосе",
    "Южен парк",
    "Яворов"
];

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
document.getElementById('ratingForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!currentUser) {
        showToast('Моля изчакайте автентикация...', 'error');
        return;
    }

    const neighborhood = document.getElementById('neighborhood').value;
    const opinion = document.getElementById('opinion').value.trim();

    // Check if already voted for this neighborhood (server-ground truth)
    if (userVotedNeighborhoods.includes(neighborhood)) {
        showToast('Вече сте гласували за този квартал!', 'error');
        return;
    }

    // Validate all criteria are rated
    const allRatedOk = Object.values(currentRatings).every(rating => rating > 0);
    if (!allRatedOk) {
        showToast('Моля оценете всички критерии!', 'error');
        return;
    }

    const ratingData = {
        neighborhood: neighborhood,
        ratings: { ...currentRatings },
        opinion: opinion,
        userId: currentUser.uid,
        timestamp: new Date().toISOString()
    };

    // Enforce one vote per user per neighborhood via deterministic doc id
    const docId = `${neighborhood}__${currentUser.uid}`;

    try {
        const docRef = db.collection('ratings').doc(docId);
        const existing = await docRef.get();
        if (existing.exists) {
            showToast('Вече сте гласували за този квартал!', 'error');
            updateNeighborhoodOptions();
            return;
        }

        await docRef.set(ratingData);

        // Update local cache of voted neighborhoods for this user
        userVotedNeighborhoods.push(neighborhood);
        updateNeighborhoodOptions();

        // Reset form
        document.getElementById('ratingForm').reset();
        document.getElementById('opinion').value = '';
        Object.keys(currentRatings).forEach(key => currentRatings[key] = 0);
        document.querySelectorAll('.stars').forEach(container => {
            container.querySelectorAll('.star').forEach(star => star.classList.remove('active'));
        });

        showToast('Оценката е запазена успешно!');
        // displayResults() is triggered by the Firestore snapshot listener
    } catch (err) {
        console.error('Error saving rating:', err);
        showToast('Грешка при запис на оценката', 'error');
    }
});

// Display results
function displayResults(filter = '') {
    const container = document.getElementById('resultsContainer');
    
    // Filter ratings
    let filteredRatings = allRatings;
    if (filter) {
        filteredRatings = allRatings.filter(r => r.neighborhood === filter);
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
        if (option.value && userVotedNeighborhoods.includes(option.value)) {
            option.disabled = true;
            if (!option.textContent.includes('(вече гласували)')) {
                option.textContent += ' (вече гласували)';
            }
        }
    });
}

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

// Firestore live updates for results
function attachRatingsListener() {
    db.collection('ratings').onSnapshot(
        (snapshot) => {
            allRatings = snapshot.docs.map(doc => doc.data());
            const currentFilter = document.getElementById('filterNeighborhood').value || '';
            displayResults(currentFilter);
        },
        (error) => {
            console.error('Snapshot error:', error);
        }
    );
}

// Load neighborhoods voted by this user to enforce one-vote
async function loadUserVotes() {
    try {
        const qs = await db.collection('ratings').where('userId', '==', currentUser.uid).get();
        userVotedNeighborhoods = qs.docs.map(doc => doc.data().neighborhood);
        updateNeighborhoodOptions();
    } catch (err) {
        console.error('Error loading user votes:', err);
    }
}

// Initialize Firebase and start app
function initFirebase() {
    try {
        firebaseApp = firebase.initializeApp(window.firebaseConfig);
        db = firebase.firestore();
        auth = firebase.auth();
        auth.signInAnonymously()
            .then((result) => {
                currentUser = result.user;
                // After auth, load user votes, attach results listener, and populate selects
                populateSelectOptions();
                attachRatingsListener();
                loadUserVotes();
            })
            .catch((err) => {
                console.error('Auth error:', err);
                showToast('Грешка при автентикация', 'error');
            });
    } catch (e) {
        console.error('Firebase init error:', e);
        showToast('Грешка при инициализация на Firebase', 'error');
    }
}

initFirebase();
