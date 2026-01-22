// Generate sitemap.xml for all cities and location types
const cities = [
    "София", "Пловдив", "Варна", "Бургас", "Благоевград", "Велико Търново",
    "Видин", "Враца", "Габрово", "Добрич", "Кърджали", "Кюстендил",
    "Ловеч", "Монтана", "Пазарджик", "Перник", "Плевен", "Разград",
    "Русе", "Силистра", "Сливен", "Смолян", "Стара Загора", "Търговище",
    "Хасково", "Шумен", "Ямбол"
];

const locationTypes = [
    { path: '', name: 'Квартали' },
    { path: '#/detskigradini', name: 'Детски градини' },
    { path: '#/lekari', name: 'Лекари' },
    { path: '#/zabolekari', name: 'Зъболекари' }
];

function generateSitemap() {
    const baseURL = 'https://kvartali.eu';
    const today = new Date().toISOString().split('T')[0];
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    // Add homepage
    xml += '  <url>\n';
    xml += `    <loc>${baseURL}/</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += '    <changefreq>daily</changefreq>\n';
    xml += '    <priority>1.0</priority>\n';
    xml += '  </url>\n';
    
    // Add all city + location type combinations
    cities.forEach(city => {
        locationTypes.forEach(type => {
            const cityParam = city === 'София' ? '' : `?city=${encodeURIComponent(city)}`;
            const url = `${baseURL}${cityParam}${type.path}`;
            
            xml += '  <url>\n';
            xml += `    <loc>${url}</loc>\n`;
            xml += `    <lastmod>${today}</lastmod>\n`;
            xml += '    <changefreq>weekly</changefreq>\n';
            xml += '    <priority>0.8</priority>\n';
            xml += '  </url>\n';
        });
    });
    
    xml += '</urlset>';
    
    return xml;
}

// Generate and log sitemap
const sitemap = generateSitemap();
console.log('Sitemap generated:');
console.log(sitemap);

// For Node.js environment, save to file
if (typeof require !== 'undefined' && require.main === module) {
    const fs = require('fs');
    fs.writeFileSync('sitemap.xml', sitemap, 'utf8');
    console.log('Sitemap saved to sitemap.xml');
}
