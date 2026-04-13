(function () {
    const storageKey = 'movieflix-jellyfin-provider';
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
    let activeCard = null;

    function readState() {
        const params = new URLSearchParams(window.location.search);
        return {
            query: params.get('query') || '',
            mediaType: params.get('mediaType') || '',
            provider: params.get('provider') || localStorage.getItem(storageKey) || 'vidking'
        };
    }

    function writeState() {
        const params = new URLSearchParams(window.location.search);
        if (queryInput.value.trim()) {
            params.set('query', queryInput.value.trim());
        } else {
            params.delete('query');
        }

        if (mediaTypeSelect.value) {
            params.set('mediaType', mediaTypeSelect.value);
        } else {
            params.delete('mediaType');
        }

        if (providerSelect.value) {
            params.set('provider', providerSelect.value);
        } else {
            params.delete('provider');
        }

        const nextUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ''}`;
        window.history.replaceState({}, '', nextUrl);
        localStorage.setItem(storageKey, providerSelect.value);
    }

    async function search() {
        const query = queryInput.value.trim();
        if (!query) return;
        writeState();

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
            card.className = 'result';
            card.type = 'button';
            card.innerHTML = `
                ${item.posterUrl ? `<img class="thumb" src="${item.posterUrl}" alt="">` : `<div class="thumb"></div>`}
                <div>
                    <div class="title">${item.title}</div>
                    <div class="line">${item.mediaType.toUpperCase()} · ${item.releaseDate ? String(item.releaseDate).slice(0, 4) : '—'}</div>
                    <div class="line">${item.voteAverage ? item.voteAverage.toFixed(1) + ' · ' + item.voteCount + ' votes' : ''}</div>
                </div>
            `;
            card.addEventListener('click', () => selectItem(item, card));
            results.appendChild(card);
        });

        if (data.items.length > 0) {
            selectItem(data.items[0], results.querySelector('.result'));
        }
    }

    async function selectItem(item, card) {
        selected = item;
        if (activeCard) activeCard.classList.remove('active');
        activeCard = card || activeCard;
        if (activeCard) activeCard.classList.add('active');
        viewerTitle.textContent = item.title;
        viewerSubtitle.textContent = item.overview || 'No overview available.';
        const provider = providerSelect.value;
        const playbackUrl = `/MovieFlix/PlaybackUrl?tmdbId=${encodeURIComponent(item.tmdbId)}&mediaType=${encodeURIComponent(item.mediaType)}&provider=${encodeURIComponent(provider)}`;
        const res = await fetch(playbackUrl);
        playback = await res.json();
        playSelectedInline();
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

    function init() {
        const state = readState();
        queryInput.value = state.query;
        mediaTypeSelect.value = state.mediaType;
        providerSelect.value = state.provider;

        if (state.query) {
            search();
        }
    }

    searchBtn.addEventListener('click', search);
    queryInput.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            search();
        }
    });
    providerSelect.addEventListener('change', function () {
        writeState();
        if (selected && activeCard) {
            selectItem(selected, activeCard);
        }
    });
    playInline.addEventListener('click', playSelectedInline);
    openMovieFlix.addEventListener('click', openSelectedMovieFlix);
    init();
})();
