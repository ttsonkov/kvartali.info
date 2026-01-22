/**
 * Google AdSense Manager
 * Handles dynamic ad insertion and optimization
 */

const AdSenseManager = {
    // Configuration
    publisherId: 'ca-pub-5413114692875335',
    nativeAdSlot: '1111111111', // Replace with actual slot after AdSense approval
    inFeedAdSlot: '2222222222', // Replace with actual slot after AdSense approval
    
    /**
     * Initialize AdSense manager
     */
    init() {
        console.log('AdSense Manager initialized');
        this.setupAdObserver();
    },
    
    /**
     * Insert native ad between results
     * @param {number} position - Position to insert ad (every N items)
     */
    insertNativeAds(position = 5) {
        const resultsContainer = document.getElementById('resultsContainer');
        if (!resultsContainer) return;
        
        const resultCards = resultsContainer.querySelectorAll('.result-card');
        
        // Insert ads every 5 items
        let adsInserted = 0;
        resultCards.forEach((card, index) => {
            if ((index + 1) % position === 0 && index > 0) {
                // Create native ad container
                const adContainer = document.createElement('div');
                adContainer.className = 'native-ad-container';
                adContainer.style.cssText = 'margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px;';
                
                const adUnit = document.createElement('ins');
                adUnit.className = 'adsbygoogle';
                adUnit.style.display = 'block';
                adUnit.setAttribute('data-ad-format', 'fluid');
                adUnit.setAttribute('data-ad-layout-key', '-6t+ed+2i-1n-4w');
                adUnit.setAttribute('data-ad-client', this.publisherId);
                adUnit.setAttribute('data-ad-slot', this.nativeAdSlot);
                
                adContainer.appendChild(adUnit);
                
                // Insert after current card
                card.parentNode.insertBefore(adContainer, card.nextSibling);
                
                // Push ad to AdSense
                try {
                    (adsbygoogle = window.adsbygoogle || []).push({});
                    adsInserted++;
                } catch (e) {
                    console.error('AdSense push error:', e);
                }
            }
        });
        
        console.log(`Inserted ${adsInserted} native ads`);
    },
    
    /**
     * Create in-feed ad unit
     * @returns {HTMLElement} Ad container
     */
    createInFeedAd() {
        const adContainer = document.createElement('div');
        adContainer.className = 'in-feed-ad-container';
        adContainer.style.cssText = 'margin: 30px 0; padding: 20px; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);';
        
        const adLabel = document.createElement('div');
        adLabel.textContent = 'Реклама';
        adLabel.style.cssText = 'font-size: 10px; color: #999; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px;';
        
        const adUnit = document.createElement('ins');
        adUnit.className = 'adsbygoogle';
        adUnit.style.display = 'block';
        adUnit.setAttribute('data-ad-format', 'fluid');
        adUnit.setAttribute('data-ad-layout', 'in-article');
        adUnit.setAttribute('data-ad-client', this.publisherId);
        adUnit.setAttribute('data-ad-slot', this.inFeedAdSlot);
        
        adContainer.appendChild(adLabel);
        adContainer.appendChild(adUnit);
        
        return adContainer;
    },
    
    /**
     * Setup Intersection Observer for lazy loading ads
     */
    setupAdObserver() {
        if (!('IntersectionObserver' in window)) return;
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const adIns = entry.target.querySelector('.adsbygoogle');
                    if (adIns && !adIns.dataset.adsenseLoaded) {
                        try {
                            (adsbygoogle = window.adsbygoogle || []).push({});
                            adIns.dataset.adsenseLoaded = 'true';
                        } catch (e) {
                            console.error('AdSense lazy load error:', e);
                        }
                    }
                    observer.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: '100px'
        });
        
        // Observe all ad containers
        document.querySelectorAll('.native-ad-container, .in-feed-ad-container').forEach(ad => {
            observer.observe(ad);
        });
    },
    
    /**
     * Refresh ads when results are updated
     */
    refreshAds() {
        // Remove existing native ads
        document.querySelectorAll('.native-ad-container, .in-feed-ad-container').forEach(ad => {
            ad.remove();
        });
        
        // Wait for results to render, then insert new ads
        setTimeout(() => {
            this.insertNativeAds(5);
            this.setupAdObserver();
        }, 500);
    },
    
    /**
     * Track ad performance (for analytics)
     * @param {string} adType - Type of ad (native, display, in-feed)
     * @param {string} action - Action (impression, click)
     */
    trackAdPerformance(adType, action) {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'ad_interaction', {
                'ad_type': adType,
                'action': action,
                'timestamp': new Date().toISOString()
            });
        }
    },
    
    /**
     * A/B test different ad positions
     * @returns {number} Optimal position for ad insertion
     */
    getOptimalAdPosition() {
        // Store user variant in localStorage
        let variant = localStorage.getItem('ad_position_variant');
        
        if (!variant) {
            // Randomly assign variant (A: every 5, B: every 7, C: every 3)
            const variants = [3, 5, 7];
            variant = variants[Math.floor(Math.random() * variants.length)];
            localStorage.setItem('ad_position_variant', variant);
        }
        
        return parseInt(variant);
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AdSenseManager.init());
} else {
    AdSenseManager.init();
}
