(function () {
    var storageKey = 'movieflix-jellyfin-provider';
    var queryInput = document.getElementById('query');
    var mediaTypeSelect = document.getElementById('mediaType');
    var providerSelect = document.getElementById('provider');
    var searchBtn = document.getElementById('searchBtn');
    var results = document.getElementById('results');
    var viewerTitle = document.getElementById('viewerTitle');
    var viewerSubtitle = document.getElementById('viewerSubtitle');
    var viewerFrameWrap = document.getElementById('viewerFrameWrap');
    var playInline = document.getElementById('playInline');
    var openMovieFlix = document.getElementById('openMovieFlix');

    var selected = null;
    var playback = null;
    var activeCard = null;
    var searching = false;

    function readState() {
        var params = new URLSearchParams(window.location.search);
        return {
            query: params.get('query') || '',
            mediaType: params.get('mediaType') || '',
            provider: params.get('provider') || localStorage.getItem(storageKey) || 'vidking'
        };
    }

    function writeState() {
        var params = new URLSearchParams(window.location.search);
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

        var nextUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
        window.history.replaceState({}, '', nextUrl);
        try { localStorage.setItem(storageKey, providerSelect.value); } catch (e) {}
    }

    function search() {
        var query = queryInput.value.trim();
        if (!query || searching) return;
        writeState();
        searching = true;
        searchBtn.disabled = true;
        searchBtn.textContent = 'Searching…';

        results.innerHTML = '<div class="empty">Searching…</div>';
        var mediaType = mediaTypeSelect.value;
        var url = '/MovieFlix/Search?query=' + encodeURIComponent(query) + (mediaType ? '&mediaType=' + encodeURIComponent(mediaType) : '');

        fetch(url).then(function (res) {
            if (!res.ok) return res.text().then(function (t) { throw new Error(t || 'HTTP ' + res.status); });
            return res.json();
        }).then(function (data) {
            if (!Array.isArray(data.items) || data.items.length === 0) {
                results.innerHTML = '<div class="empty">No titles found.</div>';
                return;
            }

            results.innerHTML = '';
            data.items.forEach(function (item) {
                var card = document.createElement('button');
                card.className = 'result';
                card.type = 'button';
                var posterHtml = item.posterUrl
                    ? '<img class="thumb" src="' + item.posterUrl + '" alt="" loading="lazy">'
                    : '<div class="thumb"></div>';
                card.innerHTML =
                    posterHtml +
                    '<div>' +
                        '<div class="title">' + escHtml(item.title) + '</div>' +
                        '<div class="line">' + (item.mediaType || 'movie').toUpperCase() + ' \u00b7 ' + (item.releaseDate ? String(item.releaseDate).slice(0, 4) : '\u2014') + '</div>' +
                        '<div class="line">' + (item.voteAverage ? item.voteAverage.toFixed(1) + ' \u00b7 ' + item.voteCount + ' votes' : '') + '</div>' +
                    '</div>';
                card.addEventListener('click', function () { selectItem(item, card); });
                results.appendChild(card);
            });

            if (data.items.length > 0) {
                selectItem(data.items[0], results.querySelector('.result'));
            }
        }).catch(function (err) {
            var msg = (err && err.message) ? err.message : 'Search failed.';
            results.innerHTML = '<div class="empty">' + escHtml(msg) + '</div>';
        }).finally(function () {
            searching = false;
            searchBtn.disabled = false;
            searchBtn.textContent = 'Search';
        });
    }

    function selectItem(item, card) {
        selected = item;
        if (activeCard) activeCard.classList.remove('active');
        activeCard = card || activeCard;
        if (activeCard) activeCard.classList.add('active');
        viewerTitle.textContent = item.title;
        viewerSubtitle.textContent = item.overview || 'No overview available.';

        viewerFrameWrap.classList.add('frame-wrap');
        viewerFrameWrap.innerHTML = '<div class="empty">Loading player…</div>';

        var prov = providerSelect.value;
        var playbackUrl = '/MovieFlix/PlaybackUrl?tmdbId=' + encodeURIComponent(item.tmdbId) +
            '&mediaType=' + encodeURIComponent(item.mediaType) +
            '&provider=' + encodeURIComponent(prov);

        fetch(playbackUrl).then(function (res) {
            if (!res.ok) return res.text().then(function (t) { throw new Error(t || 'HTTP ' + res.status); });
            return res.json();
        }).then(function (data) {
            playback = data;
            if (!data.embedUrl) {
                viewerFrameWrap.innerHTML = '<div class="empty">No playback URL available.</div>';
                return;
            }
            viewerFrameWrap.innerHTML = '<iframe src="' + data.embedUrl + '" allowfullscreen referrerpolicy="no-referrer" allow="autoplay; fullscreen; encrypted-media; picture-in-picture"></iframe>';
        }).catch(function (err) {
            playback = null;
            var msg = (err && err.message) ? err.message : 'Failed to load player.';
            viewerFrameWrap.innerHTML = '<div class="empty">' + escHtml(msg) + '</div>';
        });
    }

    function playSelectedInline() {
        if (!selected || !playback || !playback.embedUrl) return;
        viewerFrameWrap.classList.add('frame-wrap');
        viewerFrameWrap.innerHTML = '<iframe src="' + playback.embedUrl + '" allowfullscreen referrerpolicy="no-referrer" allow="autoplay; fullscreen; encrypted-media; picture-in-picture"></iframe>';
    }

    function openSelectedMovieFlix() {
        if (!playback || !playback.watchUrl) return;
        window.open(playback.watchUrl, '_blank', 'noopener,noreferrer');
    }

    function escHtml(s) {
        var d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    }

    function init() {
        var state = readState();
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
