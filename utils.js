// Utility Functions (DRY Principle)
const Utils = {
    // Transliteration map for Bulgarian to Latin
    translitMap: {
        'А': 'A', 'а': 'a', 'Б': 'B', 'б': 'b', 'В': 'V', 'в': 'v',
        'Г': 'G', 'г': 'g', 'Д': 'D', 'д': 'd', 'Е': 'E', 'е': 'e',
        'Ж': 'Zh', 'ж': 'zh', 'З': 'Z', 'з': 'z', 'И': 'I', 'и': 'i',
        'Й': 'Y', 'й': 'y', 'К': 'K', 'к': 'k', 'Л': 'L', 'л': 'l',
        'М': 'M', 'м': 'm', 'Н': 'N', 'н': 'n', 'О': 'O', 'о': 'o',
        'П': 'P', 'п': 'p', 'Р': 'R', 'р': 'r', 'С': 'S', 'с': 's',
        'Т': 'T', 'т': 't', 'У': 'U', 'у': 'u', 'Ф': 'F', 'ф': 'f',
        'Х': 'H', 'х': 'h', 'Ц': 'Ts', 'ц': 'ts', 'Ч': 'Ch', 'ч': 'ch',
        'Ш': 'Sh', 'ш': 'sh', 'Щ': 'Sht', 'щ': 'sht', 'Ъ': 'A', 'ъ': 'a',
        'Ь': 'Y', 'ь': 'y', 'Ю': 'Yu', 'ю': 'yu', 'Я': 'Ya', 'я': 'ya'
    },
    
    // Reverse map for Latin to Bulgarian
    cyrillicMap: {
        'sofia': 'София', 'sofiya': 'София', // Both variants for Sofia
        'plovdiv': 'Пловдив', 'varna': 'Варна',
        'burgas': 'Бургас', 'ruse': 'Русе', 'stara-zagora': 'Стара Загора',
        'pleven': 'Плевен', 'sliven': 'Сливен', 'dobrich': 'Добрич',
        'shumen': 'Шумен', 'pernik': 'Перник', 'haskovo': 'Хасково',
        'yambol': 'Ямбол', 'pazardzhik': 'Пазарджик', 'blagoevgrad': 'Благоевград',
        'veliko-tarnovo': 'Велико Търново', 'vratsa': 'Враца', 'gabrovo': 'Габрово',
        'asenovgrad': 'Асеновград', 'vidin': 'Видин', 'kazanlak': 'Казанлък',
        'kyustendil': 'Кюстендил', 'kardzhali': 'Кърджали', 'montana': 'Монтана',
        'dimitrovgrad': 'Димитровград', 'targovishte': 'Търговище', 'lovech': 'Ловеч',
        'silistra': 'Силистра', 'razgrad': 'Разград', 'smolyan': 'Смолян'
    },
    
    // Transliterate Bulgarian to Latin (URL-safe)
    transliterate(text) {
        if (!text) return '';
        // Special case for Sofia to use 'sofia' instead of 'sofiya'
        if (text === 'София') return 'sofia';
        
        return text.split('').map(char => this.translitMap[char] || char).join('')
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
    },
    
    // Convert Latin slug back to Cyrillic
    detransliterate(slug) {
        if (!slug) return 'София';
        return this.cyrillicMap[slug.toLowerCase()] || 'София';
    },
    // DOM Helper
    getElement(id) {
        return document.getElementById(id);
    },
    
    getElementValue(id) {
        const element = this.getElement(id);
        return element ? element.value : null;
    },
    
    setElementValue(id, value) {
        const element = this.getElement(id);
        if (element) element.value = value;
    },
    
    // Vote key generator
    makeVoteKey(city, neighborhood, type = 'neighborhood') {
        return `${type}::${city || 'София'}::${neighborhood}`;
    },
    
    // URL Management - Simplified clean URLs
    updateURL(city, neighborhood = '', type = 'neighborhood') {
        const citySlug = this.transliterate(city || 'София');
        let path = '/';
        
        // Build path based on type
        if (type === 'childcare') {
            path = `/detskigradini/${citySlug}`;
        } else if (type === 'doctors') {
            path = `/lekari/${citySlug}`;
        } else if (type === 'dentists') {
            path = `/zabolekari/${citySlug}`;
        } else {
            path = `/${citySlug}`;
        }
        
        // Add neighborhood as query param if exists
        const params = new URLSearchParams();
        if (neighborhood) params.set('q', neighborhood);
        const queryString = params.toString() ? `?${params.toString()}` : '';
        
        const newURL = `${path}${queryString}`;
        window.history.pushState({ city, neighborhood, type }, '', newURL);
    },
    
    getURLParams() {
        const path = window.location.pathname;
        const params = new URLSearchParams(window.location.search);
        
        let type = 'neighborhood';
        let city = 'София';
        
        // Parse path for type and city
        const pathParts = path.split('/').filter(p => p);
        
        if (pathParts.length === 0) {
            // Root - neighborhoods in Sofia
            type = 'neighborhood';
            city = 'София';
        } else if (pathParts[0] === 'detskigradini') {
            type = 'childcare';
            city = pathParts[1] ? this.detransliterate(pathParts[1]) : 'София';
        } else if (pathParts[0] === 'lekari') {
            type = 'doctors';
            city = pathParts[1] ? this.detransliterate(pathParts[1]) : 'София';
        } else if (pathParts[0] === 'zabolekari') {
            type = 'dentists';
            city = pathParts[1] ? this.detransliterate(pathParts[1]) : 'София';
        } else {
            // City slug only - neighborhoods
            type = 'neighborhood';
            city = this.detransliterate(pathParts[0]);
        }
        
        // Get neighborhood from query param
        const neighborhood = params.get('q') || '';
        
        return {
            city: city,
            neighborhood: neighborhood,
            type: type
        };
    },
    
    // Toast notification
    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        if (type === 'error') {
            toast.style.background = '#dc3545';
        }
        document.body.appendChild(toast);
        
        setTimeout(() => toast.remove(), 3000);
    },
    
    // Debounce function for performance optimization
    debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Throttle function for scroll/resize events
    throttle(func, limit = 100) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

// Expose globally
window.Utils = Utils;
