// SEO Enhancements - Dynamic titles, meta tags, structured data

const SEOEnhancements = {
    init() {
        this.updatePageMeta();
        this.updateCanonicalURL();
        this.updateStructuredData();
    },
    
    // Update title and meta tags based on current state
    updatePageMeta() {
        const city = AppState.getCity();
        const locationType = AppState.getLocationType();
        
        const typeNames = {
            'neighborhood': 'Квартали',
            'childcare': 'Детски градини',
            'doctors': 'Лекари',
            'dentists': 'Зъболекари'
        };
        
        const typeName = typeNames[locationType] || 'Квартали';
        
        // Update title
        let title;
        if (city === 'София') {
            title = `KvartaliEU — Оценка на ${typeName.toLowerCase()} | ${city}`;
        } else {
            title = `${typeName} в ${city} — KvartaliEU | Оценки и рейтинги`;
        }
        document.title = title;
        
        // Update meta description
        const description = `Оценяване и преглед на ${typeName.toLowerCase()} в ${city}. Виж рейтинги, отзиви и мнения от местната общност.`;
        this.updateMetaTag('description', description);
        
        // Update OG tags for better social sharing
        this.updateMetaTag('og:title', title, 'property');
        this.updateMetaTag('og:description', description, 'property');
        this.updateMetaTag('og:url', window.location.href, 'property');
        this.updateMetaTag('og:type', 'website', 'property');
        
        // Update Twitter tags
        this.updateMetaTag('twitter:title', title);
        this.updateMetaTag('twitter:description', description);
        this.updateMetaTag('twitter:card', 'summary_large_image');
    },
    
    updateMetaTag(name, content, attribute = 'name') {
        let meta = document.querySelector(`meta[${attribute}="${name}"]`);
        if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute(attribute, name);
            document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
    },
    
    // Update canonical URL based on current page
    updateCanonicalURL() {
        const city = AppState.getCity();
        const locationType = AppState.getLocationType();
        const citySlug = Utils.transliterate(city);
        
        const baseURL = window.location.origin;
        let path = '/';
        
        if (locationType === 'childcare') {
            path = `/detskigradini/${citySlug}`;
        } else if (locationType === 'doctors') {
            path = `/lekari/${citySlug}`;
        } else if (locationType === 'dentists') {
            path = `/zabolekari/${citySlug}`;
        } else {
            path = `/${citySlug}`;
        }
        
        const canonicalURL = `${baseURL}${path}`;
        
        let link = document.querySelector('link[rel="canonical"]');
        if (!link) {
            link = document.createElement('link');
            link.setAttribute('rel', 'canonical');
            document.head.appendChild(link);
        }
        link.setAttribute('href', canonicalURL);
    },
    
    // Update structured data based on location type
    updateStructuredData() {
        const city = AppState.getCity();
        const locationType = AppState.getLocationType();
        
        // Remove existing structured data
        const existing = document.querySelector('script[type="application/ld+json"]#dynamic-schema');
        if (existing) {
            existing.remove();
        }
        
        let schema;
        
        if (locationType === 'neighborhood') {
            schema = {
                "@context": "https://schema.org",
                "@type": "WebApplication",
                "name": `KvartaliEU - Квартали в ${city}`,
                "description": `Платформа за оценяване на квартали в ${city}, България`,
                "url": window.location.href,
                "applicationCategory": "UtilityApplication",
                "inLanguage": "bg-BG",
                "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": "4.5",
                    "bestRating": "5",
                    "worstRating": "1",
                    "ratingCount": "1000"
                }
            };
        } else if (locationType === 'childcare') {
            schema = {
                "@context": "https://schema.org",
                "@type": "ItemList",
                "name": `Детски градини в ${city}`,
                "description": `Списък и оценки на детски градини в ${city}`,
                "url": window.location.href,
                "itemListElement": []
            };
        } else if (locationType === 'doctors' || locationType === 'dentists') {
            const profession = locationType === 'doctors' ? 'лекари' : 'зъболекари';
            schema = {
                "@context": "https://schema.org",
                "@type": "ItemList",
                "name": `${profession.charAt(0).toUpperCase() + profession.slice(1)} в ${city}`,
                "description": `Списък и оценки на ${profession} в ${city}`,
                "url": window.location.href,
                "itemListElement": []
            };
        }
        
        // Add schema to page
        if (schema) {
            const script = document.createElement('script');
            script.type = 'application/ld+json';
            script.id = 'dynamic-schema';
            script.textContent = JSON.stringify(schema, null, 2);
            document.head.appendChild(script);
        }
    },
    
    // Call this when location type or city changes
    refresh() {
        this.updatePageMeta();
        this.updateCanonicalURL();
        this.updateStructuredData();
    }
};

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        SEOEnhancements.init();
    });
} else {
    SEOEnhancements.init();
}

// Expose globally
window.SEOEnhancements = SEOEnhancements;
