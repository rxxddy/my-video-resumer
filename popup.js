document.addEventListener('DOMContentLoaded', () => {
    loadVideoList();
    initSettings();
});

function initSettings() {
    const panel = document.getElementById('settings-panel');
    const btnSettings = document.getElementById('toggle-settings');
    const btnClearAll = document.getElementById('clear-all');
    
    // Toggle Settings Panel
    btnSettings.addEventListener('click', () => {
        panel.style.display = panel.style.display === 'flex' ? 'none' : 'flex';
    });

    // --- MODAL LOGIC ---
    const modal = document.getElementById('confirm-modal');
    const btnCancel = document.getElementById('modal-cancel');
    const btnConfirm = document.getElementById('modal-confirm');

    // Open Modal
    btnClearAll.addEventListener('click', () => {
        modal.style.display = 'flex';
    });

    // Close Modal
    btnCancel.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Confirm Delete
    btnConfirm.addEventListener('click', () => {
        chrome.storage.local.clear(() => {
            loadVideoList(); 
            // We must re-save settings because .clear() wipes them!
            saveSettings(); 
            modal.style.display = 'none';
        });
    });

    // --- TOGGLES LOGIC ---
    const chkRewind = document.getElementById('setting-rewind');
    const chkSpeed = document.getElementById('setting-speed');
    const chkIncognito = document.getElementById('setting-incognito');

    // Load saved
    chrome.storage.local.get(['pref_rewind', 'pref_speed', 'pref_incognito'], (res) => {
        if (res.pref_rewind !== undefined) chkRewind.checked = res.pref_rewind;
        if (res.pref_speed !== undefined) chkSpeed.checked = res.pref_speed;
        if (res.pref_incognito !== undefined) chkIncognito.checked = res.pref_incognito;
    });

    const saveSettings = () => {
        chrome.storage.local.set({
            pref_rewind: chkRewind.checked,
            pref_speed: chkSpeed.checked,
            pref_incognito: chkIncognito.checked
        });
    };

    chkRewind.addEventListener('change', saveSettings);
    chkSpeed.addEventListener('change', saveSettings);
    chkIncognito.addEventListener('change', saveSettings);
}

// --- VIDEO LIST ---
function loadVideoList() {
    chrome.storage.local.get(null, (items) => {
        const videoListDiv = document.getElementById('video-list');
        videoListDiv.innerHTML = ''; 

        const videoKeys = Object.keys(items).filter(key => key.startsWith('file://'));

        if (videoKeys.length === 0) {
            videoListDiv.innerHTML = '<p>No active playback history found.</p>';
            return;
        }

        videoKeys.forEach(videoKey => {
            const timeInSeconds = items[videoKey];
            const itemDiv = document.createElement('div');
            itemDiv.className = 'video-item';

            const fileNameEncoded = videoKey.substring(videoKey.lastIndexOf('/') + 1);
            const fileNameDecoded = decodeURIComponent(fileNameEncoded).replace(/\.mp4|\.mkv|\.avi|\.webm/i, '');
            const date = new Date(0);
            date.setSeconds(timeInSeconds);
            const formattedTime = date.toISOString().substr(11, 8);

            const infoDiv = document.createElement('div');
            infoDiv.className = 'info-container';

            const titleSpan = document.createElement('span');
            titleSpan.className = 'video-title';
            titleSpan.textContent = fileNameDecoded;
            titleSpan.title = fileNameDecoded;

            const progressSpan = document.createElement('span');
            progressSpan.className = 'video-progress';
            // Убрал SVG иконку часов отсюда, оставил только время
            progressSpan.textContent = formattedTime; 

            infoDiv.appendChild(titleSpan);
            infoDiv.appendChild(progressSpan);

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'actions';

            const openButton = document.createElement('button');
            openButton.className = 'action-btn btn-play';
            openButton.title = 'Resume';
            openButton.innerHTML = `<svg class="btn-icon"><use href="#icon-resume"></use></svg>`;
            openButton.onclick = () => {
                chrome.tabs.create({ url: videoKey });
                window.close();
            };

            const deleteButton = document.createElement('button');
            deleteButton.className = 'action-btn btn-delete';
            deleteButton.title = 'Remove';
            deleteButton.innerHTML = `<svg class="btn-icon"><use href="#icon-trash"></use></svg>`;
            deleteButton.onclick = (e) => {
                e.stopPropagation(); 
                chrome.storage.local.remove(videoKey, () => {
                    itemDiv.style.opacity = '0';
                    itemDiv.style.transform = 'translateX(20px)';
                    setTimeout(() => {
                        itemDiv.remove();
                        if (videoListDiv.children.length === 0) loadVideoList();
                    }, 250);
                });
            };

            actionsDiv.appendChild(openButton);
            actionsDiv.appendChild(deleteButton);
            itemDiv.appendChild(infoDiv);
            itemDiv.appendChild(actionsDiv);
            videoListDiv.appendChild(itemDiv);
        });
    });
}