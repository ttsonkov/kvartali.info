# Subdomain Configuration

## Overview
The application now supports automatic detection of subdomains:
- `gradini.kvartali.eu` - displays kindergartens (детски градини)
- `doctors.kvartali.eu` - displays doctors (лекари)
- `kvartali.eu` - main site with all options

## How it works

### 1. Automatic Detection
When the application loads on specific subdomains:

**gradini.kvartali.eu** (or www.gradini.kvartali.eu):
- Automatically switches to "childcare" mode (детски градини)
- Updates page title to "Детски градини на България"
- Changes the main heading to "🏫 Детски градини:"
- **Toggle buttons remain visible** for easy navigation

**doctors.kvartali.eu** (or www.doctors.kvartali.eu):
- Automatically switches to "doctors" mode (лекари)
- Updates page title to "Лекари на България"  
- Changes the main heading to "⚕️ Лекари:"
- **Toggle buttons remain visible** for easy navigation

### 2. Modified Files
The following files were updated to support subdomain detection:

- **appController.js**
  - Added `isKindergartenDomain()` and `isDoctorsDomain()` methods
  - Modified `init()` to detect subdomains and apply correct mode
  - Updates page branding based on subdomain
  - Toggle buttons now remain visible on all subdomains

- **main.js**
  - Added `isKindergartenDomain()` and `isDoctorsDomain()` helper functions
  - Updated `getURLParams()` to respect both subdomains

- **utils.js**
  - Updated `getURLParams()` to detect both kindergarten and doctors subdomains

### 3. DNS Configuration
To make this work in production:

1. Add DNS CNAME records:
   ```
   gradini.kvartali.eu → kvartali.eu
   doctors.kvartali.eu → kvartali.eu
   ```

2. Ensure your hosting supports wildcard subdomains or configure specifically:
   - For GitHub Pages: No additional configuration needed with proper CNAME
   - For other hosts: May need to configure subdomain routing

### 4. Testing Locally

To test subdomain detection locally, you can:

1. **Edit hosts file** (Windows: `C:\Windows\System32\drivers\etc\hosts`):
   ```
   127.0.0.1 gradini.kvartali.eu
   127.0.0.1 www.gradini.kvartali.eu
   127.0.0.1 doctors.kvartali.eu
   127.0.0.1 www.doctors.kvartali.eu
   ```

2. **Run local server**:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js http-server
   npx http-server -p 8000
   ```

3. **Access**:
   - Main site: http://kvartali.eu:8000 or http://localhost:8000
   - Kindergartens: http://gradini.kvartali.eu:8000
   - Doctors: http://doctors.kvartali.eu:8000

### 5. Behavior

**On kvartali.eu (main domain):**
- Shows toggle buttons (Квартали / Детски градини / Лекари)
- Default mode: Neighborhoods
- Users can switch between modes

**On gradini.kvartali.eu (kindergarten subdomain):**
- Toggle buttons are visible
- Pre-selected to childcare mode
- Page title: "Детски градини на България"
- Main heading: "🏫 Детски градини: [Град]"
- Users can switch to other modes via buttons

**On doctors.kvartali.eu (doctors subdomain):**
- Toggle buttons are visible
- Pre-selected to doctors mode
- Page title: "Лекари на България"
- Main heading: "⚕️ Лекари: [Град]"
- Users can switch to other modes via buttons

### 6. URL Parameters
URL parameters still work on all domains:
- `?city=Варна` - Select city
- `?neighborhood=ДГ%20№1` - Pre-select kindergarten
- `?type=childcare` - Explicitly set type

On subdomains, the default type is set by the subdomain, but users can still navigate using the toggle buttons.

## Example URLs

- Main site neighborhoods: https://kvartali.eu
- Main site kindergartens: https://kvartali.eu?type=childcare
- Main site doctors: https://kvartali.eu?type=doctors
- Kindergartens subdomain: https://gradini.kvartali.eu
- Doctors subdomain: https://doctors.kvartali.eu
- Specific kindergarten: https://gradini.kvartali.eu?city=София&neighborhood=ДГ%20№1
- Specific doctor: https://doctors.kvartali.eu?city=Варна

## Future Enhancements
Consider adding similar subdomain support for:
- `shkoli.kvartali.eu` - For schools (if added in the future)
