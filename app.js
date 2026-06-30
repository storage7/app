const WORKER_URL = 'https://abyss-proxy.storage2-7777.workers.dev/';

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => console.error(err));
}

// Track where we are so we can build a "Back" button later if needed
let currentFolderId = "";

async function fetchResources(folderId = "", pageToken = "") {
    const grid = document.getElementById('video-grid');
    
    // Clear the grid if we are opening a new folder (not just loading a new page of the same folder)
    if (!pageToken) {
        grid.innerHTML = '<p style="text-align:center; grid-column: 1 / -1;">Loading...</p>';
    }

    try {
        let url = WORKER_URL;
        const params = new URLSearchParams();
        if (pageToken) params.append('pageToken', pageToken);
        if (folderId) params.append('folderId', folderId);
        
        if (params.toString()) {
            url += `?${params.toString()}`;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        
        // Remove the loading text
        if (!pageToken) grid.innerHTML = ''; 

        // If at root and need a back button to reset
        if (folderId !== "") {
            renderBackButton();
        }

        if (data.items && data.items.length > 0) {
            renderItems(data.items, data.domainEmbed);
        } else if (!pageToken && (!data.items || data.items.length === 0)) {
            grid.innerHTML = '<p style="text-align:center; grid-column: 1 / -1;">This folder is empty.</p>';
        }

        if (data.pageToken) {
            setTimeout(() => fetchResources(folderId, data.pageToken), 1000); 
        }
    } catch (error) {
        console.error("Error fetching resources:", error);
        grid.innerHTML = '<p style="text-align:center; color: red;">Failed to load resources.</p>';
    }
}

function renderBackButton() {
    const grid = document.getElementById('video-grid');
    const backBtn = document.createElement('div');
    backBtn.className = 'video-card folder-card';
    backBtn.innerHTML = `
        <div style="padding: 40px; text-align: center; background: #2a2a2a; font-size: 40px;">🔙</div>
        <div class="video-info">
            <h3 class="video-title">Go Back</h3>
            <div class="video-meta">Return to Root</div>
        </div>
    `;
    // Fetch the root directory again
    backBtn.onclick = () => fetchResources(""); 
    grid.appendChild(backBtn);
}

function renderItems(items, domainEmbed) {
    const grid = document.getElementById('video-grid');
    
    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'video-card';
        
        if (item.isDir) {
            // RENDER A FOLDER
            card.classList.add('folder-card');
            card.innerHTML = `
                <div style="padding: 40px; text-align: center; background: #333; font-size: 50px;">📁</div>
                <div class="video-info">
                    <h3 class="video-title">${item.name}</h3>
                    <div class="video-meta">Folder</div>
                </div>
            `;
            // When clicked, fetch the contents of this specific folder
            card.onclick = () => fetchResources(item.id); 
        } else {
            // RENDER A VIDEO FILE
            card.innerHTML = `
                <div class="iframe-container">
                    <iframe src="https://${domainEmbed}/?v=${item.id}" allowfullscreen frameborder="0" scrolling="no"></iframe>
                </div>
                <div class="video-info">
                    <h3 class="video-title">${item.name}</h3>
                    <div class="video-meta">Resolutions: ${item.resolutions ? item.resolutions.join(', ') : 'Processing...'}</div>
                </div>
            `;
        }
        grid.appendChild(card);
    });
}

// Start by fetching the root directory
fetchResources();
