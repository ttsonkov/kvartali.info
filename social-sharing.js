// Social Sharing and Deep Linking functionality

const SocialSharing = {
    init() {
        // Will be called when results are displayed
    },
    
    // Generate share URL for current view
    generateShareURL(neighborhood = null, city = null) {
        const baseURL = window.location.origin;
        const currentCity = city || AppState.getCity();
        const locationType = AppState.getLocationType();
        const citySlug = Utils.transliterate(currentCity);
        
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
        
        // Add neighborhood as query param if provided
        const params = new URLSearchParams();
        if (neighborhood) {
            params.set('q', neighborhood);
        }
        const queryString = params.toString() ? `?${params.toString()}` : '';
        
        return `${baseURL}${path}${queryString}`;
    },
    
    // Generate share text
    generateShareText(neighborhood, rating, city) {
        const locationType = AppState.getLocationType();
        const typeNames = {
            'neighborhood': 'квартал',
            'childcare': 'детска градина',
            'doctors': 'лекар',
            'dentists': 'зъболекар'
        };
        
        const typeName = typeNames[locationType] || 'квартал';
        const ratingText = rating ? ` с рейтинг ${rating}/5.0★` : '';
        
        return `Виж оценките за ${typeName} ${neighborhood} в ${city}${ratingText} - KvartaliEU`;
    },
    
    // Share to Facebook
    shareToFacebook(url, text) {
        const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        window.open(fbUrl, '_blank', 'width=600,height=400');
        
        // Track analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'share', {
                'method': 'Facebook',
                'content_type': 'result',
                'item_id': url
            });
        }
    },
    
    // Share to Twitter
    shareToTwitter(url, text) {
        const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        window.open(twitterUrl, '_blank', 'width=600,height=400');
        
        // Track analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'share', {
                'method': 'Twitter',
                'content_type': 'result',
                'item_id': url
            });
        }
    },
    
    // Copy link to clipboard
    async copyLink(url) {
        try {
            await navigator.clipboard.writeText(url);
            Utils.showToast('Линкът е копиран!', 'success');
            
            // Track analytics
            if (typeof gtag !== 'undefined') {
                gtag('event', 'share', {
                    'method': 'Copy Link',
                    'content_type': 'result',
                    'item_id': url
                });
            }
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = url;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);
            textArea.select();
            
            try {
                document.execCommand('copy');
                Utils.showToast('Линкът е копиран!', 'success');
            } catch (err) {
                Utils.showToast('Грешка при копиране', 'error');
            }
            
            document.body.removeChild(textArea);
        }
    },
    
    // Create share buttons HTML
    createShareButtons(neighborhood, rating, city) {
        const url = this.generateShareURL(neighborhood, city);
        const text = this.generateShareText(neighborhood, rating, city);
        
        return `
            <div class="share-buttons">
                <button class="share-btn share-facebook" onclick="SocialSharing.shareToFacebook('${url}', '${text}')" title="Сподели във Facebook">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                </button>
                <button class="share-btn share-twitter" onclick="SocialSharing.shareToTwitter('${url}', '${text}')" title="Сподели в Twitter">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                </button>
                <button class="share-btn share-copy" onclick="SocialSharing.copyLink('${url}')" title="Копирай линк">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                    </svg>
                </button>
            </div>
        `;
    },
    
    // Handle deep linking on page load
    handleDeepLink() {
        const params = new URLSearchParams(window.location.search);
        const location = params.get('location');
        
        if (location) {
            // Set the location in filter and display results
            const city = AppState.getCity();
            Utils.setElementValue('filterNeighborhood', location);
            
            // Scroll to results
            setTimeout(() => {
                const resultsSection = document.querySelector('.results-section');
                if (resultsSection) {
                    resultsSection.scrollIntoView({ behavior: 'smooth' });
                }
                
                // Display results for this location
                if (typeof displayResults === 'function') {
                    displayResults(city, location);
                }
            }, 500);
        }
    }
};

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        SocialSharing.handleDeepLink();
    });
} else {
    SocialSharing.handleDeepLink();
}

// Expose globally
window.SocialSharing = SocialSharing;
