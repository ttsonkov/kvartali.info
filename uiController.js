// UI Controller (Single Responsibility - UI Updates)
const UIController = {
    // Update city display
    updateCityDisplay(city) {

        updateHeaderCity(city);
    },
    
    // Update neighborhood selectors
    updateNeighborhoodDisplay(neighborhood) {
        if (neighborhood) {
            Utils.setElementValue('neighborhood', neighborhood);
            Utils.setElementValue('filterNeighborhood', neighborhood);
        }
    },
    
    // Clear form inputs
    clearForm() {
        const form = Utils.getElement('ratingForm');
        if (form) form.reset();
        Utils.setElementValue('opinion', '');
        AppState.clearRatings();
        document.querySelectorAll('.stars span').forEach(star => 
            star.classList.remove('active')
        );
    },
    
    // Update location type UI
    updateLocationTypeUI(type) {
        const isChildcare = type === 'childcare';
        
        // Toggle buttons
        const btnNeighborhoods = Utils.getElement('btnNeighborhoods');
        const btnChildcare = Utils.getElement('btnChildcare');
        if (btnNeighborhoods) btnNeighborhoods.classList.toggle('active', !isChildcare);
        if (btnChildcare) btnChildcare.classList.toggle('active', isChildcare);
        
        // Update labels and placeholders
        const labels = {
            neighborhoodLabel: isChildcare ? 'Детска градина/ясла:' : 'Квартал:',
            neighborhoodPlaceholder: isChildcare ? 'Изберете детска градина...' : 'Изберете квартал...',
            filterNeighborhoodPlaceholder: isChildcare ? 'Всички детски градини' : 'Всички квартали',
            headerSubtitle: isChildcare 
                ? `Оцени детските градини и ясли на град ${AppState.getCity()} и дай мнение за тях.`
                : 'Оценете кварталите на всички областни градове по 10 критерия'
        };
        
        Object.entries(labels).forEach(([id, text]) => {
            const element = Utils.getElement(id);
            if (element) element.textContent = text;
        });
        
        // Update opinion placeholder
        const opinion = Utils.getElement('opinion');
        if (opinion) {
            opinion.placeholder = isChildcare 
                ? 'Напишете вашето мнение за детската градина...'
                : 'Напишете вашето мнение за квартала...';
        }
        
        // Toggle criteria sections
        const neighborhoodCriteria = Utils.getElement('neighborhoodCriteria');
        const childcareCriteria = Utils.getElement('childcareCriteria');
        if (neighborhoodCriteria) neighborhoodCriteria.style.display = isChildcare ? 'none' : 'grid';
        if (childcareCriteria) childcareCriteria.style.display = isChildcare ? 'grid' : 'none';
    },
    
    // Initialize star ratings
    initStarRatings() {
        document.querySelectorAll('.stars').forEach(starsContainer => {
            const criterion = starsContainer.dataset.criterion;
            AppState.setRating(criterion, 0);
            
            for (let i = 1; i <= 5; i++) {
                const star = document.createElement('span');
                star.className = 'star';
                star.textContent = '★';
                star.dataset.value = i;
                
                star.addEventListener('click', () => {
                    AppState.setRating(criterion, i);
                    updateStars(starsContainer, i);
                });
                
                starsContainer.appendChild(star);
            }
        });
    }
};

// Expose globally
window.UIController = UIController;
