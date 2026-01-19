// Firebase and data management

// Firebase setup
let firebaseApp;
let db;
let auth;
let currentUser = null;

// Cloud-backed data caches
let allRatings = [];
let userVotedNeighborhoods = [];

// Firestore live updates for results
function attachRatingsListener() {
    db.collection('ratings').onSnapshot(
        (snapshot) => {
            allRatings = snapshot.docs.map(doc => doc.data());
            const currentCityFilter = Utils.getElementValue('filterCity') || AppState.getCity();
            const currentNeighborhoodFilter = Utils.getElementValue('filterNeighborhood') || '';
            displayResults(currentCityFilter, currentNeighborhoodFilter);
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
        userVotedNeighborhoods = qs.docs.map(doc => {
            const data = doc.data();
            const locationType = data.locationType || 'neighborhood';
            return Utils.makeVoteKey(data.city || 'София', data.neighborhood, locationType);
        });
        updateNeighborhoodOptions();
    } catch (err) {
        console.error('Error loading user votes:', err);
    }
}

// Initialize Firebase and start app
function initFirebase() {
    try {
        if (!window.firebaseConfig || !window.firebaseConfig.apiKey) {
            Utils.showToast('Firebase конфигурацията не е заредена', 'error');
            console.error('Missing firebase config');
            return;
        }
        
        firebaseApp = firebase.initializeApp(window.firebaseConfig);
        db = firebase.firestore();
        auth = firebase.auth();
        
        auth.signInAnonymously()
            .then((result) => {
                currentUser = result.user;
                console.log('Auth successful:', currentUser.uid);
                // After auth, set initial city state, load votes, attach listener
                const urlParams = Utils.getURLParams();
                AppController.selectCity(urlParams.city);
                
                // Apply neighborhood filter if present in URL
                if (urlParams.neighborhood) {
                    const filterSelect = Utils.getElement('filterNeighborhood');
                    if (filterSelect) {
                        filterSelect.value = urlParams.neighborhood;
                        displayResults(urlParams.city, urlParams.neighborhood);
                    }
                }
                
                attachRatingsListener();
                loadUserVotes();
            })
            .catch((err) => {
                console.error('Auth error:', err);
                console.error('Error code:', err.code);
                console.error('Error message:', err.message);
                Utils.showToast(`Грешка при автентикация: ${err.message}`, 'error');
            });
    } catch (e) {
        console.error('Firebase init error:', e);
        Utils.showToast(`Грешка при инициализация на Firebase: ${e.message}`, 'error');
    }
}

// Form submission handler
async function handleFormSubmit(e) {
    e.preventDefault();

    if (!currentUser) {
        Utils.showToast('Моля изчакайте автентикация...', 'error');
        return;
    }

    const city = Utils.getElementValue('citySelect') || AppState.getCity();
    AppState.setCity(city);
    const locationType = AppState.getLocationType();
    let neighborhood = '';
    
    // Get neighborhood based on location type
    if (locationType === 'doctors') {
        const doctorName = Utils.getElementValue('doctorName');
        const specialty = Utils.getElementValue('specialty');
        console.log('Doctor data:', { doctorName, specialty });
        if (!doctorName || !specialty) {
            Utils.showToast('Моля въведете име на лекар и специалност!', 'error');
            return;
        }
        neighborhood = `${doctorName} (${specialty})`;
    } else {
        neighborhood = Utils.getElementValue('neighborhood');
        if (!neighborhood) {
            const message = locationType === 'childcare' 
                ? 'Моля изберете детска градина!' 
                : 'Моля изберете квартал!';
            Utils.showToast(message, 'error');
            return;
        }
    }
    
    const opinion = Utils.getElementValue('opinion')?.trim() || '';

    // Check if already voted for this neighborhood (server-ground truth)
    const voteKey = Utils.makeVoteKey(city, neighborhood, locationType);
    if (userVotedNeighborhoods.includes(voteKey)) {
        const message = locationType === 'doctors' 
            ? 'Вече сте гласували за този лекар!'
            : (locationType === 'childcare' 
                ? 'Вече сте гласували за тази детска градина!' 
                : 'Вече сте гласували за този квартал!');
        Utils.showToast(message, 'error');
        return;
    }

    // Check if at least something is provided (ratings or opinion)
    const ratings = AppState.getRatings();
    const ratingValues = Object.values(ratings);
    const ratedCount = ratingValues.filter(rating => rating > 0).length;
    
    console.log('Submitting rating:', { locationType, ratings, ratingValues, ratedCount });
    
    // For childcare and doctors: need 1 rating (overall), for neighborhoods: need all 10
    const expectedCriteria = (locationType === 'childcare' || locationType === 'doctors') ? 1 : 10;
    const allRated = ratedCount === expectedCriteria;
    const noneRated = ratedCount === 0;
    
    if (!allRated && !noneRated) {
        const message = (locationType === 'childcare' || locationType === 'doctors')
            ? 'Моля оценете или не оценявайте нито едно!'
            : 'Моля оценете всички 10 критерия или не оценявайте нито един!';
        Utils.showToast(message, 'error');
        return;
    }
    
    if (noneRated && !opinion) {
        Utils.showToast('Моля оценете критериите или напишете мнение!', 'error');
        return;
    }

    const ratingData = {
        city: city,
        neighborhood: neighborhood,
        locationType: AppState.getLocationType(),
        ratings: ratings,
        opinion: opinion,
        userId: currentUser.uid,
        timestamp: new Date().toISOString()
    };

    // Enforce one vote per user per neighborhood via deterministic doc id
    // Include locationType in the ID to keep childcare and neighborhood ratings separate
    const docId = `${encodeURIComponent(AppState.getLocationType())}__${encodeURIComponent(city)}__${encodeURIComponent(neighborhood)}__${currentUser.uid}`;

    try {
        const docRef = db.collection('ratings').doc(docId);
        const existing = await docRef.get();
        if (existing.exists) {
            const message = locationType === 'doctors' 
                ? 'Вече сте гласували за този лекар!'
                : (locationType === 'childcare' 
                    ? 'Вече сте гласували за тази детска градина!' 
                    : 'Вече сте гласували за този квартал!');
            Utils.showToast(message, 'error');
            updateNeighborhoodOptions();
            return;
        }

        await docRef.set(ratingData);

        // Update local cache of voted neighborhoods for this user
        userVotedNeighborhoods.push(voteKey);
        updateNeighborhoodOptions();

        // Reset form
        UIController.clearForm();

        // Preserve selected city in the UI after save
        UIController.updateCityDisplay(city);
        // Repopulate options for the preserved city context
        try {
            if (locationType !== 'doctors') {
                populateSelectOptions(city, city);
                updateNeighborhoodOptions();
                // Preserve selected neighborhood in both form and filter
                UIController.updateNeighborhoodDisplay(neighborhood);
            }
            // Refresh results and URL
            displayResults(city, '');
            Utils.updateURL(city, '', locationType);
        } catch (e) {
            console.warn('Post-save UI refresh warning:', e);
        }

        Utils.showToast('Оценката е запазена успешно!');
        // displayResults() is triggered by the Firestore snapshot listener
    } catch (err) {
        console.error('Error saving rating:', err);
        Utils.showToast('Грешка при запис на оценката', 'error');
    }
}
