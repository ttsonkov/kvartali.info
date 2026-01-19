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
        const isDoctors = type === 'doctors';
        
        // Toggle buttons
        const btnNeighborhoods = Utils.getElement('btnNeighborhoods');
        const btnChildcare = Utils.getElement('btnChildcare');
        const btnDoctors = Utils.getElement('btnDoctors');
        if (btnNeighborhoods) btnNeighborhoods.classList.toggle('active', !isChildcare && !isDoctors);
        if (btnChildcare) btnChildcare.classList.toggle('active', isChildcare);
        if (btnDoctors) btnDoctors.classList.toggle('active', isDoctors);
        
        // Show/hide form groups
        const neighborhoodGroup = Utils.getElement('neighborhood')?.closest('.form-group');
        const neighborhoodSelect = Utils.getElement('neighborhood');
        const doctorNameGroup = Utils.getElement('doctorNameGroup');
        const doctorNameField = Utils.getElement('doctorName');
        const specialtyGroup = Utils.getElement('specialtyGroup');
        const specialtyField = Utils.getElement('specialty');
        
        if (neighborhoodGroup) neighborhoodGroup.style.display = isDoctors ? 'none' : 'block';
        if (neighborhoodSelect) neighborhoodSelect.required = !isDoctors;
        
        if (doctorNameGroup) doctorNameGroup.style.display = isDoctors ? 'block' : 'none';
        if (doctorNameField) doctorNameField.required = isDoctors;
        
        if (specialtyGroup) specialtyGroup.style.display = isDoctors ? 'block' : 'none';
        if (specialtyField) specialtyField.required = isDoctors;
        
        // Update labels and placeholders
        const labels = {
            neighborhoodLabel: isChildcare ? 'Детска градина/ясла:' : 'Квартал:',
            neighborhoodPlaceholder: isChildcare ? 'Изберете детска градина...' : 'Изберете квартал...',
            filterNeighborhoodPlaceholder: isDoctors ? 'Всички специалности' : (isChildcare ? 'Всички детски градини' : 'Всички квартали'),
            headerSubtitle: isDoctors
                ? `Оцени лекарите на град ${AppState.getCity()} и дай мнение за тях.`
                : (isChildcare 
                    ? `Оцени детските градини и ясли на град ${AppState.getCity()} и дай мнение за тях.`
                    : 'Оценете кварталите на всички областни градове по 10 критерия')
        };
        
        Object.entries(labels).forEach(([id, text]) => {
            const element = Utils.getElement(id);
            if (element) element.textContent = text;
        });
        
        // Update opinion placeholder
        const opinion = Utils.getElement('opinion');
        if (opinion) {
            opinion.placeholder = isDoctors
                ? 'Напишете вашето мнение за лекаря...'
                : (isChildcare 
                    ? 'Напишете вашето мнение за детската градина...'
                    : 'Напишете вашето мнение за квартала...');
        }
        
        // Toggle criteria sections
        const neighborhoodCriteria = Utils.getElement('neighborhoodCriteria');
        const childcareCriteria = Utils.getElement('childcareCriteria');
        if (neighborhoodCriteria) neighborhoodCriteria.style.display = (isChildcare || isDoctors) ? 'none' : 'grid';
        if (childcareCriteria) childcareCriteria.style.display = (isChildcare || isDoctors) ? 'grid' : 'none';
        
        // Populate specialty dropdown if doctors mode
        if (isDoctors) {
            const specialtySelect = Utils.getElement('specialty');
            if (specialtySelect && typeof medicalSpecialties !== 'undefined') {
                specialtySelect.innerHTML = '<option value="">Изберете специалност...</option>';
                medicalSpecialties.forEach(specialty => {
                    const option = document.createElement('option');
                    option.value = specialty;
                    option.textContent = specialty;
                    specialtySelect.appendChild(option);
                });
            }
            
            // Populate filter dropdown with specialties for doctors
            const filterNeighborhood = Utils.getElement('filterNeighborhood');
            if (filterNeighborhood && typeof medicalSpecialties !== 'undefined') {
                filterNeighborhood.innerHTML = '<option value="" id="filterNeighborhoodPlaceholder">Всички специалности</option>';
                medicalSpecialties.forEach(specialty => {
                    const option = document.createElement('option');
                    option.value = specialty;
                    option.textContent = specialty;
                    filterNeighborhood.appendChild(option);
                });
            }
        }
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
