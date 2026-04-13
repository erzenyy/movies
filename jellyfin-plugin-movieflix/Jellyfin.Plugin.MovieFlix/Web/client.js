(function () {
    const queryInput = document.getElementById('query');
    const mediaTypeSelect = document.getElementById('mediaType');
    const providerSelect = document.getElementById('provider');
    const searchBtn = document.getElementById('searchBtn');
    const results = document.getElementById('results');
    const viewerTitle = document.getElementById('viewerTitle');
    const viewerSubtitle = document.getElementById('viewerSubtitle');
    const viewerFrameWrap = document.getElementById('viewerFrameWrap');
    const playInline = document.getElementById('playInline');
    const openMovieFlix = document.getElementById('openMovieFlix');

    let selected = null;
    let playback = null;

    async function search() {
        const query = queryInput.value.trim();
        if (!query) return;

        results.innerHTML = '<div class="empty" style="grid-column:1/-1">Searching…</div>';
        const mediaType = mediaTypeSelect.value;
        const url = '/MovieFlix/Search?query=' + encodeURIComponent(query) + (mediaType ? '&mediaType=' + encodeURIComponent(mediaType) : '');
        const res = await fetch(url);
        const data = await res.json();

        if (!Array.isArray(data.items) || data.items.length === 0) {
            results.innerHTML = '<div class="empty" style="grid-column:1/-1">No titles found.</div>';
            return;
        }

        results.innerHTML = '';
        data.items.forEach((item) => {
            const card = document.createElement('button');
            card.className = 'card';
            card.type = 'button';
            card.innerHTML = `
                ${item.posterUrl ? `<img class="poster" src="${item.posterUrl}" alt="">` : `<div class="poster"></div>`}
                <div class="meta">
                    <div class="title">${item.title}</div>
                    <div class="line">${item.mediaType.toUpperCase()} · ${item.releaseDate ? String(item.releaseDate).slice(0, 4) : '—'}</div>
                    <div class="line">${item.voteAverage ? item.voteAverage.toFixed(1) + ' · ' + item.voteCount + ' votes' : ''}</div>
                </div>
            `;
            card.addEventListener('click', () => selectItem(item));
            results.appendChild(card);
        });
    }

    async function selectItem(item) {
        selected = item;
        viewerTitle.textContent = item.title;
        viewerSubtitle.textContent = item.overview || 'No overview available.';
        const provider = providerSelect.value;
        const playbackUrl = `/MovieFlix/PlaybackUrl?tmdbId=${encodeURIComponent(item.tmdbId)}&mediaType=${encodeURIComponent(item.mediaType)}&provider=${encodeURIComponent(provider)}`;
        const res = await fetch(playbackUrl);
        playback = await res.json();
    }

    function playSelectedInline() {
        if (!selected || !playback || !playback.embedUrl) return;
        viewerFrameWrap.className = '';
        viewerFrameWrap.innerHTML = `<iframe src="${playback.embedUrl}" allowfullscreen referrerpolicy="no-referrer"></iframe>`;
    }

    function openSelectedMovieFlix() {
        if (!playback || !playback.watchUrl) return;
        window.open(playback.watchUrl, '_blank', 'noopener,noreferrer');
    }

    searchBtn.addEventListener('click', search);
    queryInput.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            search();
        }
    });
    playInline.addEventListener('click', playSelectedInline);
    openMovieFlix.addEventListener('click', openSelectedMovieFlix);
})();
