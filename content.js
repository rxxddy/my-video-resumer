/**
 * Browser Extension: Local Media Resumer & Booster
 * Features: Settings Listener, Custom UI, Speed/Audio Control
 */

(function () {
    'use strict';

    const CONFIG = {
        storageKey: window.location.href,
        video: {
            keyStep: 5, btnStep: 10, arrowStep: 5,
            saveInterval: 2000, completionThreshold: 90,
            controlsColor: '#EE5325',
            glassBackground: 'rgba(20, 20, 23, 0.90)', 
            glassBorder: 'rgba(255, 255, 255, 0.1)',
            minSpeed: 0.5, maxSpeed: 3.0, stepSpeed: 0.25
        },
        pdf: { scrollDebounce: 500, renderDelayRetries: [0, 500, 1500] }
    };

    const ICONS = {
        arrow: `<svg version="1.2" baseProfile="tiny" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="18" height="18" style="display: block;"><path fill="none" stroke="${CONFIG.video.controlsColor}" stroke-width="20" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" d="m216.55 120.691-91.376-61.313C118.471 55.51 113 58.674 113 66.414v40.869L45.803 59.379C39.1 55.51 34 58.674 34 66.414v122.625c0 7.74 5.148 10.906 11.852 7.037L113 148.125v40.914c0 7.74 5.52 10.906 12.223 7.037l91.046-61.313c6.702-3.87 6.984-10.202.281-14.072z"/></svg>`,
        dragHandle: `<svg viewBox="0 0 24 24" width="12" height="12" fill="#666" style="display: block;"><path d="M9 3H11V21H9V3ZM13 3H15V21H13V3Z" /></svg>`,
        incognitoOn: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#F75A68" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`,
        incognitoOff: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#ccc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`
    };

    function initVideoHandler() {
        const video = document.querySelector('video');
        if (!video) return;

        let isIncognito = false;

        // --- REFERENCES TO UI ELEMENTS ---
        // We need these to toggle visibility dynamically
        const uiRefs = {
            rewindBtn: null,
            forwardBtn: null,
            speedContainer: null,
            incognitoBtn: null,
            separators: []
        };

        // --- SETTINGS MANAGEMENT ---
        const applyVisibilitySettings = () => {
            chrome.storage.local.get(['pref_rewind', 'pref_speed', 'pref_incognito'], (prefs) => {
                // Default to true if undefined
                const showRewind = prefs.pref_rewind !== false;
                const showSpeed = prefs.pref_speed !== false;
                const showIncognito = prefs.pref_incognito !== false;

                if (uiRefs.rewindBtn) uiRefs.rewindBtn.style.display = showRewind ? 'flex' : 'none';
                if (uiRefs.forwardBtn) uiRefs.forwardBtn.style.display = showRewind ? 'flex' : 'none';
                if (uiRefs.speedContainer) uiRefs.speedContainer.style.display = showSpeed ? 'flex' : 'none';
                if (uiRefs.incognitoBtn) uiRefs.incognitoBtn.style.display = showIncognito ? 'flex' : 'none';
                
                // Optional: Hide separators if neighbors are hidden (simplified logic: just keep them or hide all if needed)
                // For a polished look, you might want more complex logic, but this is usually fine.
            });
        };

        // Listen for changes from Popup
        chrome.storage.onChanged.addListener((changes, namespace) => {
            if (namespace === 'local') {
                if (changes.pref_rewind || changes.pref_speed || changes.pref_incognito) {
                    applyVisibilitySettings();
                }
            }
        });

        const restoreState = () => {
            chrome.storage.local.get([CONFIG.storageKey, 'user_preferred_speed'], (result) => {
                if (result[CONFIG.storageKey]) video.currentTime = result[CONFIG.storageKey];
                if (result.user_preferred_speed) {
                    const s = parseFloat(result.user_preferred_speed);
                    video.playbackRate = s;
                    if (typeof updateSpeedUI === 'function') updateSpeedUI(s);
                }
            });
            // Apply visibility on load
            applyVisibilitySettings();
        };

        const saveProgress = () => {
            if (isIncognito) return; 
            if (isNaN(video.duration) || video.duration === 0) return;
            const completion = (video.currentTime / video.duration) * 100;
            if (completion >= CONFIG.video.completionThreshold) {
                chrome.storage.local.remove(CONFIG.storageKey);
            } else if (video.currentTime > 0) {
                chrome.storage.local.set({ [CONFIG.storageKey]: video.currentTime });
            }
        };

        const setSpeed = (val) => {
            const numericVal = parseFloat(val);
            video.playbackRate = numericVal;
            chrome.storage.local.set({ 'user_preferred_speed': numericVal });
            if (typeof updateSpeedUI === 'function') updateSpeedUI(numericVal);
        };

        const toggleIncognito = () => {
            isIncognito = !isIncognito;
            if (typeof updateIncognitoUI === 'function') updateIncognitoUI(isIncognito);
        };

        let updateSpeedUI = () => {};
        let updateIncognitoUI = () => {};

        const createControls = () => {
            const container = document.createElement('div');
            container.style.cssText = `
                position: fixed; bottom: 40px; left: 50%; transform: translateX(-50%);
                background-color: ${CONFIG.video.glassBackground}; backdrop-filter: blur(12px);
                border: 1px solid ${CONFIG.video.glassBorder}; border-radius: 16px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.4); display: flex; align-items: center;
                gap: 6px; z-index: 2147483647; padding: 6px 10px; transition: opacity 0.3s;
            `;

            const btnBaseStyle = `
                background: transparent; border: none; cursor: pointer; padding: 6px;
                display: flex; align-items: center; justify-content: center; border-radius: 8px;
                color: #e1e1e6; font-family: 'Segoe UI', sans-serif; font-size: 13px; font-weight: 600;
                transition: background 0.2s; min-width: 32px;
            `;

            const createSliderPopup = (min, max, step, initial, onInput) => {
                const wrapper = document.createElement('div');
                wrapper.style.cssText = `
                    position: absolute; bottom: 110%; left: 50%; transform: translateX(-50%);
                    background-color: ${CONFIG.video.glassBackground}; backdrop-filter: blur(12px);
                    border: 1px solid ${CONFIG.video.glassBorder}; border-radius: 12px; padding: 10px 14px;
                    display: none; flex-direction: column; align-items: center;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.5); width: 140px; padding-bottom: 20px;
                `;
                const range = document.createElement('input');
                range.type = 'range'; range.min = min; range.max = max; range.step = step; range.value = initial;
                range.style.cssText = `width: 100%; height: 6px; cursor: pointer; accent-color: ${CONFIG.video.controlsColor};`;
                const label = document.createElement('span');
                label.innerText = initial + 'x';
                label.style.cssText = 'font-size:11px; color:#fff; margin-bottom:8px; font-weight:bold;';
                range.oninput = (e) => { onInput(e.target.value); label.innerText = e.target.value + 'x'; };
                wrapper.appendChild(label); wrapper.appendChild(range);
                return { wrapper, range, label };
            };

            const dragHandle = document.createElement('div');
            dragHandle.innerHTML = ICONS.dragHandle;
            dragHandle.style.cssText = `padding: 4px; cursor: grab; opacity: 0.5; margin-right:4px;`;

            const createBtn = (html, action, rotate=false) => {
                const b = document.createElement('button');
                b.innerHTML = html; b.style.cssText = btnBaseStyle;
                if(rotate) b.firstElementChild.style.transform = 'rotate(180deg)';
                b.onclick = action;
                b.onmouseover = () => b.style.backgroundColor = 'rgba(255,255,255,0.1)';
                b.onmouseout = () => b.style.backgroundColor = 'transparent';
                return b;
            };

            // Buttons
            const btnBack = createBtn(ICONS.arrow, () => { video.currentTime -= CONFIG.video.btnStep; saveProgress(); }, true);
            const btnFwd = createBtn(ICONS.arrow, () => { video.currentTime += CONFIG.video.btnStep; saveProgress(); });
            
            // Store refs
            uiRefs.rewindBtn = btnBack;
            uiRefs.forwardBtn = btnFwd;

            const speedContainer = document.createElement('div');
            speedContainer.style.cssText = `position: relative; display: flex; align-items: center;`;
            const btnSpeed = document.createElement('button');
            btnSpeed.style.cssText = btnBaseStyle + "width: 45px; font-weight:700;"; btnSpeed.innerText = "1.0x";
            const speedPopup = createSliderPopup(CONFIG.video.minSpeed, CONFIG.video.maxSpeed, CONFIG.video.stepSpeed, 1.0, setSpeed);
            speedContainer.appendChild(speedPopup.wrapper); speedContainer.appendChild(btnSpeed);
            let speedTimer;
            speedContainer.onmouseenter = () => { clearTimeout(speedTimer); speedPopup.wrapper.style.display = 'flex'; };
            speedContainer.onmouseleave = () => { speedTimer = setTimeout(() => speedPopup.wrapper.style.display = 'none', 300); };
            speedPopup.wrapper.onmouseenter = () => clearTimeout(speedTimer);
            updateSpeedUI = (val) => {
                btnSpeed.innerText = val + 'x'; btnSpeed.style.color = val === 1.0 ? '#ccc' : CONFIG.video.controlsColor;
                speedPopup.range.value = val; speedPopup.label.innerText = val + 'x';
            };
            uiRefs.speedContainer = speedContainer;

            const btnIncognito = createBtn(ICONS.incognitoOff, toggleIncognito);
            updateIncognitoUI = (active) => {
                btnIncognito.innerHTML = active ? ICONS.incognitoOn : ICONS.incognitoOff;
                btnIncognito.style.opacity = active ? '1' : '0.6';
            };
            uiRefs.incognitoBtn = btnIncognito;

            const sep = () => {
                const d = document.createElement('div');
                d.style.cssText = `width:1px; height:18px; background:rgba(255,255,255,0.1); margin:0 2px;`;
                return d;
            }

            container.appendChild(dragHandle);
            container.appendChild(btnBack);
            container.appendChild(btnFwd);
            container.appendChild(sep());
            container.appendChild(speedContainer);
            container.appendChild(sep());
            container.appendChild(btnIncognito);

            document.body.appendChild(container);
            makeDraggable(container, dragHandle);
        };

        const handleKeys = (e) => {
            if (/INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
            if (e.ctrlKey || e.altKey || e.metaKey) return; 
            switch(e.code) {
                case 'KeyJ': video.currentTime -= CONFIG.video.keyStep; saveProgress(); break;
                case 'KeyL': video.currentTime += CONFIG.video.keyStep; saveProgress(); break;
                case 'ArrowLeft': video.currentTime -= CONFIG.video.arrowStep; saveProgress(); break;
                case 'ArrowRight': video.currentTime += CONFIG.video.arrowStep; saveProgress(); break;
                case 'Space': case 'KeyK': e.preventDefault(); video.paused ? video.play() : video.pause(); break;
                case 'KeyF': document.fullscreenElement ? document.exitFullscreen() : video.requestFullscreen(); break;
                case 'KeyI': toggleIncognito(); break;
            }
        };

        createControls();
        restoreState();
        document.addEventListener('keydown', handleKeys);
        setInterval(() => !video.paused && saveProgress(), CONFIG.video.saveInterval);
        window.addEventListener('beforeunload', saveProgress);
        video.addEventListener('pause', saveProgress);
    }

    function makeDraggable(el, handle) {
        let isDragging = false, startX, startY, initLeft, initTop;
        handle.onmousedown = (e) => {
            e.preventDefault(); isDragging = true; handle.style.cursor = 'grabbing';
            const rect = el.getBoundingClientRect();
            startX = e.clientX; startY = e.clientY;
            initLeft = rect.left; initTop = rect.top;
            el.style.transform = 'none'; el.style.bottom = 'auto'; el.style.left = initLeft + 'px'; el.style.top = initTop + 'px';
        };
        document.onmousemove = (e) => {
            if(!isDragging) return;
            el.style.left = (initLeft + e.clientX - startX) + 'px'; el.style.top = (initTop + e.clientY - startY) + 'px';
        };
        document.onmouseup = () => { isDragging = false; handle.style.cursor = 'grab'; };
    }

    function initPdfHandler() {
        if (!document.contentType?.includes('pdf') && !location.href.endsWith('.pdf')) return;
        let timeout;
        const save = () => chrome.storage.local.set({ [CONFIG.storageKey]: window.scrollY });
        window.onscroll = () => { clearTimeout(timeout); timeout = setTimeout(save, CONFIG.pdf.scrollDebounce); };
        const restore = () => chrome.storage.local.get([CONFIG.storageKey], r => {
            if(r[CONFIG.storageKey]) CONFIG.pdf.renderDelayRetries.forEach(d => setTimeout(() => window.scrollTo(0, r[CONFIG.storageKey]), d));
        });
        document.readyState === 'complete' ? restore() : window.onload = restore;
    }

    initVideoHandler();
    initPdfHandler();
})();