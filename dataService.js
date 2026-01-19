// Data Service (Single Responsibility - Data Access Layer)
const DataService = {
    // Ensure data is loaded
    init() {
        this._ensureCityNeighborhoods();
        this._ensureCriteria();
        this._ensureAllNeighborhoods();
        this._ensureChildcareNeighborhoods();
    },
    
    _ensureCityNeighborhoods() {
        if (typeof cityNeighborhoods === 'undefined') {
            console.warn('data.js not loaded, using fallback data');
            window.cityNeighborhoods = {
                "София": ["Център", "Младост", "Люлин", "Надежда"],
                "Пловдив": ["Център", "Капана", "Гладно поле", "Западен"],
                "Варна": ["Център", "Морска гара", "Младост", "Бриз"],
                "Бургас": ["Море", "Море", "Песчаница", "Разград"]
            };
        }
    },
    
    _ensureCriteria() {
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
    },
    
    _ensureAllNeighborhoods() {
        if (typeof allNeighborhoods === 'undefined') {
            window.allNeighborhoods = Object.values(cityNeighborhoods).flat();
        }
    },
    
    _ensureChildcareNeighborhoods() {
        if (typeof childcareNeighborhoods === 'undefined') {
            console.warn('childcareNeighborhoods not loaded, using empty fallback');
            window.childcareNeighborhoods = {};
            Object.keys(cityNeighborhoods).forEach(city => {
                window.childcareNeighborhoods[city] = [];
            });
        }
    },
    
    // Data getters
    getCities() {
        return Object.keys(cityNeighborhoods);
    },
    
    getNeighborhoodsForCity(city, type = 'neighborhood') {
        if (type === 'doctors') return []; // Doctors don't use predefined list
        if (!city) return type === 'childcare' ? [] : allNeighborhoods;
        const source = type === 'childcare' ? childcareNeighborhoods : cityNeighborhoods;
        return source[city] || [];
    },
    
    getCriteria() {
        return criteria;
    },
    
    isDataLoaded() {
        return cityNeighborhoods && Object.keys(cityNeighborhoods).length > 0;
    }
};

// Expose globally
window.DataService = DataService;
