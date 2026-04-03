function initCustomDropdowns() {
    document.querySelectorAll('.custom-dropdown').forEach(dropdown => {
        const header = dropdown.querySelector('.dropdown-header');
        const options = dropdown.querySelector('.dropdown-options');
        const arrow = header.querySelector('.dropdown-arrow');
        const textSpan = header.querySelector('span:first-child');

        header.addEventListener('click', (e) => {
            e.stopPropagation();

            document.querySelectorAll('.custom-dropdown').forEach(other => {
                if (other !== dropdown) {
                    const otherOptions = other.querySelector('.dropdown-options');
                    const otherHeader = other.querySelector('.dropdown-header');
                    const otherArrow = otherHeader.querySelector('.dropdown-arrow');
                    if (otherOptions) otherOptions.classList.remove('show');
                    if (otherHeader) otherHeader.classList.remove('active');
                    if (otherArrow) otherArrow.classList.remove('rotated');
                }
            });

            options.classList.toggle('show');
            header.classList.toggle('active');
            arrow.classList.toggle('rotated');
        });

        dropdown.querySelectorAll('.dropdown-option').forEach(option => {
            option.addEventListener('click', () => {
                const value = option.dataset.value;
                const text = option.textContent;

                dropdown.querySelectorAll('.dropdown-option').forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');

                textSpan.textContent = text;

                options.classList.remove('show');
                header.classList.remove('active');
                arrow.classList.remove('rotated');

                if (dropdown.id === 'primarySortDropdown') {
                    handlePrimarySort(value);
                } else if (dropdown.id === 'secondarySortDropdown') {
                    handleSecondarySort(value);
                } else if (dropdown.id === undefined || dropdown.querySelector('#searchTypeText')) {
                    if (typeof handleSearchTypeChange !== 'undefined') {
                        handleSearchTypeChange(value);
                    }
                }
            });
        });
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-dropdown')) {
            document.querySelectorAll('.custom-dropdown').forEach(dropdown => {
                const options = dropdown.querySelector('.dropdown-options');
                const header = dropdown.querySelector('.dropdown-header');
                const arrow = header.querySelector('.dropdown-arrow');
                if (options) options.classList.remove('show');
                if (header) header.classList.remove('active');
                if (arrow) arrow.classList.remove('rotated');
            });
        }
    });
}

initCustomDropdowns();

let mapCopiesData = {};
let cookiesAccepted = false;

function checkCookieStatus() {
    const consent = localStorage.getItem('cookieConsent');
    cookiesAccepted = consent === 'accepted';
    return cookiesAccepted;
}

(function() {
    const DISCORD_CONFIG = {
        clientId: '1489374950220370012',
        redirectUri: 'https://faworee.com/soundspacecustoms/',
        scope: 'identify'
    };

    const STORAGE_KEY = 'soundSpaceUserSession';
    let userData = null;

    function loadUserSession() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) return null;
            const session = JSON.parse(stored);
            const hoursSinceLogin = (Date.now() - session.timestamp) / (1000 * 60 * 60);
            if (hoursSinceLogin > 72) {
                localStorage.removeItem(STORAGE_KEY);
                return null;
            }
            return session;
        } catch (e) {
            return null;
        }
    }

    function saveUserSession(userData) {
        try {
            const session = { ...userData, timestamp: Date.now() };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        } catch (e) {}
    }

    function loginWithDiscord() {
        const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CONFIG.clientId}&redirect_uri=${encodeURIComponent(DISCORD_CONFIG.redirectUri)}&response_type=code&scope=${DISCORD_CONFIG.scope}`;
        window.location.href = authUrl;
    }

    function logout() {
        localStorage.removeItem(STORAGE_KEY);
        setTimeout(() => location.reload(), 500);
    }

    async function handleOAuthCallback(code) {
        if (sessionStorage.getItem('oauth_processing')) return;
        sessionStorage.setItem('oauth_processing', 'true');
        try {
            const response = await fetch('https://discord.faworeee.workers.dev', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: code, redirect_uri: DISCORD_CONFIG.redirectUri })
            });
            const responseData = await response.json();
            if (!response.ok) throw new Error(responseData.error || 'Authentication failed');
            userData = {
                id: responseData.id,
                username: responseData.username,
                discriminator: responseData.discriminator,
                avatar: responseData.avatar,
                isAdmin: responseData.isAdmin === true,
                loggedInAt: responseData.loggedInAt || Date.now()
            };
            saveUserSession(userData);
            window.history.replaceState({}, document.title, window.location.pathname);
            updateButtonUI();
            updateMenuButtonAvatar();
            sessionStorage.removeItem('oauth_processing');
            setTimeout(() => location.reload(), 500);
        } catch (error) {
            sessionStorage.removeItem('oauth_processing');
        }
    }

    function updateMenuButtonAvatar() {
        const menuToggle = document.getElementById('menuToggle');
        if (!menuToggle) return;
        userData = loadUserSession();
        if (userData) {
            const avatarUrl = userData.avatar
                ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png?size=32`
                : `https://cdn.discordapp.com/embed/avatars/${parseInt(userData.discriminator) % 5}.png`;
            let avatarImg = menuToggle.querySelector('.menu-avatar');
            if (!avatarImg) {
                avatarImg = document.createElement('img');
                avatarImg.className = 'menu-avatar';
                avatarImg.alt = 'Discord Avatar';
                avatarImg.style.cssText = 'width:24px;height:24px;border-radius:50%;margin-right:8px;vertical-align:middle;';
                menuToggle.insertBefore(avatarImg, menuToggle.firstChild);
            }
            avatarImg.src = avatarUrl;
            if (userData.isAdmin) {
                avatarImg.style.border = '2px solid gold';
                avatarImg.title = 'Admin User';
            }
        } else {
            const avatarImg = menuToggle.querySelector('.menu-avatar');
            if (avatarImg) avatarImg.remove();
        }
    }

    function updateButtonUI() {
        const discordAuthBtn = document.getElementById('discordAuthBtn');
        if (!discordAuthBtn) return;
        userData = loadUserSession();
        if (userData) {
            const avatarUrl = userData.avatar
                ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png?size=32`
                : `https://cdn.discordapp.com/embed/avatars/${parseInt(userData.discriminator) % 5}.png`;
            const avatarImg = document.createElement('img');
            avatarImg.src = avatarUrl;
            avatarImg.alt = 'Discord Avatar';
            avatarImg.style.cssText = 'width:24px;height:24px;border-radius:50%;margin-right:8px;vertical-align:middle;';
            if (userData.isAdmin) avatarImg.style.border = '2px solid gold';
            const usernameText = userData.isAdmin ? `logout (${userData.username}) ⭐` : `logout (${userData.username})`;
            discordAuthBtn.innerHTML = '';
            discordAuthBtn.appendChild(avatarImg);
            discordAuthBtn.appendChild(document.createTextNode(usernameText));
            discordAuthBtn.onclick = logout;
        } else {
            discordAuthBtn.innerHTML = 'login with discord';
            discordAuthBtn.onclick = loginWithDiscord;
        }
    }

    function updateAdminUI() {
        const user = window.getDiscordUser ? window.getDiscordUser() : null;
        const addMapMenuBtn = document.getElementById('addMapMenuBtn');
        if (addMapMenuBtn) {
            addMapMenuBtn.style.display = (user && user.isAdmin === true) ? 'block' : 'none';
        }
    }

    document.getElementById('addMapMenuBtn')?.addEventListener('click', () => {
        const user = window.getDiscordUser();
        if (!user || !user.isAdmin) { alert('Admin access required'); return; }
        document.getElementById('addMapModal').classList.add('show');
        headerMenu.classList.remove('show');
    });

    document.querySelectorAll('#addDifficultyOptions .filter-option').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('#addDifficultyOptions .filter-option').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    document.querySelectorAll('#addPatternOptions .filter-option').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            btn.classList.toggle('active');
        });
    });

    document.getElementById('addMapBtn')?.addEventListener('click', async function() {
        const user = window.getDiscordUser();
        if (!user || !user.isAdmin) { alert('Admin access required'); return; }
        const mapName = document.getElementById('addMapName').value.trim();
        const artist = document.getElementById('addArtist').value.trim();
        const mapper = document.getElementById('addMapper').value.trim();
        const githubLink = document.getElementById('addGithubLink').value.trim();
        const info = document.getElementById('addInfo').value.trim();
        const starRating = document.getElementById('addStarRating').value.trim();
        if (!mapName || !artist || !mapper || !githubLink) {
            alert('Please fill in all required fields (Map Name, Artist, Mapper, GitHub Link)');
            return;
        }
        const selectedDifficulty = document.querySelector('#addDifficultyOptions .filter-option.active')?.dataset.difficulty;
        if (!selectedDifficulty) { alert('Please select a difficulty'); return; }
        const selectedPatterns = Array.from(document.querySelectorAll('#addPatternOptions .filter-option.active')).map(btn => btn.dataset.pattern);
        const newMapData = {
            mapName, artist, mapper, link: githubLink,
            difficulty: selectedDifficulty,
            patterns: selectedPatterns.length > 0 ? selectedPatterns : ["No Data"],
            info: info || null,
            starRating: starRating ? parseFloat(starRating) : null,
            isNew: true,
            discordId: user.id
        };
        const addBtn = document.getElementById('addMapBtn');
        const originalText = addBtn.textContent;
        addBtn.textContent = 'Adding...';
        addBtn.disabled = true;
        try {
            const response = await fetch(MAP_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'addMap', userId: user.id, isAdmin: user.isAdmin, mapData: newMapData })
            });
            let responseData;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                responseData = await response.json();
            } else {
                throw new Error('Server returned non-JSON response');
            }
            if (!response.ok) {
                const errorMsg = responseData.error || 'Unknown error';
                const errorDetails = responseData.details || '';
                throw new Error(errorDetails ? `${errorMsg}: ${errorDetails}` : errorMsg);
            }
            alert('✅ Map added successfully!');
            closeModal('addMapModal');
            document.getElementById('addMapName').value = '';
            document.getElementById('addArtist').value = '';
            document.getElementById('addMapper').value = '';
            document.getElementById('addGithubLink').value = '';
            document.getElementById('addInfo').value = '';
            document.getElementById('addStarRating').value = '';
            document.querySelectorAll('#addDifficultyOptions .filter-option').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('#addPatternOptions .filter-option').forEach(btn => btn.classList.remove('active'));
            setTimeout(() => { location.reload(); }, 500);
        } catch (error) {
            alert(`❌ Failed to add map:\n\n${error.message}`);
        } finally {
            addBtn.textContent = originalText;
            addBtn.disabled = false;
        }
    });

    function init() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        if (code) {
            handleOAuthCallback(code);
        } else {
            setTimeout(() => {
                updateButtonUI();
                updateMenuButtonAvatar();
                updateAdminUI();
            }, 100);
        }
    }

    window.getDiscordUser = () => loadUserSession();
    window.isDiscordAuthenticated = () => loadUserSession() !== null;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

function handlePrimarySort(value) {
    currentSortMode = value;
    try { localStorage.setItem('soundSpacePrimarySort', value); } catch(e) {}
    filterAndRenderMaps();
}

function handleSecondarySort(value) {
    secondarySortMode = value;
    try { localStorage.setItem('soundSpaceSecondarySort', value); } catch(e) {}
    filterAndRenderMaps();
}

(function() {
    const fontDropdownHeader = document.getElementById('fontDropdownHeader');
    const fontOptionsList = document.getElementById('fontOptionsList');
    const selectedFontName = document.getElementById('selectedFontName');
    const customFontInputs = document.getElementById('customFontInputs');
    const customFontUrl = document.getElementById('customFontUrl');
    const customFontName = document.getElementById('customFontName');
    const applyCustomFont = document.getElementById('applyCustomFont');

    if (!fontDropdownHeader || !fontOptionsList || !selectedFontName ||
        !customFontInputs || !customFontUrl || !customFontName || !applyCustomFont) return;

    function setCookie(name, value, days = 365) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${encodeURIComponent(value)};expires=${date.toUTCString()};path=/;SameSite=Lax`;
    }

    function getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1);
            if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length));
        }
        return null;
    }

    function deleteCookie(name) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
    }

    const fontFileUpload = document.getElementById('fontFileUpload');
    const uploadLabelText = document.getElementById('uploadLabelText');
    const uploadedFontName = document.getElementById('uploadedFontName');
    const applyUploadedFont = document.getElementById('applyUploadedFont');
    const fontUploadLabel = document.querySelector('.font-upload-label');
    let uploadedFontFile = null;

    if (fontFileUpload) {
        fontFileUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                uploadedFontFile = file;
                uploadLabelText.textContent = `Selected: ${file.name}`;
                fontUploadLabel.classList.add('has-file');
                const fontNameFromFile = file.name.replace(/\.(ttf|otf|woff|woff2)$/i, '').replace(/[-_]/g, ' ');
                if (!uploadedFontName.value) uploadedFontName.value = fontNameFromFile;
            }
        });
    }

    if (applyUploadedFont) {
        applyUploadedFont.addEventListener('click', async () => {
            if (!uploadedFontFile) { alert('Please select a font file first'); return; }
            const fontName = uploadedFontName.value.trim();
            if (!fontName) { alert('Please provide a font family name'); return; }
            try {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    const fontData = e.target.result;
                    const fontFormat = getFontFormat(uploadedFontFile.name);
                    let existingStyle = document.getElementById('customFontStyle');
                    if (existingStyle) existingStyle.remove();
                    const style = document.createElement('style');
                    style.id = 'customFontStyle';
                    style.textContent = `@font-face{font-family:'${fontName}';src:url('${fontData}') format('${fontFormat}');font-weight:normal;font-style:normal;}`;
                    document.head.appendChild(style);
                    try { await document.fonts.load(`16px "${fontName}"`); } catch (err) {}
                    document.body.style.fontFamily = `"${fontName}", sans-serif`;
                    selectedFontName.textContent = fontName;
                    try {
                        localStorage.setItem('uploadedFontData', fontData);
                        localStorage.setItem('uploadedFontName', fontName);
                        localStorage.setItem('uploadedFontFormat', fontFormat);
                    } catch (err) {}
                    deleteCookie('selectedFont');
                    deleteCookie('customFontUrl');
                    customFontInputs.classList.remove('show');
                    alert('Font uploaded and applied successfully!');
                };
                reader.readAsDataURL(uploadedFontFile);
            } catch (error) {
                alert('Failed to load font file');
            }
        });
    }

    function getFontFormat(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const formats = { 'ttf': 'truetype', 'otf': 'opentype', 'woff': 'woff', 'woff2': 'woff2' };
        return formats[ext] || 'truetype';
    }

    function loadSavedFont() {
        const uploadedFontData = localStorage.getItem('uploadedFontData');
        const uploadedFontNameStored = localStorage.getItem('uploadedFontName');
        const uploadedFontFormat = localStorage.getItem('uploadedFontFormat');
        if (uploadedFontData && uploadedFontNameStored) {
            const style = document.createElement('style');
            style.id = 'customFontStyle';
            style.textContent = `@font-face{font-family:'${uploadedFontNameStored}';src:url('${uploadedFontData}') format('${uploadedFontFormat}');font-weight:normal;font-style:normal;}`;
            document.head.appendChild(style);
            setTimeout(() => {
                document.body.style.fontFamily = `"${uploadedFontNameStored}", sans-serif`;
                selectedFontName.textContent = uploadedFontNameStored;
            }, 100);
            return;
        }
        const savedFont = getCookie('selectedFont');
        const savedCustomUrl = getCookie('customFontUrl');
        if (savedCustomUrl) {
            const savedCustomName = getCookie('customFontName') || '';
            loadCustomFont(savedCustomUrl, savedCustomName);
            selectedFontName.textContent = 'Custom Font';
            customFontUrl.value = savedCustomUrl;
            customFontName.value = savedCustomName;
            customFontInputs.classList.add('show');
            document.querySelectorAll('.font-option').forEach(opt => opt.classList.remove('selected'));
            const customOption = document.querySelector('.font-option[data-font="custom"]');
            if (customOption) customOption.classList.add('selected');
        } else if (savedFont) {
            document.body.style.fontFamily = savedFont;
            document.querySelectorAll('.font-option').forEach(opt => {
                if (opt.dataset.font === savedFont) {
                    opt.classList.add('selected');
                    selectedFontName.textContent = opt.textContent;
                } else {
                    opt.classList.remove('selected');
                }
            });
        }
    }

    async function loadCustomFont(url, fontName) {
        let existingLink = document.getElementById('customFontLink');
        if (existingLink) existingLink.remove();
        let cssUrl = url;
        let extractedFontName = fontName || '';
        if (url.includes('fonts.google.com/specimen/')) {
            const match = url.match(/specimen\/([^/?]+)/);
            if (match) {
                cssUrl = `https://fonts.googleapis.com/css2?family=${match[1]}&display=swap`;
                if (!extractedFontName) extractedFontName = match[1].replace(/\+/g, ' ');
            }
        } else if (url.includes('fonts.google.com/share')) {
            const urlParams = new URLSearchParams(url.split('?')[1]);
            const family = urlParams.get('selection.family');
            if (family) {
                cssUrl = `https://fonts.googleapis.com/css2?family=${family}&display=swap`;
                if (!extractedFontName) extractedFontName = family.split(':')[0].replace(/\+/g, ' ');
            }
        } else if (url.includes('fonts.googleapis.com/css')) {
            if (!extractedFontName) {
                const urlParams = new URLSearchParams(url.split('?')[1]);
                const family = urlParams.get('family');
                if (family) extractedFontName = family.split(':')[0].replace(/\+/g, ' ');
            }
        } else if (url.includes('use.typekit.net') || url.includes('use.adobe.com')) {
            cssUrl = url;
            if (!extractedFontName) { alert('For Adobe Fonts, please provide the font family name in the second field.'); return; }
        } else if (url.endsWith('.css') || url.includes('fonts') || url.includes('css')) {
            cssUrl = url;
            if (!extractedFontName) { alert('Please provide the font family name for custom font URLs.'); return; }
        } else if (!extractedFontName) {
            alert('Please provide the font family name in the second field.');
            return;
        }
        const link = document.createElement('link');
        link.id = 'customFontLink';
        link.rel = 'stylesheet';
        link.href = cssUrl;
        document.head.appendChild(link);
        try {
            await document.fonts.load(`16px "${extractedFontName}"`);
            document.body.style.fontFamily = `"${extractedFontName}", sans-serif`;
            if (extractedFontName && extractedFontName !== fontName) setCookie('customFontName', extractedFontName);
        } catch (error) {
            document.body.style.fontFamily = `"${extractedFontName}", sans-serif`;
        }
    }

    fontDropdownHeader.addEventListener('click', (e) => {
        e.stopPropagation();
        const dropdownArrow = fontDropdownHeader.querySelector('.dropdown-arrow');
        fontOptionsList.classList.toggle('show');
        fontDropdownHeader.classList.toggle('active');
        if (dropdownArrow) dropdownArrow.classList.toggle('rotated');
    });

    document.addEventListener('click', (e) => {
        if (fontDropdownHeader && !fontDropdownHeader.contains(e.target) &&
            fontOptionsList && !fontOptionsList.contains(e.target)) {
            fontOptionsList.classList.remove('show');
            fontDropdownHeader.classList.remove('active');
            const dropdownArrow = fontDropdownHeader.querySelector('.dropdown-arrow');
            if (dropdownArrow) dropdownArrow.classList.remove('rotated');
        }
    });

    document.querySelectorAll('.font-option').forEach(option => {
        option.addEventListener('click', () => {
            const fontValue = option.dataset.font;
            const fontNameText = option.textContent;
            document.querySelectorAll('.font-option').forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            selectedFontName.textContent = fontNameText;
            fontOptionsList.classList.remove('show');
            fontDropdownHeader.classList.remove('active');
            const dropdownArrow = fontDropdownHeader.querySelector('.dropdown-arrow');
            if (dropdownArrow) dropdownArrow.classList.remove('rotated');
            if (fontValue === 'custom') {
                customFontInputs.classList.add('show');
            } else {
                customFontInputs.classList.remove('show');
                document.body.style.fontFamily = fontValue;
                setCookie('selectedFont', fontValue);
                deleteCookie('customFontUrl');
                deleteCookie('customFontName');
                localStorage.removeItem('uploadedFontData');
                localStorage.removeItem('uploadedFontName');
                localStorage.removeItem('uploadedFontFormat');
            }
        });
    });

    applyCustomFont.addEventListener('click', function() {
        const url = customFontUrl.value.trim();
        const name = customFontName.value.trim();
        if (!url) return;
        loadCustomFont(url, name);
        setCookie('customFontUrl', url);
        if (name) setCookie('customFontName', name);
        deleteCookie('selectedFont');
        localStorage.removeItem('uploadedFontData');
        localStorage.removeItem('uploadedFontName');
        localStorage.removeItem('uploadedFontFormat');
    });

    loadSavedFont();
})();

(function() {
    const WORKER_URL = 'https://faworee.com/api/logs.php';
    let userFingerprint = null;
    let trackingEnabled = true;

    function init() {
        userFingerprint = generateFingerprint();
        loadTrackingPreference();
    }

    function loadTrackingPreference() {
        try {
            const saved = localStorage.getItem('mapCopyTrackingEnabled');
            if (saved !== null) {
                trackingEnabled = saved === 'true';
                updateTrackingToggleUI();
            }
        } catch (e) {}
    }

    function saveTrackingPreference() {
        try { localStorage.setItem('mapCopyTrackingEnabled', trackingEnabled.toString()); } catch (e) {}
    }

    function updateTrackingToggleUI() {
        const toggle = document.getElementById('trackingToggle');
        if (toggle) {
            toggle.classList.toggle('active', trackingEnabled);
        }
    }

    function generateFingerprint() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('fp', 2, 2);
        const canvasData = canvas.toDataURL();
        const components = [
            canvasData.substring(0, 50),
            screen.width + 'x' + screen.height + 'x' + screen.colorDepth,
            Intl.DateTimeFormat().resolvedOptions().timeZone,
            navigator.language,
            navigator.platform,
            navigator.hardwareConcurrency || 'u',
            navigator.deviceMemory || 'u',
            navigator.maxTouchPoints || 0,
            new Date().getTimezoneOffset(),
            screen.availWidth + 'x' + screen.availHeight
        ];
        return btoa(JSON.stringify(components)).substring(0, 50) + '-' + Date.now();
    }

    async function reportMapCopy(mapName, artist, mapper, copyType = 'link', mapId = null) {
    if (!trackingEnabled) return { success: true, tracking: false };
    try {
        const response = await fetch(WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                type: 'map-copy', 
                mapName, 
                artist, 
                mapper, 
                mapId,        
                copyType, 
                fingerprint: userFingerprint 
            })
        });
        return await response.json();
    } catch (error) {
        return { success: false };
    }
}

    window.errorReporter = {
        reportMapCopy,
        isTrackingEnabled: () => trackingEnabled,
        setTrackingEnabled: (enabled) => {
            trackingEnabled = enabled;
            saveTrackingPreference();
            updateTrackingToggleUI();
        }
    };

    init();
})();

(function() {
    const GITHUB_IMAGES_BASE = 'https://raw.githubusercontent.com/faworee/Secret/main/Nate/';
    const WORKER_URL = 'https://faworee.com/api/logs.php';
    let IMAGE_FILES = [];
    let confettiActive = false;
    let imagesFetched = false;
    let secretFound = false;
    let pendingLocationData = null;

    async function fetchImageList() {
        if (imagesFetched && IMAGE_FILES.length > 0) return;
        try {
            const response = await fetch('https://api.github.com/repos/faworee/Secret/contents/Nate');
            const files = await response.json();
            IMAGE_FILES = files.filter(file => /\.(png|jpg|jpeg|gif|webp)$/i.test(file.name)).map(file => file.name);
            imagesFetched = true;
        } catch (error) {
            IMAGE_FILES = ['default.png'];
        }
    }

    async function getCountryFromIP() {
        try {
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            return { country: data.country_name || 'Unknown', countryCode: data.country_code || 'XX', region: data.region || 'Unknown' };
        } catch (error) {
            return { country: 'Unknown', countryCode: 'XX', region: 'Unknown' };
        }
    }

    async function sendSecretFoundWebhook(locationData, username = null, additionalInfo = null) {
        try {
            await fetch(WORKER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'secret-found', country: locationData.country, countryCode: locationData.countryCode, region: locationData.region, username, additionalInfo })
            });
        } catch (error) {}
    }

    function getRandomImageUrl() {
        return GITHUB_IMAGES_BASE + IMAGE_FILES[Math.floor(Math.random() * IMAGE_FILES.length)];
    }

    function createConfettiParticle() {
        const confetti = document.createElement('img');
        confetti.src = getRandomImageUrl();
        confetti.className = 'nate-confetti';
        confetti.style.left = (Math.random() * window.innerWidth) + 'px';
        confetti.style.top = '-100px';
        const size = Math.random() * 30 + 30;
        confetti.style.width = size + 'px';
        confetti.style.height = size + 'px';
        confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
        const duration = Math.random() * 4 + 2;
        confetti.style.animationDuration = duration + 's';
        confetti.style.setProperty('--drift', ((Math.random() - 0.5) * 300) + 'px');
        confetti.style.setProperty('--rotation', (Math.random() * 720 + 360) + 'deg');
        document.body.appendChild(confetti);
        setTimeout(() => { confetti.remove(); }, duration * 1000);
    }

    async function triggerConfetti() {
        if (confettiActive) return;
        confettiActive = true;
        await fetchImageList();
        if (IMAGE_FILES.length === 0) { confettiActive = false; return; }
        if (!secretFound) {
            secretFound = true;
            pendingLocationData = await getCountryFromIP();
            document.getElementById('secretShareModal').classList.add('show');
        }
        const quality = document.body.classList.contains('low-quality') ? 'low' : 'high';
        const particleCount = quality === 'low' ? 10 : 50;
        const spawnInterval = quality === 'low' ? 200 : 50;
        for (let i = 0; i < particleCount; i++) {
            setTimeout(() => { createConfettiParticle(); }, i * spawnInterval);
        }
        setTimeout(() => { confettiActive = false; }, 8000);
    }

    window.triggerNateConfetti = triggerConfetti;

    function init() {
        fetchImageList();
        document.addEventListener('click', (e) => {
            const clickedElement = e.target;
            const parentElement = clickedElement.closest('.map-card, a, button');
            if (parentElement) {
                const textContent = (parentElement.textContent || '') + (clickedElement.textContent || '') +
                    (parentElement.getAttribute('title') || '') + (clickedElement.getAttribute('title') || '');
                if (textContent.toLowerCase().includes('nate10993')) triggerConfetti();
            }
        });

        const shareYesBtn = document.getElementById('shareYesBtn');
        const shareNoBtn = document.getElementById('shareNoBtn');
        const usernameSubmitBtn = document.getElementById('usernameSubmitBtn');

        if (shareYesBtn) shareYesBtn.addEventListener('click', () => { document.getElementById('usernameContainer').style.display = 'block'; });
        if (shareNoBtn) shareNoBtn.addEventListener('click', () => { closeModal('secretShareModal'); });
        if (usernameSubmitBtn) {
            usernameSubmitBtn.addEventListener('click', async () => {
                const username = document.getElementById('usernameInput').value.trim();
                const additionalInfo = document.getElementById('additionalInfoInput').value.trim();
                if (username && pendingLocationData) {
                    await sendSecretFoundWebhook(pendingLocationData, username, additionalInfo);
                    pendingLocationData = null;
                    closeModal('secretShareModal');
                    document.getElementById('usernameInput').value = '';
                    document.getElementById('additionalInfoInput').value = '';
                    document.getElementById('usernameContainer').style.display = 'none';
                }
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

function checkCookieConsent() {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) document.getElementById('cookieConsent').classList.add('show');
}

const cookieAccept = document.getElementById('cookieAccept');
const cookieDecline = document.getElementById('cookieDecline');
const trackingToggle = document.getElementById('trackingToggle');

if (cookieAccept) {
    cookieAccept.addEventListener('click', () => {
        localStorage.setItem('cookieConsent', 'accepted');
        cookiesAccepted = true;
        document.getElementById('cookieConsent').classList.remove('show');
    });
}

if (cookieDecline) {
    cookieDecline.addEventListener('click', () => {
        localStorage.setItem('cookieConsent', 'declined');
        cookiesAccepted = false;
        localStorage.removeItem('soundSpaceFavorites');
        localStorage.removeItem('selectedFont');
        localStorage.removeItem('customFontUrl');
        localStorage.removeItem('customFontName');
        localStorage.removeItem('uploadedFontData');
        localStorage.removeItem('uploadedFontName');
        localStorage.removeItem('uploadedFontFormat');
        localStorage.removeItem('mapCopyTrackingEnabled');
        localStorage.removeItem('soundSpaceSearchQuery');
        localStorage.removeItem('soundSpacePrimarySort');
        localStorage.removeItem('soundSpaceSecondarySort');
        if (window.errorReporter) window.errorReporter.setTrackingEnabled(false);
        favoritesManager.favorites.clear();
        document.getElementById('cookieConsent').classList.remove('show');
        document.cookie.split(";").forEach(function(c) {
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
        setTimeout(() => location.reload(), 500);
    });
}

if (trackingToggle) {
    trackingToggle.addEventListener('click', function() {
        if (window.errorReporter) {
            window.errorReporter.setTrackingEnabled(!window.errorReporter.isTrackingEnabled());
        }
    });
}

class FavoritesManager {
    constructor() {
        this.favorites = new Set();
        this.loadFavorites();
    }

    loadFavorites() {
        if (!checkCookieStatus()) { this.favorites = new Set(); return; }
        try {
            const saved = document.cookie.split('; ').find(row => row.startsWith('soundSpaceFavorites='));
            if (saved) {
                const data = JSON.parse(decodeURIComponent(saved.split('=')[1]));
                this.favorites = new Set(data);
            }
        } catch (e) {}
    }

    saveFavorites() {
        if (!checkCookieStatus()) return;
        try {
            const data = JSON.stringify([...this.favorites]);
            const expires = new Date();
            expires.setFullYear(expires.getFullYear() + 10);
            document.cookie = `soundSpaceFavorites=${encodeURIComponent(data)}; expires=${expires.toUTCString()}; path=/`;
        } catch (e) {}
    }

    getMapId(map) {
        return `${map.mapName}${map.artist}${map.mapper}${map.noteCount || 0}`;
    }

    isFavorite(map) {
        return this.favorites.has(this.getMapId(map));
    }

    toggleFavorite(map) {
        const id = this.getMapId(map);
        if (this.favorites.has(id)) { this.favorites.delete(id); } else { this.favorites.add(id); }
        this.saveFavorites();
        return this.favorites.has(id);
    }

    getFavoriteCount() {
        return this.favorites.size;
    }
}

const favoritesManager = new FavoritesManager();
let isLowQualityMode = false;
const difficultyOrder = ["Easy", "Medium", "Hard", "Logic", "Brrrr", "Tasukete"];
const difficultyEmojis = { "Easy": "🟩", "Medium": "🟨", "Hard": "🟥", "Logic": "🟪", "Brrrr": "⬜", "Tasukete": "🟦" };

let currentSortMode = 'difficulty-asc';
let secondarySortMode = 'name-asc';
let maps = [];
let filteredMaps = [];
let selectedDifficulties = [];
let selectedPatterns = [];
let apmFilter = "all";
let showNewMapsOnly = false;
let showFavoritesOnly = false;
let currentDisplayCount = 500;
const LOAD_BATCH_SIZE = 250;
let isLoading = false;
let durationRange = { min: 0, max: 600000 };
let notesRange = { min: 0, max: 20000 };
let currentDurationRange = { min: 0, max: 600000 };
let currentNotesRange = { min: 0, max: 20000 };
let currentStartFromMap = null;
let currentSearchType = 'all';

const searchInput = document.getElementById('searchInput');
const mapGrid = document.getElementById('mapGrid');
const popup = document.getElementById('popup');
const loadingSpinner = document.getElementById('loadingSpinner');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const menuToggle = document.getElementById('menuToggle');
const headerMenu = document.getElementById('headerMenu');
const randomMapBtn = document.getElementById('randomMapBtn');
const updateLogBtn = document.getElementById('updateLogBtn');
const qualityToggle = document.getElementById('qualityToggle');
const durationMinThumb = document.getElementById('durationMinThumb');
const durationMaxThumb = document.getElementById('durationMaxThumb');
const durationMinInput = document.getElementById('durationMin');
const durationMaxInput = document.getElementById('durationMax');
const durationTrack = document.getElementById('durationTrack');
const notesMinThumb = document.getElementById('notesMinThumb');
const notesMaxThumb = document.getElementById('notesMaxThumb');
const notesMinInput = document.getElementById('notesMin');
const notesMaxInput = document.getElementById('notesMax');
const notesTrack = document.getElementById('notesTrack');

function restoreSearchAndSort() {
    try {
        const savedSearch = localStorage.getItem('soundSpaceSearchQuery');
        if (savedSearch && searchInput) searchInput.value = savedSearch;
        const savedPrimary = localStorage.getItem('soundSpacePrimarySort');
        if (savedPrimary) {
            currentSortMode = savedPrimary;
            const primaryText = document.getElementById('primarySortText');
            const primaryOptions = document.querySelectorAll('#primarySortOptions .dropdown-option');
            primaryOptions.forEach(opt => {
                opt.classList.remove('selected');
                if (opt.dataset.value === savedPrimary) {
                    opt.classList.add('selected');
                    if (primaryText) primaryText.textContent = opt.textContent;
                }
            });
        }
        const savedSecondary = localStorage.getItem('soundSpaceSecondarySort');
        if (savedSecondary) {
            secondarySortMode = savedSecondary;
            const secondaryText = document.getElementById('secondarySortText');
            const secondaryOptions = document.querySelectorAll('#secondarySortOptions .dropdown-option');
            secondaryOptions.forEach(opt => {
                opt.classList.remove('selected');
                if (opt.dataset.value === savedSecondary) {
                    opt.classList.add('selected');
                    if (secondaryText) secondaryText.textContent = opt.textContent;
                }
            });
        }
    } catch(e) {}
}

if (menuToggle) {
    menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        headerMenu.classList.toggle('show');
    });
}

document.addEventListener('click', (e) => {
    if (menuToggle && headerMenu && !menuToggle.contains(e.target) && !headerMenu.contains(e.target)) {
        headerMenu.classList.remove('show');
    }
});

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('show');
}

const difficultyFilterBtn = document.getElementById('difficultyFilterBtn');
const patternsFilterBtn = document.getElementById('patternsFilterBtn');
const rangeFilterBtn = document.getElementById('rangeFilterBtn');
const otherFilterBtn = document.getElementById('otherFilterBtn');

if (difficultyFilterBtn) difficultyFilterBtn.addEventListener('click', () => { document.getElementById('difficultyModal').classList.add('show'); });
if (patternsFilterBtn) patternsFilterBtn.addEventListener('click', () => { document.getElementById('patternsModal').classList.add('show'); });
if (rangeFilterBtn) rangeFilterBtn.addEventListener('click', () => { document.getElementById('rangeModal').classList.add('show'); });
if (otherFilterBtn) otherFilterBtn.addEventListener('click', () => { document.getElementById('otherModal').classList.add('show'); });

if (updateLogBtn) {
    updateLogBtn.addEventListener('click', () => {
        document.getElementById('changelogModal').classList.add('show');
        loadChangelog();
        headerMenu.classList.remove('show');
    });
}

const infoBtn = document.getElementById('infoBtn');
if (infoBtn) {
    infoBtn.addEventListener('click', () => {
        document.getElementById('infoModal').classList.add('show');
        headerMenu.classList.remove('show');
    });
}
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('show');
    });
});

document.querySelectorAll('#difficultyOptions .filter-option').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const difficulty = btn.dataset.difficulty;
        btn.classList.toggle('active');
        if (btn.classList.contains('active')) {
            if (!selectedDifficulties.includes(difficulty)) selectedDifficulties.push(difficulty);
        } else {
            selectedDifficulties = selectedDifficulties.filter(d => d !== difficulty);
        }
        currentDisplayCount = LOAD_BATCH_SIZE;
        filterAndRenderMaps();
    });
});

document.querySelectorAll('#patternOptions .filter-option').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const pattern = btn.dataset.pattern;
        btn.classList.toggle('active');
        if (btn.classList.contains('active')) {
            if (!selectedPatterns.includes(pattern)) selectedPatterns.push(pattern);
        } else {
            selectedPatterns = selectedPatterns.filter(p => p !== pattern);
        }
        currentDisplayCount = LOAD_BATCH_SIZE;
        filterAndRenderMaps();
    });
});

document.querySelectorAll('[data-apm]').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('[data-apm]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        apmFilter = btn.dataset.apm;
        filterAndRenderMaps();
    });
});

const newMapsFilter = document.getElementById('newMapsFilter');
const favoritesFilter = document.getElementById('favoritesFilter');

if (newMapsFilter) {
    newMapsFilter.addEventListener('click', function() {
        this.classList.toggle('active');
        showNewMapsOnly = this.classList.contains('active');
        filterAndRenderMaps();
    });
}

if (favoritesFilter) {
    favoritesFilter.addEventListener('click', function() {
        this.classList.toggle('active');
        showFavoritesOnly = this.classList.contains('active');
        filterAndRenderMaps();
    });
}

if (qualityToggle) {
    qualityToggle.addEventListener('click', () => {
        isLowQualityMode = !isLowQualityMode;
        document.body.classList.toggle('low-quality', isLowQualityMode);
        qualityToggle.textContent = isLowQualityMode ? 'high quality mode' : 'low quality mode';
        try { localStorage.setItem('soundSpaceLowQuality', isLowQualityMode.toString()); } catch (e) {}
        if (maps.length > 0) renderMaps();
    });
}

try {
    const savedPreference = localStorage.getItem('soundSpaceLowQuality');
    if (savedPreference === 'true' && qualityToggle) qualityToggle.click();
} catch (e) {}

if (randomMapBtn) {
    randomMapBtn.addEventListener('click', () => {
        if (filteredMaps.length === 0) {
            if (popup) { popup.textContent = 'No maps available!'; popup.style.display = 'block'; setTimeout(() => { popup.style.display = 'none'; }, 2000); }
            return;
        }
        const randomMap = filteredMaps[Math.floor(Math.random() * filteredMaps.length)];
        copyToClipboard(randomMap.link, 'Random map copied!', randomMap, 'link');
        if (popup) { popup.textContent = `Random map: ${randomMap.mapName} - copied!`; popup.style.display = 'block'; setTimeout(() => { popup.style.display = 'none'; }, 2000); }
        headerMenu.classList.remove('show');
    });
}

function getEventPosition(e) {
    if (e.touches && e.touches.length > 0) return e.touches[0].clientX;
    if (e.changedTouches && e.changedTouches.length > 0) return e.changedTouches[0].clientX;
    return e.clientX;
}

function initRangeSliders() {
    if (!durationMinThumb || !durationMaxThumb || !notesMinThumb || !notesMaxThumb) return;

    let isDraggingDuration = false;
    let currentDurationThumb = null;

    function updateDurationSlider() {
        const minPercent = (currentDurationRange.min / durationRange.max) * 100;
        const maxPercent = (currentDurationRange.max / durationRange.max) * 100;
        durationMinThumb.style.left = minPercent + '%';
        durationMaxThumb.style.left = maxPercent + '%';
        durationTrack.style.left = minPercent + '%';
        durationTrack.style.width = (maxPercent - minPercent) + '%';
        durationMinInput.value = formatDuration(currentDurationRange.min);
        durationMaxInput.value = formatDuration(currentDurationRange.max);
    }

    function handleDurationStart(e, thumb) {
        e.preventDefault();
        isDraggingDuration = true;
        currentDurationThumb = thumb;
        thumb.classList.add('active');
        document.body.style.userSelect = 'none';
    }

    function handleDurationMove(e) {
        if (!isDraggingDuration || !currentDurationThumb) return;
        e.preventDefault();
        const slider = currentDurationThumb.parentElement;
        const rect = slider.getBoundingClientRect();
        const clientX = getEventPosition(e);
        const percent = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
        const value = (percent / 100) * durationRange.max;
        if (currentDurationThumb === durationMinThumb) {
            currentDurationRange.min = Math.max(0, Math.min(value, currentDurationRange.max - 1000));
        } else {
            currentDurationRange.max = Math.min(durationRange.max, Math.max(value, currentDurationRange.min + 1000));
        }
        updateDurationSlider();
        filterAndRenderMaps();
    }

    function handleDurationEnd(e) {
        if (isDraggingDuration && currentDurationThumb) {
            if (e) e.preventDefault();
            currentDurationThumb.classList.remove('active');
            isDraggingDuration = false;
            currentDurationThumb = null;
            document.body.style.userSelect = '';
            document.removeEventListener('mousemove', handleDurationMove);
            document.removeEventListener('mouseup', handleDurationEnd);
            document.removeEventListener('touchmove', handleDurationMove);
            document.removeEventListener('touchend', handleDurationEnd);
            document.removeEventListener('touchcancel', handleDurationEnd);
        }
    }

    durationMinThumb.addEventListener('mousedown', (e) => { handleDurationStart(e, durationMinThumb); document.addEventListener('mousemove', handleDurationMove); document.addEventListener('mouseup', handleDurationEnd); });
    durationMaxThumb.addEventListener('mousedown', (e) => { handleDurationStart(e, durationMaxThumb); document.addEventListener('mousemove', handleDurationMove); document.addEventListener('mouseup', handleDurationEnd); });
    durationMinThumb.addEventListener('touchstart', (e) => { handleDurationStart(e, durationMinThumb); document.addEventListener('touchmove', handleDurationMove, { passive: false }); document.addEventListener('touchend', handleDurationEnd); document.addEventListener('touchcancel', handleDurationEnd); }, { passive: false });
    durationMaxThumb.addEventListener('touchstart', (e) => { handleDurationStart(e, durationMaxThumb); document.addEventListener('touchmove', handleDurationMove, { passive: false }); document.addEventListener('touchend', handleDurationEnd); document.addEventListener('touchcancel', handleDurationEnd); }, { passive: false });

    let isDraggingNotes = false;
    let currentNotesThumb = null;

    function updateNotesSlider() {
        const minPercent = (currentNotesRange.min / notesRange.max) * 100;
        const maxPercent = (currentNotesRange.max / notesRange.max) * 100;
        notesMinThumb.style.left = minPercent + '%';
        notesMaxThumb.style.left = maxPercent + '%';
        notesTrack.style.left = minPercent + '%';
        notesTrack.style.width = (maxPercent - minPercent) + '%';
        notesMinInput.value = Math.round(currentNotesRange.min);
        notesMaxInput.value = Math.round(currentNotesRange.max);
    }

    function handleNotesStart(e, thumb) {
        e.preventDefault();
        isDraggingNotes = true;
        currentNotesThumb = thumb;
        thumb.classList.add('active');
        document.body.style.userSelect = 'none';
    }

    function handleNotesMove(e) {
        if (!isDraggingNotes || !currentNotesThumb) return;
        e.preventDefault();
        const slider = currentNotesThumb.parentElement;
        const rect = slider.getBoundingClientRect();
        const clientX = getEventPosition(e);
        const percent = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
        const value = (percent / 100) * notesRange.max;
        if (currentNotesThumb === notesMinThumb) {
            currentNotesRange.min = Math.max(0, Math.min(value, currentNotesRange.max - 10));
        } else {
            currentNotesRange.max = Math.min(notesRange.max, Math.max(value, currentNotesRange.min + 10));
        }
        updateNotesSlider();
        filterAndRenderMaps();
    }

    function handleNotesEnd(e) {
        if (isDraggingNotes && currentNotesThumb) {
            if (e) e.preventDefault();
            currentNotesThumb.classList.remove('active');
            isDraggingNotes = false;
            currentNotesThumb = null;
            document.body.style.userSelect = '';
            document.removeEventListener('mousemove', handleNotesMove);
            document.removeEventListener('mouseup', handleNotesEnd);
            document.removeEventListener('touchmove', handleNotesMove);
            document.removeEventListener('touchend', handleNotesEnd);
            document.removeEventListener('touchcancel', handleNotesEnd);
        }
    }

    notesMinThumb.addEventListener('mousedown', (e) => { handleNotesStart(e, notesMinThumb); document.addEventListener('mousemove', handleNotesMove); document.addEventListener('mouseup', handleNotesEnd); });
    notesMaxThumb.addEventListener('mousedown', (e) => { handleNotesStart(e, notesMaxThumb); document.addEventListener('mousemove', handleNotesMove); document.addEventListener('mouseup', handleNotesEnd); });
    notesMinThumb.addEventListener('touchstart', (e) => { handleNotesStart(e, notesMinThumb); document.addEventListener('touchmove', handleNotesMove, { passive: false }); document.addEventListener('touchend', handleNotesEnd); document.addEventListener('touchcancel', handleNotesEnd); }, { passive: false });
    notesMaxThumb.addEventListener('touchstart', (e) => { handleNotesStart(e, notesMaxThumb); document.addEventListener('touchmove', handleNotesMove, { passive: false }); document.addEventListener('touchend', handleNotesEnd); document.addEventListener('touchcancel', handleNotesEnd); }, { passive: false });

    updateDurationSlider();
    updateNotesSlider();
}

function updateActiveFiltersDisplay() {
    const content = document.getElementById('activeFiltersContent');
    if (!content) return;
    const filters = [];
    if (selectedDifficulties.length > 0) filters.push(`Difficulty: ${selectedDifficulties.join(', ')}`);
    if (selectedPatterns.length > 0) filters.push(`Patterns: ${selectedPatterns.join(', ')}`);
    if (currentDurationRange.min > 0 || currentDurationRange.max < durationRange.max) filters.push(`Duration: ${formatDuration(currentDurationRange.min)} - ${formatDuration(currentDurationRange.max)}`);
    if (currentNotesRange.min > 0 || currentNotesRange.max < notesRange.max) filters.push(`Notes: ${Math.round(currentNotesRange.min)} - ${Math.round(currentNotesRange.max)}`);
    if (apmFilter !== 'all') filters.push(`APM: ${apmFilter === 'only' ? 'Only APM' : 'No APM'}`);
    if (showNewMapsOnly) filters.push('New Maps Only');
    if (showFavoritesOnly) filters.push('Favorites Only');
    content.textContent = filters.length > 0 ? filters.join(' • ') : 'None';
}

let searchTimeout;
if (searchInput) {
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        const searchValue = searchInput.value;
        try { localStorage.setItem('soundSpaceSearchQuery', searchValue); } catch(e) {}
        if (searchValue.toLowerCase().includes('nate10993')) {
            if (window.triggerNateConfetti) window.triggerNateConfetti();
        }
        searchTimeout = setTimeout(() => {
            currentDisplayCount = LOAD_BATCH_SIZE;
            filterAndRenderMaps();
        }, 300);
    });
}

if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
        if (!isLoading) loadMoreMaps();
    });
}

function loadMoreMaps() {
    if (isLoading || currentDisplayCount >= filteredMaps.length) return;
    isLoading = true;
    if (loadingSpinner) loadingSpinner.style.display = 'block';
    if (loadMoreBtn) { loadMoreBtn.disabled = true; loadMoreBtn.textContent = 'Loading...'; }
    setTimeout(() => {
        const previousCount = currentDisplayCount;
        currentDisplayCount = Math.min(currentDisplayCount + LOAD_BATCH_SIZE, filteredMaps.length);
        const fragment = document.createDocumentFragment();
        for (let i = previousCount; i < currentDisplayCount; i++) fragment.appendChild(createMapCard(filteredMaps[i]));
        if (mapGrid) mapGrid.appendChild(fragment);
        updateLoadMoreButton();
        isLoading = false;
        if (loadingSpinner) loadingSpinner.style.display = 'none';
    }, 100);
}

function updateLoadMoreButton() {
    if (!loadMoreBtn) return;
    const remainingMaps = filteredMaps.length - currentDisplayCount;
    if (remainingMaps <= 0) {
        loadMoreBtn.style.display = 'none';
    } else {
        loadMoreBtn.style.display = 'block';
        loadMoreBtn.disabled = false;
        loadMoreBtn.textContent = `Load ${Math.min(LOAD_BATCH_SIZE, remainingMaps)} More Maps`;
    }
}

function formatDuration(milliseconds) {
    if (milliseconds <= 0 || isNaN(milliseconds)) return "0:00";
    const totalSeconds = Math.floor(milliseconds / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function isApmMap(artist) {
    return artist.toLowerCase().includes('apm music');
}

async function copyToClipboard(text, message, map, copyType) {
    try {
        await navigator.clipboard.writeText(text);
        if (window.errorReporter && window.errorReporter.reportMapCopy && map) {
            window.errorReporter.reportMapCopy(
                map.mapName, 
                map.artist, 
                map.mapper, 
                copyType,
                map.id || null  
            );
        }
    } catch (error) {}
}

window.toggleFavorite = function(button, event) {
    event.stopPropagation();
    if (!checkCookieStatus()) {
        if (popup) { popup.textContent = 'Please accept cookies to use favorites!'; popup.style.display = 'block'; setTimeout(() => { popup.style.display = 'none'; }, 2000); }
        return;
    }
    const mapData = JSON.parse(button.getAttribute('data-map').replace(/&quot;/g, '"').replace(/&#39;/g, "'"));
    const isFav = favoritesManager.toggleFavorite(mapData);
    button.classList.toggle('favorited', isFav);
    if (popup) { popup.textContent = isFav ? 'Added to favorites!' : 'Removed from favorites!'; popup.style.display = 'block'; setTimeout(() => { popup.style.display = 'none'; }, 1500); }
    if (showFavoritesOnly) filterAndRenderMaps();
};


window.toggleVote = async function(button, voteType, event) {
    event.stopPropagation();

    const user = window.getDiscordUser ? window.getDiscordUser() : null;
    if (!user) {
        const popup = document.getElementById('popup');
        if (popup) {
            popup.textContent = 'You must be logged in with Discord to vote!';
            popup.style.display = 'block';
            setTimeout(() => { popup.style.display = 'none'; }, 2500);
        }
        return;
    }

    const card = button.closest('.map-card');
    const mapId = button.dataset.mapId;
    if (!mapId) return;

    const likeBtn    = card.querySelector('.ld-btn-full[data-vote="like"]');
const dislikeBtn = card.querySelector('.ld-btn-full[data-vote="dislike"]');
if (!likeBtn || !dislikeBtn) return;
const likeCount    = likeBtn.querySelector('.ld-count');
const dislikeCount = dislikeBtn.querySelector('.ld-count');

    const wasLiked    = likeBtn.classList.contains('liked');
    const wasDisliked = dislikeBtn.classList.contains('disliked');
    const removingVote = (voteType === 'like' && wasLiked) || (voteType === 'dislike' && wasDisliked);

    likeBtn.classList.remove('liked');
    dislikeBtn.classList.remove('disliked');

    let likeDelta    = wasLiked    ? -1 : 0;
    let dislikeDelta = wasDisliked ? -1 : 0;

    if (!removingVote) {
        if (voteType === 'like')    { likeBtn.classList.add('liked');       likeDelta    += 1; }
        if (voteType === 'dislike') { dislikeBtn.classList.add('disliked'); dislikeDelta += 1; }
    }
 
    const oldLikes    = parseInt(likeCount.textContent, 10);
    const oldDislikes = parseInt(dislikeCount.textContent, 10);
    animateCount(likeCount,    oldLikes,    Math.max(0, oldLikes    + likeDelta));
    animateCount(dislikeCount, oldDislikes, Math.max(0, oldDislikes + dislikeDelta));

    likeBtn.disabled    = true;
    dislikeBtn.disabled = true;

    try {
        const response = await fetch(MAP_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'voteMap',
                userId: user.id,
                mapId,
                voteType: removingVote ? 'remove' : voteType
            })
        });

        if (!response.ok) throw new Error('Vote failed');

        const data = await response.json();

        likeCount.textContent    = data.likes    ?? likeCount.textContent;
        dislikeCount.textContent = data.dislikes ?? dislikeCount.textContent;

        if (!mapVotesData[mapId]) mapVotesData[mapId] = { likes: 0, dislikes: 0, likedBy: [], dislikedBy: [] };
        mapVotesData[mapId].likes    = parseInt(likeCount.textContent, 10);
        mapVotesData[mapId].dislikes = parseInt(dislikeCount.textContent, 10);

        const v = mapVotesData[mapId];
        v.likedBy    = (v.likedBy    || []).filter(id => id !== user.id);
        v.dislikedBy = (v.dislikedBy || []).filter(id => id !== user.id);
        if (!removingVote) {
            if (voteType === 'like')    v.likedBy.push(user.id);
            if (voteType === 'dislike') v.dislikedBy.push(user.id);
        }
    } catch {
        likeBtn.classList.toggle('liked',       wasLiked);
        dislikeBtn.classList.toggle('disliked', wasDisliked);
        likeCount.textContent    = parseInt(likeCount.textContent, 10)    - likeDelta;
        dislikeCount.textContent = parseInt(dislikeCount.textContent, 10) - dislikeDelta;
        const popup = document.getElementById('popup');
        if (popup) {
            popup.textContent = 'Failed to save vote. Please try again.';
            popup.style.display = 'block';
            setTimeout(() => { popup.style.display = 'none'; }, 2000);
        }
    } finally {
        likeBtn.disabled    = false;
        dislikeBtn.disabled = false;
    }
};

let currentEditingMap = null;
const MAP_API_URL = 'https://mapstats.faworeee.workers.dev';

function isAdmin() {
    const user = window.getDiscordUser();
    return user && user.isAdmin === true;
}

window.openEditMap = function(button, event) {
    event.stopPropagation();
    const dropdown = button.closest('.more-actions-dropdown');
    if (dropdown) dropdown.classList.remove('show');
    const card = button.closest('.map-card');
    const favoriteBtn = card.querySelector('.favorite-btn');
    if (!favoriteBtn) return;
    try {
        const mapData = JSON.parse(favoriteBtn.getAttribute('data-map').replace(/&quot;/g, '"').replace(/&#39;/g, "'"));
        currentEditingMap = mapData;
        document.getElementById('editMapName').value = mapData.mapName || '';
        document.getElementById('editArtist').value = mapData.artist || '';
        document.getElementById('editMapper').value = mapData.mapper || '';
        document.getElementById('editGithubLink').value = mapData.link || '';
        document.getElementById('editInfo').value = mapData.info || '';
        document.querySelectorAll('#editDifficultyOptions .filter-option').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.difficulty === mapData.difficulty) btn.classList.add('active');
        });
        document.querySelectorAll('#editPatternOptions .filter-option').forEach(btn => btn.classList.remove('active'));
        if (mapData.patterns && Array.isArray(mapData.patterns)) {
            mapData.patterns.forEach(pattern => {
                const btn = document.querySelector(`#editPatternOptions .filter-option[data-pattern="${pattern}"]`);
                if (btn) btn.classList.add('active');
            });
        }
        const starRatingContainer = document.getElementById('editStarRatingContainer');
        const starRatingInput = document.getElementById('editStarRating');
        const deleteBtn = document.getElementById('deleteMapBtn');
        if (isAdmin()) {
            if (starRatingContainer) starRatingContainer.style.display = 'block';
            if (starRatingInput) starRatingInput.value = mapData.starRating || '';
            if (deleteBtn) deleteBtn.style.display = 'block';
        } else {
            if (starRatingContainer) starRatingContainer.style.display = 'none';
            if (deleteBtn) deleteBtn.style.display = 'none';
        }
        document.getElementById('editMapModal').classList.add('show');
    } catch (e) {}
};

document.querySelectorAll('#editDifficultyOptions .filter-option').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('#editDifficultyOptions .filter-option').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

document.querySelectorAll('#editPatternOptions .filter-option').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        btn.classList.toggle('active');
    });
});

document.getElementById('saveMapEditsBtn')?.addEventListener('click', async function() {
    if (!currentEditingMap) return;
    const user = window.getDiscordUser();
    if (!user) { alert('Please login with Discord to edit maps'); return; }
    if (user.id !== currentEditingMap.discordId && !isAdmin()) { alert('You can only edit your own maps'); return; }
    
    const newMapName = document.getElementById('editMapName').value.trim();
    const newArtist = document.getElementById('editArtist').value.trim();
    const newMapper = document.getElementById('editMapper').value.trim();
    const newGithubLink = document.getElementById('editGithubLink').value.trim();
    const newInfo = document.getElementById('editInfo').value.trim();
    
    if (!newMapName || !newArtist || !newMapper || !newGithubLink) { 
        alert('Please fill in all required fields (Map Name, Artist, Mapper, GitHub Link)'); 
        return; 
    }
    
    if (!newGithubLink.startsWith('http')) {
        alert('GitHub link must be a valid URL starting with http');
        return;
    }
    
    const selectedDifficulty = document.querySelector('#editDifficultyOptions .filter-option.active')?.dataset.difficulty;
    if (!selectedDifficulty) { alert('Please select a difficulty'); return; }
    
    const selectedPatternsEdit = Array.from(document.querySelectorAll('#editPatternOptions .filter-option.active')).map(btn => btn.dataset.pattern);
    
    const originalMapFromList = maps.find(m => 
        m.mapName === currentEditingMap.mapName && 
        m.artist === currentEditingMap.artist && 
        m.mapper === currentEditingMap.mapper
    );
    
    const originalLink = originalMapFromList ? originalMapFromList.link : currentEditingMap.link;
    
    if (!originalLink || originalLink.length < 10 || !originalLink.startsWith('http')) {
        alert('Error: Cannot determine original map link. The map data may be corrupted.');
        return;
    }
    
    currentEditingMap.mapName = newMapName;
    currentEditingMap.artist = newArtist;
    currentEditingMap.mapper = newMapper;
    currentEditingMap.link = newGithubLink;
    currentEditingMap.info = newInfo;
    currentEditingMap.difficulty = selectedDifficulty;
    currentEditingMap.patterns = selectedPatternsEdit.length > 0 ? selectedPatternsEdit : ["No Data"];
    
    const saveBtn = document.getElementById('saveMapEditsBtn');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = 'Saving...';
    saveBtn.disabled = true;
    
    try {
        let action = 'editMap';
        if (isAdmin()) {
            const starRatingInput = document.getElementById('editStarRating');
            if (starRatingInput) {
                const newStarRating = starRatingInput.value.trim();
                const currentRating = currentEditingMap.starRating;
                if (newStarRating !== '' && newStarRating !== String(currentRating)) {
                    const ratingValue = parseFloat(newStarRating);
                    if (isNaN(ratingValue) || ratingValue < 0 || ratingValue > 10) { 
                        alert('Star rating must be between 0 and 10'); 
                        throw new Error('Invalid star rating'); 
                    }
                    currentEditingMap.starRating = ratingValue;
                    action = 'updateStarRating';
                }
            }
        }
        
        console.log('Sending edit request:', {
            action,
            originalLink,
            newLink: newGithubLink,
            mapName: newMapName
        });
        
        const response = await fetch(MAP_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                action, 
                userId: user.id, 
                isAdmin: user.isAdmin || false, 
                originalLink: originalLink,
                mapData: currentEditingMap
            })
        });
        
        let responseData;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            responseData = await response.json();
        } else {
            const textResponse = await response.text();
            console.error('Non-JSON response:', textResponse);
            throw new Error('Server returned non-JSON response');
        }
        
        if (!response.ok) {
            const errorMsg = responseData.error || 'Unknown error';
            const errorDetails = responseData.details || '';
            throw new Error(errorDetails ? `${errorMsg}: ${errorDetails}` : errorMsg);
        }
        
        const mapIndex = maps.findIndex(m => m.link === originalLink);
        if (mapIndex !== -1) {
            maps[mapIndex] = { ...maps[mapIndex], ...currentEditingMap };
        }
        
        alert('✅ Map updated successfully!');
        closeModal('editMapModal');
        setTimeout(() => { location.reload(); }, 500);
    } catch (error) {
        console.error('Save error:', error);
        alert(`❌ Failed to save changes:\n\n${error.message}`);
    } finally {
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
    }
});

document.getElementById('deleteMapBtn')?.addEventListener('click', async function() {
    if (!isAdmin()) { alert('Only admins can delete maps'); return; }
    if (!currentEditingMap) return;
    if (!confirm(`⚠️ Are you sure you want to delete the map "${currentEditingMap.mapName}"?\n\nThis action CANNOT be undone!`)) return;
    if (!confirm(`Final confirmation: Delete "${currentEditingMap.mapName}" by ${currentEditingMap.mapper}?`)) return;
    const user = window.getDiscordUser();
    if (!user || !user.isAdmin) { alert('Admin authentication required'); return; }
    const deleteBtn = document.getElementById('deleteMapBtn');
    const originalText = deleteBtn.textContent;
    deleteBtn.textContent = 'Deleting...';
    deleteBtn.disabled = true;
    try {
        const response = await fetch(MAP_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'deleteMap', userId: user.id, isAdmin: user.isAdmin, mapLink: currentEditingMap.link })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Failed to delete map');
        const mapIndex = maps.findIndex(m => m.link === currentEditingMap.link);
        if (mapIndex !== -1) maps.splice(mapIndex, 1);
        alert('✅ Map deleted successfully!');
        closeModal('editMapModal');
        setTimeout(() => { location.reload(); }, 500);
    } catch (error) {
        alert(`❌ Failed to delete map: ${error.message}`);
    } finally {
        deleteBtn.textContent = originalText;
        deleteBtn.disabled = false;
    }
});



function compareByName(a, b) {
    const nameComp = a.mapName.toLowerCase().localeCompare(b.mapName.toLowerCase());
    if (nameComp !== 0) return nameComp;
    const artistComp = a.artist.toLowerCase().localeCompare(b.artist.toLowerCase());
    if (artistComp !== 0) return artistComp;
    return a.mapper.toLowerCase().localeCompare(b.mapper.toLowerCase());
}

function applySortComparison(a, b, mode) {
    switch (mode) {
        case 'difficulty-asc': {
            const d = difficultyOrder.indexOf(a.difficulty) - difficultyOrder.indexOf(b.difficulty);
            return d !== 0 ? d : 0;
        }
        case 'difficulty-desc': {
            const d = difficultyOrder.indexOf(b.difficulty) - difficultyOrder.indexOf(a.difficulty);
            return d !== 0 ? d : 0;
        }
        case 'name-asc':
            return compareByName(a, b);
        case 'name-desc':
            return compareByName(b, a);
        case 'star-asc': {
            const s = (a.starRating || 0) - (b.starRating || 0);
            return s !== 0 ? s : 0;
        }
        case 'star-desc': {
            const s = (b.starRating || 0) - (a.starRating || 0);
            return s !== 0 ? s : 0;
        }
        case 'popularity-asc': {
            const p = (a.copies || 0) - (b.copies || 0);
            return p !== 0 ? p : 0;
        }
        case 'popularity-desc': {
            const p = (b.copies || 0) - (a.copies || 0);
            return p !== 0 ? p : 0;
        }
        default:
            return 0;
    }
}

function createMapCard(m) {
    const card = document.createElement('div');
    card.classList.add('map-card');
    let mapDifficulty = m.difficulty.toLowerCase();
    if (m.difficulty === "No Data") mapDifficulty = "brrrr";
    card.classList.add(mapDifficulty);

    let newTagHtml = '';
    if (m.isNew) newTagHtml = '<div class="new-badge">NEW</div>';

    const isFavorite = favoritesManager.isFavorite(m);
    const mapDataJSON = JSON.stringify(m).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const difficultyEmoji = difficultyEmojis[m.difficulty] || '⬜';
    const difficultyName = m.difficulty || 'Unknown';
    const starRating = m.starRating !== null && m.starRating !== undefined ? `★ ${parseFloat(m.starRating).toFixed(2)}` : '★ N/A';

   let statsHtml = '';
    if (!isLowQualityMode) {
        const durationText = (m.duration !== undefined && m.duration !== null) ? formatDuration(m.duration) : '--:--';
        const noteCountText = (m.noteCount !== undefined && m.noteCount !== null) ? m.noteCount.toLocaleString() : '----';
        statsHtml = `<div class="info-item"><img src="Clock1.png" alt="Duration" onerror="this.style.display='none'"> ${durationText} - <img src="Note.png" alt="Notes" onerror="this.style.display='none'"> ${noteCountText}</div>`;
    } else {
        statsHtml = `<div class="info-item" style="color: #888;">Stats disabled</div>`;
    }

    let patternsHtml = '';
    if (m.patterns && m.patterns.length > 0) {
        patternsHtml = `<div class="patterns-display"><strong><img src="https://i.imgur.com/faaeFbM.png" style="width:25px;height:25px;object-fit:contain;vertical-align:middle;margin-right:4px;">Patterns:</strong><span>${m.patterns.map(p => p === "No Data" ? "No Pattern Data" : p).join(', ')}</span></div>`;
    } else {
        patternsHtml = `<div class="patterns-display"><strong><img src="https://i.imgur.com/faaeFbM.png" style="width:25px;height:25px;object-fit:contain;vertical-align:middle;margin-right:4px;">Patterns:</strong><span style="color: #888;">None</span></div>`;
    }

    let infoHtml = '';
    if (m.info && m.info.trim() !== '') {
        infoHtml = `<div class="info-display"><strong><img src="https://i.imgur.com/K5VaXgr.png" style="width:25px;height:25px;object-fit:contain;vertical-align:middle;margin-right:4px;">Info:</strong><span>${m.info}</span></div>`;
    } else {
        infoHtml = `<div class="info-display"><strong><img src="https://i.imgur.com/K5VaXgr.png" style="width:25px;height:25px;object-fit:contain;vertical-align:middle;margin-right:4px;">Info:</strong><span style="color: #888;">No Info Provided</span></div>`;
    }

    const copies = m.copies || 0;
    const popularityHtml = `<div class="popularity-display"><strong><img src="https://i.imgur.com/5lGIrvS.png" style="width:25px;height:25px;object-fit:contain;vertical-align:middle;margin-right:4px;">Popularity:</strong><span>${copies.toLocaleString()} ${copies === 1 ? 'copy' : 'copies'}</span></div>`;
    const user = window.getDiscordUser ? window.getDiscordUser() : null;
    const canEdit = user && (user.id === m.discordId || user.isAdmin === true);
    const editButtonHtml = canEdit ? `<div class="dropdown-action" onclick="openEditMap(this, event)">Edit Map</div>` : '';

   card.innerHTML = `
    ${newTagHtml}
    <div class="card-header">
        <div class="star-rating">${starRating}</div>
        <button class="favorite-btn ${isFavorite ? 'favorited' : ''}" onclick="toggleFavorite(this, event)" data-map="${mapDataJSON}">
            <span class="heart-outline"><img src="https://i.imgur.com/NStQ4hz.png" style="width:30px;height:30px;object-fit:contain;display:block;"></span>
            <span class="heart-filled"><img src="https://i.imgur.com/0ZvpNZD.png" style="width:30px;height:30px;object-fit:contain;display:block;"></span>
        </button>
    </div>
    <div class="card-content">
        <div class="map-title"><a href="${m.link}" target="_blank" rel="noopener">${m.mapName}</a></div>
        <div class="artist-name">${m.artist}</div>
        <div class="map-info">
            <div class="info-item">Mapper: ${m.mapper} - Difficulty: <span class="difficulty-emoji">${difficultyEmoji}<span class="difficulty-tooltip">${difficultyName}</span></span></div>
            ${statsHtml}
        </div>
        ${patternsHtml}
        ${infoHtml}
        ${popularityHtml}
        ${(() => {
            const voteData = m.id ? getMapVotes(m.id) : { likes: 0, dislikes: 0, likedBy: [], dislikedBy: [] };
            const user = window.getDiscordUser ? window.getDiscordUser() : null;
            const isLiked    = user && (voteData.likedBy    || []).includes(user.id);
            const isDisliked = user && (voteData.dislikedBy || []).includes(user.id);
            return `<div class="like-dislike-bar-full">
                <button class="ld-btn-full ${isLiked ? 'liked' : ''}" data-vote="like" data-map-id="${m.id || ''}" onclick="toggleVote(this,'like',event)">
                    <img src="https://i.imgur.com/AiIfdPV.png" alt="like">
                    <span class="ld-count">${voteData.likes || 0}</span>
                </button>
                <div class="ld-divider-full"></div>
                <button class="ld-btn-full ${isDisliked ? 'disliked' : ''}" data-vote="dislike" data-map-id="${m.id || ''}" onclick="toggleVote(this,'dislike',event)">
                    <img src="https://i.imgur.com/AiIfdPV.png" style="transform:rotate(180deg);" alt="dislike">
                    <span class="ld-count">${voteData.dislikes || 0}</span>
                </button>
            </div>`;
        })()}
    </div>
    <div class="card-footer">
        <button class="action-btn" onclick="copyMapLink('${m.link.replace(/'/g, "\\'")}', this)"><img src="https://i.imgur.com/BYt3MpP.png" style="width:25px;height:25px;object-fit:contain;vertical-align:middle;margin-right:5px;">Copy Link</button>
        <button class="more-btn" onclick="toggleMoreActions(this)" style="display:flex;align-items:center;justify-content:center;"><img src="https://i.imgur.com/ePbrOpD.png" style="width:32px;height:32px;object-fit:contain;transform:scaleY(-1);">
            <div class="more-actions-dropdown">
                <div class="dropdown-action" onclick="openStartFrom('${m.link.replace(/'/g, "\\'")}', event)">Start From</div>
                <div class="dropdown-action" onclick="copyRawData('${m.link.replace(/'/g, "\\'")}')">Copy Raw</div>
                ${editButtonHtml}
            </div>
        </button>
    </div>
`;
    return card;
}


window.copyMapLink = async function(link, button) {
    const card = button.closest('.map-card');
    const favoriteBtn = card.querySelector('.favorite-btn');
    let mapData = { mapName: 'Unknown', artist: 'Unknown', mapper: 'Unknown', id: null };
    if (favoriteBtn) {
        try { mapData = JSON.parse(favoriteBtn.getAttribute('data-map').replace(/&quot;/g, '"').replace(/&#39;/g, "'")); } catch (e) {}
    }
    try {
        await navigator.clipboard.writeText(link);
        if (popup) { popup.textContent = 'Map link copied to clipboard!'; popup.style.display = 'block'; setTimeout(() => { popup.style.display = 'none'; }, 2000); }
        button.innerHTML = '<img src="https://i.imgur.com/BYt3MpP.png" style="width:25px;height:25px;object-fit:contain;vertical-align:middle;margin-right:5px;">Copied!';
        button.classList.add('copied');
        setTimeout(() => { 
            button.innerHTML = '<img src="https://i.imgur.com/BYt3MpP.png" style="width:25px;height:25px;object-fit:contain;vertical-align:middle;margin-right:5px;">Copy Link'; 
            button.classList.remove('copied'); 
        }, 1000);
        if (window.errorReporter && window.errorReporter.reportMapCopy) {
            await window.errorReporter.reportMapCopy(
                mapData.mapName, 
                mapData.artist, 
                mapData.mapper, 
                'link',
                mapData.id || null  
            );
        }
    } catch (err) {}
};

window.copyRawData = async function(link) {
    try {
        const dropdown = event.target.closest('.more-actions-dropdown');
        const card = dropdown.closest('.map-card');
        const favoriteBtn = card.querySelector('.favorite-btn');
        let mapData = { mapName: 'Unknown', artist: 'Unknown', mapper: 'Unknown', id: null }; 
        if (favoriteBtn) {
            try { mapData = JSON.parse(favoriteBtn.getAttribute('data-map').replace(/&quot;/g, '"').replace(/&#39;/g, "'")); } catch (e) {}
        }
        const rawLink = link.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
        const response = await fetch(rawLink);
        if (!response.ok) throw new Error('Fetch failed');
        const rawContent = await response.text();
        await navigator.clipboard.writeText(rawContent);
        if (popup) { popup.textContent = 'Raw map data copied to clipboard!'; popup.style.display = 'block'; setTimeout(() => { popup.style.display = 'none'; }, 2000); }
        if (dropdown) dropdown.classList.remove('show');
        if (window.errorReporter && window.errorReporter.reportMapCopy) {
            window.errorReporter.reportMapCopy(
                mapData.mapName, 
                mapData.artist, 
                mapData.mapper, 
                'raw',
                mapData.id || null  
            );
        }
    } catch (error) {
        if (popup) { popup.textContent = 'Failed to copy raw data!'; popup.style.display = 'block'; setTimeout(() => { popup.style.display = 'none'; }, 2000); }
    }
};

window.toggleMoreActions = function(button) {
    const dropdown = button.querySelector('.more-actions-dropdown');
    dropdown.classList.toggle('show');
    document.querySelectorAll('.more-actions-dropdown').forEach(d => {
        if (d !== dropdown) d.classList.remove('show');
    });
};

document.addEventListener('click', (e) => {
    if (!e.target.closest('.more-btn')) {
        document.querySelectorAll('.more-actions-dropdown').forEach(d => d.classList.remove('show'));
    }
});

function handleSearchTypeChange(value) {
    currentSearchType = value;
}

function filterAndRenderMaps() {
    const searchText = searchInput ? searchInput.value.toLowerCase() : '';

    filteredMaps = maps.filter(m => {
        let matchesSearch = true;
        if (searchText) {
            switch (currentSearchType) {
                case 'mapname':
                    matchesSearch = m.mapName.toLowerCase().includes(searchText);
                    break;
                case 'artist':
                    matchesSearch = m.artist.toLowerCase().includes(searchText);
                    break;
                case 'mapper':
                    matchesSearch = m.mapper.toLowerCase().includes(searchText);
                    break;
                case 'link':
                    matchesSearch = m.link.toLowerCase().includes(searchText);
                    break;
                default:
                    matchesSearch = m.mapName.toLowerCase().includes(searchText) ||
                        m.artist.toLowerCase().includes(searchText) ||
                        m.mapper.toLowerCase().includes(searchText) ||
                        m.link.toLowerCase().includes(searchText);
            }
        }
        const matchesDifficulty = selectedDifficulties.length === 0 || selectedDifficulties.includes(m.difficulty);
        const matchesPatterns = selectedPatterns.length === 0 || selectedPatterns.every(pattern => m.patterns.includes(pattern));
        const isApm = isApmMap(m.artist);
        let matchesApm = true;
        if (apmFilter === "only") matchesApm = isApm;
        else if (apmFilter === "none") matchesApm = !isApm;
        const mapDuration = m.duration || 0;
        const mapNotes = m.noteCount || 0;
        const matchesDuration = mapDuration >= currentDurationRange.min && mapDuration <= currentDurationRange.max;
        const matchesNotes = mapNotes >= currentNotesRange.min && mapNotes <= currentNotesRange.max;
        const matchesNewFilter = !showNewMapsOnly || m.isNew;
        const matchesFavoritesFilter = !showFavoritesOnly || favoritesManager.isFavorite(m);
        return matchesSearch && matchesDifficulty && matchesPatterns && matchesApm &&
            matchesDuration && matchesNotes && matchesNewFilter && matchesFavoritesFilter;
    });

   filteredMaps.sort((a, b) => {
    const aFav = favoritesManager.isFavorite(a);
    const bFav = favoritesManager.isFavorite(b);
    if (aFav !== bFav) return aFav ? -1 : 1;

    const primaryResult = applySortComparison(a, b, currentSortMode);
    if (primaryResult !== 0) return primaryResult;

    const aNew = a.isNew || false;
    const bNew = b.isNew || false;
    if (aNew !== bNew) return aNew ? -1 : 1;

    if (secondarySortMode && secondarySortMode !== 'none') {
        const secondaryResult = applySortComparison(a, b, secondarySortMode);
        if (secondaryResult !== 0) return secondaryResult;
    }

    return compareByName(a, b);
});

    updateActiveFiltersDisplay();
    renderMaps();
}

function renderMaps() {
    if (!mapGrid) return;
    mapGrid.innerHTML = "";
    const itemsToShow = Math.min(filteredMaps.length, currentDisplayCount);
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < itemsToShow; i++) fragment.appendChild(createMapCard(filteredMaps[i]));
    mapGrid.appendChild(fragment);
    updateLoadMoreButton();
    if (loadingSpinner) loadingSpinner.style.display = 'none';
}

const STATS_CACHE_KEY = 'soundSpaceMapStats';
const STATS_CACHE_TTL = 3 * 24 * 60 * 60 * 1000; // math 

function loadStatsCache() {
    try {
        const raw = localStorage.getItem(STATS_CACHE_KEY);
        if (!raw) return {};
        const { timestamp, stats } = JSON.parse(raw);
        if (Date.now() - timestamp > STATS_CACHE_TTL) {
            localStorage.removeItem(STATS_CACHE_KEY);
            return {};
        }
        return stats;
    } catch (e) { return {}; }
}

function saveStatsCache(stats) {
    try {
        localStorage.setItem(STATS_CACHE_KEY, JSON.stringify({
            timestamp: Date.now(),
            stats
        }));
    } catch (e) {}
}

async function loadMapData() {
    try {
        if (loadingSpinner) loadingSpinner.style.display = 'block';
        await loadMapCopies();
        await loadMapVotes(); 
        initializeMapperLookup();
        const timestamp = Date.now();
        let mapData;
        try {
            const response = await fetch(`Mapdata.json?v=${timestamp}`);
            if (!response.ok) throw new Error('JSON failed');
            mapData = await response.json();
        } catch (jsonError) {
            const response = await fetch(`getMapData.php?v=${timestamp}`);
            if (!response.ok) throw new Error('Both JSON and PHP failed');
            mapData = await response.json();
        }

        const statsCache = loadStatsCache();
        const updatedCache = { ...statsCache };

        const mapPromises = mapData.map(async (mapObj) => {
            if (!mapObj || !mapObj.link) return null;

            const enhancedMapObj = {
                ...mapObj,
                id: mapObj.id || null,
                duration: null,
                noteCount: null,
                copies: getMapCopies(mapObj.id, mapObj.mapper),
                isNew: mapObj.isNew || false,
                starRating: mapObj.starRating ? parseFloat(mapObj.starRating) : null,
                info: mapObj.info || null,
                userId: mapObj.userId || null
            };

            if (statsCache[mapObj.link]) {
                enhancedMapObj.noteCount = statsCache[mapObj.link].noteCount;
                enhancedMapObj.duration  = statsCache[mapObj.link].duration;
                return enhancedMapObj;
            }

            try {
                const rawLink = enhancedMapObj.link
                    .replace('github.com', 'raw.githubusercontent.com')
                    .replace('/blob/', '/');
                const mapResponse = await fetch(rawLink);
                if (mapResponse.ok) {
                    const mapContent = await mapResponse.text();
                    const firstCommaIndex = mapContent.indexOf(',');
                    if (firstCommaIndex !== -1) {
                        const noteArray = mapContent.substring(firstCommaIndex + 1).split(',');
                        enhancedMapObj.noteCount = noteArray.length;
                        if (noteArray.length > 0) {
                            try {
                                const startTime = parseFloat(noteArray[0].split('|')[2]) || 0;
                                const endTime   = parseFloat(noteArray[noteArray.length - 1].split('|')[2]) || 0;
                                enhancedMapObj.duration = Math.max(0, endTime - startTime);
                            } catch (e) {}
                        }
                    }
                }
                updatedCache[mapObj.link] = {
                    noteCount: enhancedMapObj.noteCount,
                    duration:  enhancedMapObj.duration
                };
            } catch (err) {}

            return enhancedMapObj;
        });

        maps = (await Promise.all(mapPromises)).filter(map => map !== null);
        saveStatsCache(updatedCache);
        restoreSearchAndSort();
        initRangeSliders();
        filterAndRenderMaps();
        startVotePolling();
    } catch (error) {
        if (loadingSpinner) loadingSpinner.style.display = 'none';
        if (mapGrid) {
            mapGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #ff6b6b;"><h3>Failed to Load Map Data</h3><p>${error.message}</p><button onclick="location.reload()" style="margin-top: 15px; padding: 10px 20px; background: #4facfe; color: white; border: none; border-radius: 5px; cursor: pointer;">Retry</button></div>`;
        }
    }
}

async function loadMapCopies() {
    try {
        const timestamp = Date.now();
        try {
            const response = await fetch(`MapCopies.json?v=${timestamp}`);
            if (!response.ok) throw new Error('JSON failed');
            mapCopiesData = await response.json();
        } catch (jsonError) {
            const response = await fetch(`getMapCopies.php?v=${timestamp}`);
            if (!response.ok) throw new Error('Both JSON and PHP failed');
            mapCopiesData = await response.json();
        }
    } catch (error) {
        mapCopiesData = {};
    }
}


let normalizedMapperLookup = {};

function initializeMapperLookup() {
    normalizedMapperLookup = {};
    
    if (!mapCopiesData) {
        return;
    }
    
    const entries = Object.entries(mapCopiesData);
    
    for (const [mapperKey, data] of entries) {
        const normalized = mapperKey.toLowerCase().trim();
        normalizedMapperLookup[normalized] = mapperKey;
    }
}

function getMapCopies(mapId, mapper) {
    if (!mapId) {
        return 0;
    }

    if (mapCopiesData) {
        for (const mapperKey in mapCopiesData) {
            const mapperData = mapCopiesData[mapperKey];
            if (mapperData.maps && mapperData.maps[mapId]) {
                return mapperData.maps[mapId].copies || 0;
            }
        }
    }
    
    return 0;
}

function getMapCopiesRobust(mapId, mapper) {
    return getMapCopies(mapId, mapper);
}
let mapVotesData = {};

async function loadMapVotes() {
    try {
        const cached = localStorage.getItem('mapVotesCache');
        const cachedTime = localStorage.getItem('mapVotesCacheTime');
        if (cached && cachedTime && (Date.now() - parseInt(cachedTime)) < 1800000) {
            mapVotesData = JSON.parse(cached);
            return;
        }
        const response = await fetch(MAP_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'getVotes' })
        });
        if (response.ok) {
            const data = await response.json();
            mapVotesData = data.votes || {};
            localStorage.setItem('mapVotesCache', JSON.stringify(mapVotesData));
            localStorage.setItem('mapVotesCacheTime', Date.now().toString());
        }
    } catch (e) {
        mapVotesData = {};
    }
}

async function refreshVotesSilently() {
    try {
        const response = await fetch(MAP_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'getVotes' })
        });
        if (!response.ok) return;
        const data = await response.json();
        const newVotes = data.votes || {};
        const user = window.getDiscordUser ? window.getDiscordUser() : null;

        Object.keys(newVotes).forEach(mapId => {
            const oldData = mapVotesData[mapId] || { likes: 0, dislikes: 0 };
            const newData = newVotes[mapId];

            if (oldData.likes !== newData.likes || oldData.dislikes !== newData.dislikes) {
                document.querySelectorAll(`.ld-btn-full[data-map-id="${mapId}"]`).forEach(btn => {
                    const voteType = btn.dataset.vote;
                    const countEl = btn.querySelector('.ld-count');
                    if (!countEl) return;

                    const oldCount = voteType === 'like' ? oldData.likes : oldData.dislikes;
                    const newCount = voteType === 'like' ? newData.likes : newData.dislikes;

                    if (oldCount !== newCount) {
                        animateCount(countEl, oldCount, newCount);
                    }

                    if (user) {
                        const isLiked    = (newData.likedBy    || []).includes(user.id);
                        const isDisliked = (newData.dislikedBy || []).includes(user.id);
                        if (voteType === 'like')    btn.classList.toggle('liked',    isLiked);
                        if (voteType === 'dislike') btn.classList.toggle('disliked', isDisliked);
                    }
                });
            }
        });

        mapVotesData = newVotes;
    } catch (e) {}
}

function animateCount(el, from, to) {
    if (from === to) return;
    el.classList.remove('count-bump-up', 'count-bump-down');
    void el.offsetWidth;
    el.textContent = to;
    el.classList.add(to > from ? 'count-bump-up' : 'count-bump-down');
    setTimeout(() => el.classList.remove('count-bump-up', 'count-bump-down'), 400);
}

function startVotePolling() {
    setInterval(refreshVotesSilently, 30000);
}
function getMapVotes(mapId) {
    if (!mapId || !mapVotesData[mapId]) return { likes: 0, dislikes: 0, likedBy: [], dislikedBy: [] };
    return mapVotesData[mapId];
}

function loadChangelog() {
    const container = document.getElementById('changelogContent');
    if (!container) return;
    container.innerHTML = '<p style="text-align: center; color: #666;">Loading changelog...</p>';
    fetch('Changelog.json?v=' + Date.now())
        .then(response => {
            if (!response.ok) throw new Error('Failed to load changelog');
            return response.json();
        })
        .then(changelogData => {
            container.innerHTML = '';
            changelogData.forEach(log => {
                const entry = document.createElement('div');
                entry.className = 'changelog-entry';
                entry.innerHTML = `<div class="changelog-version">${log.version}</div><div class="changelog-date">${log.date}</div><ul class="changelog-changes">${log.changes.map(c => `<li>${c}</li>`).join('')}</ul>`;
                container.appendChild(entry);
            });
        })
        .catch(() => {
            container.innerHTML = '<p style="text-align: center; color: #ff6b6b;">Failed to load changelog</p>';
        });
}

document.addEventListener('DOMContentLoaded', () => {
    checkCookieConsent();
    loadMapData();
});

(function () {
    let mc = { mapId:'', notes:[], minMs:0, maxMs:0, dur:0, mode:'sf', sMs:0, eMs:0, dragging:null };

    function fmt(ms) {
        if (!isFinite(ms) || ms < 0) return '0:00';
        const s = Math.floor(ms / 1000);
        return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
    }

    function parseDuration(str) {
        if (!str) return null;
        str = str.trim();
        const parts = str.split(':');
        if (parts.length === 2) {
            const mins = parseInt(parts[0], 10);
            const secs = parseFloat(parts[1]);
            if (isNaN(mins) || isNaN(secs)) return null;
            return (mins * 60 + secs) * 1000;
        }
        const secs = parseFloat(str);
        if (isNaN(secs)) return null;
        return secs * 1000;
    }

    function parseRaw(text) {
        text = text.trim();
        const comma = text.indexOf(',');
        if (comma === -1) return null;
        const mapId = text.substring(0, comma);
        const notes = text.substring(comma + 1).split(',').map(n => {
            const p = n.split('|');
            if (p.length < 3) return null;
            const ms = parseFloat(p[2]);
            return isFinite(ms) ? { x: p[0], y: p[1], ms, raw: n } : null;
        }).filter(Boolean);
        return notes.length ? { mapId, notes } : null;
    }

    window.openStartFrom = window.openMapCutterForCard = async function (link, event) {
        if (event) { event.stopPropagation(); event.preventDefault(); }
        const dropdown = event && event.target.closest('.more-actions-dropdown');
        if (dropdown) dropdown.classList.remove('show');

        mc = { mapId:'', notes:[], minMs:0, maxMs:0, dur:0, mode:'sf', sMs:0, eMs:0, dragging:null };
        const ed = document.getElementById('mcEditor');
        if (ed) { ed.style.display = ''; ed.innerHTML = '<p style="text-align:center;padding:30px;color:rgba(255,255,255,0.4);">loading...</p>'; }
        document.getElementById('startFromModal').classList.add('show');

        try {
            const rawLink = link.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
            const res = await fetch(rawLink);
            if (!res.ok) throw new Error('fetch failed');
            const text = await res.text();
            const parsed = parseRaw(text);
            if (!parsed) throw new Error('invalid map');
            parsed.notes.sort((a, b) => a.ms - b.ms);
            mc.mapId = parsed.mapId;
            mc.notes = parsed.notes;
            mc.minMs = parsed.notes[0].ms;
            mc.maxMs = parsed.notes[parsed.notes.length - 1].ms;
            mc.dur   = mc.maxMs - mc.minMs;
            mc.sMs   = mc.minMs;
            mc.eMs   = mc.maxMs;
            buildEditor();
        } catch (e) {
            if (ed) ed.innerHTML = '<p style="text-align:center;padding:30px;color:#ff6b6b;">failed to load map data</p>';
        }
    };

    function buildEditor() {
        const ed = document.getElementById('mcEditor');
        if (!ed) return;
        ed.innerHTML = `
            <div class="mc-stats-row" id="mcStatsRow">
                <div class="mc-stat"><strong>notes:</strong> ${mc.notes.length.toLocaleString()}</div>
                <div class="mc-stat"><strong>duration:</strong> ${fmt(mc.dur)}</div>
            </div>
            <div class="mc-tabs">
                <button class="mc-tab active" onclick="mcSetMode('sf',this)">start from</button>
                <button class="mc-tab" onclick="mcSetMode('ea',this)">end at</button>
                <button class="mc-tab" onclick="mcSetMode('sl',this)">slice range</button>
            </div>
            <div class="mc-canvas-wrap">
                <canvas id="mcCanvas"></canvas>
                <div class="mc-cut-line mc-cut-s" id="mcCutS" style="left:0%"></div>
                <div class="mc-cut-line mc-cut-e" id="mcCutE" style="left:100%;display:none;"></div>
            </div>
            <div class="filter-section" style="padding-top:0;margin-bottom:8px;">
                <div class="range-slider" style="margin-top:4px;">
                    <div class="slider-inputs">
                        <input type="text" class="slider-input" id="mcTimeS" placeholder="0:00">
                        <input type="text" class="slider-input" id="mcTimeE" placeholder="end" style="display:none;">
                        <input type="text" class="slider-input" id="mcTimeDur" placeholder="kept" readonly>
                    </div>
                    <div class="dual-range-slider" id="mcSliderWrap" style="padding:0;margin:10px 0;">
                        <div style="position:absolute;left:0;right:0;top:50%;transform:translateY(-50%);height:6px;background:rgba(255,255,255,0.15);border-radius:3px;pointer-events:none;"></div>
                        <div class="slider-track" id="mcTrack" style="top:50%;transform:translateY(-50%);height:6px;"></div>
                        <div class="slider-thumb" id="mcThumbS" style="left:0%;"></div>
                        <div class="slider-thumb" id="mcThumbE" style="left:100%;display:none;"></div>
                    </div>
                </div>
            </div>
            <p style="font-size:0.82em;color:rgba(255,255,255,0.4);margin-bottom:12px;text-align:center;">
                keeping <span id="mcNoteCount" style="color:#4facfe;font-weight:600;">${mc.notes.length.toLocaleString()}</span> notes
            </p>
            <button class="start-from-apply" onclick="mcApply()">apply and copy modified map</button>`;

        attachSliderDrag();

        const tS = document.getElementById('mcTimeS');
        const tE = document.getElementById('mcTimeE');
        if (tS) {
            tS.addEventListener('change', () => {
                const ms = parseDuration(tS.value);
                if (ms !== null) {
                    mc.sMs = Math.max(mc.minMs, Math.min(mc.minMs + ms, mc.mode === 'sl' ? mc.eMs - 500 : mc.maxMs));
                    mcUpdateSlider();
                    mcDrawCanvas();
                }
            });
        }
        if (tE) {
            tE.addEventListener('change', () => {
                const ms = parseDuration(tE.value);
                if (ms !== null) {
                    mc.eMs = Math.max(mc.sMs + 500, Math.min(mc.minMs + ms, mc.maxMs));
                    mcUpdateSlider();
                    mcDrawCanvas();
                }
            });
        }

        mcUpdateSlider();
        mcDrawCanvas();
    }

    window.mcSetMode = function (mode, btn) {
        mc.mode = mode;
        mc.sMs = mc.minMs;
        mc.eMs = mc.maxMs;
        document.querySelectorAll('.mc-tab').forEach(t => t.classList.remove('active'));
        if (btn) btn.classList.add('active');
        const show2 = mode === 'sl';
        const tE = document.getElementById('mcTimeE');
        const thumbE = document.getElementById('mcThumbE');
        const cutE = document.getElementById('mcCutE');
        if (tE) tE.style.display = show2 ? '' : 'none';
        if (thumbE) thumbE.style.display = show2 ? '' : 'none';
        if (cutE) cutE.style.display = show2 ? '' : 'none';
        mcUpdateSlider();
        mcDrawCanvas();
        mcUpdateCount();
    };

    window.mcApply = async function () {
        let kept;
        if (mc.mode === 'sf')      kept = mc.notes.filter(n => n.ms >= mc.sMs);
        else if (mc.mode === 'ea') kept = mc.notes.filter(n => n.ms <= mc.sMs);
        else                        kept = mc.notes.filter(n => n.ms >= mc.sMs && n.ms <= mc.eMs);
        if (!kept.length) return;
        const result = mc.mapId + ',' + kept.map(n => n.raw).join(',');
        try {
            await navigator.clipboard.writeText(result);
            const popup = document.getElementById('popup');
            if (popup) { popup.textContent = 'Modified map copied!'; popup.style.display = 'block'; setTimeout(() => popup.style.display = 'none', 2000); }
            closeModal('startFromModal');
            if (window.errorReporter) window.errorReporter.reportMapCopy('Unknown','Unknown','Unknown','start-from');
        } catch(e) {}
    };

    function mcUpdateCount() {
        if (!mc.notes.length) return;
        let kept;
        if (mc.mode === 'sf')      kept = mc.notes.filter(n => n.ms >= mc.sMs).length;
        else if (mc.mode === 'ea') kept = mc.notes.filter(n => n.ms <= mc.sMs).length;
        else                        kept = mc.notes.filter(n => n.ms >= mc.sMs && n.ms <= mc.eMs).length;
        const el = document.getElementById('mcNoteCount');
        if (el) el.textContent = kept.toLocaleString();
    }

    function mcDrawCanvas() {
        const canvas = document.getElementById('mcCanvas');
        if (!canvas || !mc.notes.length || !mc.dur) return;
        const W = canvas.offsetWidth || 480, H = canvas.offsetHeight || 52;
        canvas.width = W; canvas.height = H;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, W, H);
        const BUCKETS = 80, counts = new Array(BUCKETS).fill(0);
        mc.notes.forEach(n => {
            const b = Math.min(BUCKETS - 1, Math.floor(((n.ms - mc.minMs) / mc.dur) * BUCKETS));
            counts[b]++;
        });
        const maxC = Math.max(...counts) || 1;
        const bW = W / BUCKETS;
        for (let i = 0; i < BUCKETS; i++) {
            const h = Math.max(2, (counts[i] / maxC) * H);
            const p = i / BUCKETS;
            const sPct = (mc.sMs - mc.minMs) / mc.dur;
            const ePct = (mc.eMs - mc.minMs) / mc.dur;
            let isKept;
            if (mc.mode === 'sf')       isKept = p >= sPct;
            else if (mc.mode === 'ea')  isKept = p <= sPct;
            else                         isKept = p >= sPct && p <= ePct;
            ctx.fillStyle = isKept ? 'rgba(79,172,254,0.75)' : 'rgba(255,255,255,0.1)';
            ctx.fillRect(i * bW, H - h, bW - 1, h);
        }
    }

    function pct(ms) { return mc.dur > 0 ? ((ms - mc.minMs) / mc.dur) * 100 : 0; }

    function mcUpdateSlider() {
        const thumbS = document.getElementById('mcThumbS');
        const thumbE = document.getElementById('mcThumbE');
        const track  = document.getElementById('mcTrack');
        const cutS   = document.getElementById('mcCutS');
        const cutE   = document.getElementById('mcCutE');
        const tS     = document.getElementById('mcTimeS');
        const tE     = document.getElementById('mcTimeE');
        const tDur   = document.getElementById('mcTimeDur');
        const ps = pct(mc.sMs), pe = pct(mc.eMs);

        if (thumbS) thumbS.style.left = ps + '%';
        if (cutS)   cutS.style.left   = ps + '%';

        if (mc.mode === 'sf') {
            if (track) { track.style.left = '0%'; track.style.width = ps + '%'; }
            if (tS)   tS.value   = fmt(mc.sMs - mc.minMs);
            if (tDur) tDur.value = fmt(mc.maxMs - mc.sMs);
        } else if (mc.mode === 'ea') {
            if (track) { track.style.left = ps + '%'; track.style.width = (100 - ps) + '%'; }
            if (tS)   tS.value   = fmt(mc.sMs - mc.minMs);
            if (tDur) tDur.value = fmt(mc.sMs - mc.minMs);
        } else {
            if (thumbE) thumbE.style.left = pe + '%';
            if (cutE)   cutE.style.left   = pe + '%';
            if (track)  { track.style.left = ps + '%'; track.style.width = (pe - ps) + '%'; }
            if (tS)   tS.value   = fmt(mc.sMs - mc.minMs);
            if (tE)   tE.value   = fmt(mc.eMs - mc.minMs);
            if (tDur) tDur.value = fmt(mc.eMs - mc.sMs);
        }
        mcUpdateCount();
    }

    function attachSliderDrag() {
        const wrap = document.getElementById('mcSliderWrap');
        if (!wrap) return;

        function getMs(e) {
            const rect = wrap.getBoundingClientRect();
            const cx = e.touches ? e.touches[0].clientX : e.clientX;
            const ratio = Math.max(0, Math.min(1, (cx - rect.left) / rect.width));
            return mc.minMs + ratio * mc.dur;
        }

        function onMove(e) {
            if (!mc.dragging) return;
            e.preventDefault();
            const ms = getMs(e);
            if (mc.dragging === 's') {
                mc.sMs = Math.max(mc.minMs, Math.min(ms, mc.mode === 'sl' ? mc.eMs - 500 : mc.maxMs));
            } else {
                mc.eMs = Math.max(mc.sMs + 500, Math.min(ms, mc.maxMs));
            }
            mcUpdateSlider();
            mcDrawCanvas();
        }

        function onEnd() {
            mc.dragging = null;
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onEnd);
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onEnd);
        }

        function startDrag(which, e) {
            e.preventDefault();
            e.stopPropagation();
            mc.dragging = which;
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onEnd);
            document.addEventListener('touchmove', onMove, { passive: false });
            document.addEventListener('touchend', onEnd);
        }

        const thumbS = document.getElementById('mcThumbS');
        const thumbE = document.getElementById('mcThumbE');
        if (thumbS) {
            thumbS.addEventListener('mousedown', e => startDrag('s', e));
            thumbS.addEventListener('touchstart', e => startDrag('s', e), { passive: false });
        }
        if (thumbE) {
            thumbE.addEventListener('mousedown', e => startDrag('e', e));
            thumbE.addEventListener('touchstart', e => startDrag('e', e), { passive: false });
        }

        wrap.addEventListener('mousedown', e => {
            if (e.target.closest('.slider-thumb')) return;
            const ms = getMs(e);
            if (mc.mode === 'sl') {
                if (Math.abs(ms - mc.sMs) <= Math.abs(ms - mc.eMs)) {
                    mc.sMs = Math.max(mc.minMs, Math.min(ms, mc.eMs - 500));
                    startDrag('s', e);
                } else {
                    mc.eMs = Math.max(mc.sMs + 500, Math.min(ms, mc.maxMs));
                    startDrag('e', e);
                }
            } else {
                mc.sMs = Math.max(mc.minMs, Math.min(ms, mc.maxMs));
                startDrag('s', e);
            }
            mcUpdateSlider();
            mcDrawCanvas();
        });
    }

    const observer = new MutationObserver(() => {
        if (document.getElementById('startFromModal')?.classList.contains('show')) {
            setTimeout(mcDrawCanvas, 50);
        }
    });
    const modalEl = document.getElementById('startFromModal');
    if (modalEl) observer.observe(modalEl, { attributes: true, attributeFilter: ['class'] });
})();
