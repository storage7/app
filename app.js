// Point this to your new Cloudflare Worker URL
// Make sure to include the trailing slash if your worker URL has one, or format it exactly as Cloudflare provides.
const WORKER_URL = 'https://abyss-proxy.<YOUR_CLOUDFLARE_USERNAME>.workers.dev/';

// 1. Register Service Worker for PWA (Caching UI, bypassing network for API)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
        .then(() => console.log("Service Worker Registered Successfully"))
        .catch(err => console.error("Service Worker Registration Failed:", err));
}

// 2. Fetch Videos via the Secure Proxy
async function fetchVideos(pageToken = "") {
    try {
        // Build the URL to ask your Worker for data
        let url = WORKER_URL;
        if (pageToken) {
            url += `?pageToken=${pageToken}`; 
        }

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // 3. Render the fetched videos to the grid
        if (data.items && data.items.length > 0) {
            renderVideos(data.items, data.domainEmbed);
        }

        // 4. Handle Pagination
        // If there are more videos, fetch the next page.
        // We use a 1-second timeout (1000ms) to ensure we don't trip the 1200 request/5min rate limit.
        if (data.pageToken) {
            setTimeout(() => fetchVideos(data.pageToken), 1000); 
        }
    } catch (error) {
        console.error("Error fetching videos from proxy:", error);
    }
}

// 5. Render Video Cards to the DOM
function renderVideos(items, domainEmbed) {
    const grid = document.getElementById('video-grid');
    
    items.forEach(video => {
        // Skip folders, we only want to display playable files
        if (video.isDir) return; 

        const card = document.createElement('div');
        card.className = 'video-card';
        
        // Construct the embed iframe and metadata
        card.innerHTML = `
            <div class="iframe-container">
                <iframe src="https://${domainEmbed}/?v=${video.id}" allowfullscreen frameborder="0" scrolling="no"></iframe>
            </div>
            <div class="video-info">
                <h3 class="video-title">${video.name}</h3>
                <div class="video-meta">Resolutions: ${video.resolutions ? video.resolutions.join(', ') : 'Processing...'}</div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// 6. Initialize the app on load
fetchVideos();
