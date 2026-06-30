// Point this to your new Cloudflare Worker URL
const WORKER_URL = 'https://abyss-proxy.storage2-7777.workers.dev/';

// --- ON-SCREEN VISUAL DEBUGGER ---
const debugDiv = document.createElement('div');
debugDiv.style.cssText = 'background:#222;color:#ff5555;padding:15px;margin:20px;border-radius:5px;border:1px solid #ff3333;font-family:monospace;white-space:pre-wrap;font-size:14px;';
debugDiv.innerHTML = '<strong>System Status:</strong> Diagnostics started... Waiting for fetch.';
document.body.insertBefore(debugDiv, document.body.firstChild);

function logDebug(message, isSuccess = false) {
    if (isSuccess) {
        debugDiv.style.borderColor = '#00ff00';
        debugDiv.style.color = '#00ff00';
    }
    debugDiv.innerHTML = `<strong>System Status:</strong> ${message}`;
}
// ---------------------------------

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
        .then(() => console.log("Service Worker Registered"))
        .catch(err => logDebug(`Service Worker Error: ${err.message}`));
}

async function fetchResources(folderId = "", pageToken = "") {
    const grid = document.getElementById('video-grid');
    
    if (!pageToken) {
        grid.innerHTML = '<p style="text-align:center; grid-column: 1 / -1;">Loading configuration...</p>';
    }

    try {
        let url = WORKER_URL;
        const params = new URLSearchParams();
        if (pageToken) params.append('pageToken', pageToken);
        if (folderId) params.append('folderId', folderId);
        
        if (params.toString()) {
            url += `?${params.toString()}`;
        }

        logDebug(`Attempting to connect to proxy: ${url}`);

        const response = await fetch(url);
        
        logDebug(`Received response from proxy. Status Code: ${response.status} (${response.statusText})`);

        if (!response.ok) {
            throw new Error(`Proxy returned an error code: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Check if the data has an explicit error from the worker
        if (data.error) {
            throw new Error(`Worker Backend Error: ${data.error}`);
        }

        logDebug(`Successfully parsed JSON! Found ${data.items ? data.items.length : 0} items.`, true);
        
        if (!pageToken) grid.innerHTML = ''; 

        if (folderId !== "") {
            renderBackButton();
        }

        if (data.items && data.items.length > 0) {
            renderItems(data.items, data.domainEmbed);
        } else if (!pageToken) {
            grid.innerHTML = '<p style="text-align:center; grid-column: 1 / -1;">This folder is empty.</p>';
        }

        if (data.pageToken) {
            setTimeout(() => fetchResources(folderId, data.pageToken), 1000); 
        }
    } catch (error) {
        console.error(error);
        logDebug(`CRITICAL ERROR: ${error.message}\n\nPossible fixes:\n1. Verify your Worker URL is 100% correct.\n2. Ensure you saved your Abyss API key as 'ABYSS_API_KEY' in Cloudflare environment variables.`);
        grid.innerHTML = '<p style="text-align:center; color: red;">Failed to load resources. See debug window above.</p>';
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
    backBtn.onclick = () => fetchResources(""); 
    grid.appendChild(backBtn);
}

function renderItems(items, domainEmbed) {
    const grid = document.getElementById('video-grid');
    
    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'video-card';
        
        if (item.isDir) {
            card.classList.add('folder-card');
            card.innerHTML = `
                <div style="padding: 40px; text-align: center; background: #333; font-size: 50px;">📁</div>
                <div class="video-info">
                    <h3 class="video-title">${item.name}</h3>
                    <div class="video-meta">Folder</div>
                </div>
            `;
            card.onclick = () => fetchResources(item.id); 
        } else {
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

fetchResources();
