/**
 * MovieFlix native Jellyfin integration.
 *
 * Injects a sidebar link and renders a full-screen native search + player UI
 * directly in the Jellyfin DOM. Video playback uses a single iframe — no
 * nested iframes, no embedded app pages.
 *
 * Placeholder __MOVIEFLIX_PUBLIC_URL__ is replaced server-side by the plugin.
 */
(function () {
    'use strict';

    var _rawPublicUrl = '__MOVIEFLIX_PUBLIC_URL__';
    var PUBLIC_URL = (_rawPublicUrl && _rawPublicUrl.indexOf('__') !== 0) ? _rawPublicUrl : '';
    var ROUTE = '#!/movieflix';
    var API = '/MovieFlix';
    var STORAGE_KEY = 'movieflix-jf-provider';
    var PROVIDERS = [
        { id: 'vidking',     label: 'Vidking',     tag: 'Default' },
        { id: 'vidsrc',      label: 'VidSrc',      tag: 'Community' },
        { id: 'multiembed',  label: 'MultiEmbed',  tag: 'Community' },
        { id: 'moviesapi',   label: 'MoviesAPI',   tag: 'Community' }
    ];

    var rootEl = null;
    var isActive = false;
    var selectedItem = null;
    var healthData = null;

    // ── helpers ──────────────────────────────────────────────────────────
    function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
    function $(sel, ctx) { return (ctx || rootEl).querySelector(sel); }
    function $$(sel, ctx) { return (ctx || rootEl).querySelectorAll(sel); }
    function provider()    { try { return localStorage.getItem(STORAGE_KEY) || 'vidking'; } catch(e) { return 'vidking'; } }
    function setProvider(p){ try { localStorage.setItem(STORAGE_KEY, p); } catch(e) {} }

    // ── CSS (injected once) ─────────────────────────────────────────────
    function injectStyles() {
        if (document.getElementById('mfx-css')) return;
        var s = document.createElement('style');
        s.id = 'mfx-css';
        s.textContent = [
            '.mfx{display:none;position:fixed;inset:0;z-index:999;background:#101014;color:#e4e4e7;font:14px/1.5 system-ui,-apple-system,sans-serif;flex-direction:column}',
            '.mfx.open{display:flex}',

            /* header */
            '.mfx-hdr{display:flex;align-items:center;gap:14px;padding:10px 20px;border-bottom:1px solid rgba(255,255,255,.08);background:rgba(16,16,20,.96);backdrop-filter:blur(10px);flex-shrink:0}',
            '.mfx-brand{font-size:17px;font-weight:700;letter-spacing:-.03em;white-space:nowrap}',
            '.mfx-brand b{color:#e50914;font-weight:inherit}',
            '.mfx-back{background:0 0;border:1px solid rgba(255,255,255,.12);color:#a1a1aa;padding:5px 12px;font-size:12px;cursor:pointer;border-radius:5px;transition:all 120ms}',
            '.mfx-back:hover{background:rgba(255,255,255,.06);color:#fff;border-color:rgba(255,255,255,.22)}',
            '.mfx-sbar{display:flex;gap:6px;flex:1;max-width:640px}',
            '.mfx-sin{flex:1;height:36px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:#fff;padding:0 12px;font-size:13px;border-radius:5px;outline:0;transition:border-color 120ms}',
            '.mfx-sin:focus{border-color:#e50914}',
            '.mfx-sin::placeholder{color:#52525b}',
            '.mfx-sel{height:36px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:#d4d4d8;padding:0 8px;font-size:12px;border-radius:5px;cursor:pointer}',
            '.mfx-sbtn{height:36px;padding:0 16px;background:#e50914;border:0;color:#fff;font-size:12px;font-weight:600;cursor:pointer;border-radius:5px;transition:background 120ms}',
            '.mfx-sbtn:hover{background:#c40812}',
            '.mfx-sbtn:disabled{opacity:.5;cursor:not-allowed}',

            /* body */
            '.mfx-body{flex:1;display:grid;grid-template-columns:370px 1fr;overflow:hidden}',
            '@media(max-width:860px){.mfx-body{grid-template-columns:1fr}.mfx-play{display:none}.mfx-body.has-player .mfx-rail{display:none}.mfx-body.has-player .mfx-play{display:flex}.mfx-mob{display:inline-flex !important}}',

            /* rail */
            '.mfx-rail{border-right:1px solid rgba(255,255,255,.06);overflow-y:auto;overscroll-behavior:contain}',
            '.mfx-empty{display:flex;align-items:center;justify-content:center;height:100%;color:#52525b;font-size:13px;padding:24px;text-align:center}',
            '.mfx-card{display:grid;grid-template-columns:50px 1fr;gap:10px;padding:12px 18px;border:0;border-bottom:1px solid rgba(255,255,255,.05);cursor:pointer;background:0 0;color:inherit;text-align:left;font:inherit;width:100%;transition:background 80ms}',
            '.mfx-card:hover{background:rgba(255,255,255,.03)}',
            '.mfx-card.sel{background:rgba(229,9,20,.08);box-shadow:inset 3px 0 0 #e50914}',
            '.mfx-poster{width:50px;aspect-ratio:2/3;object-fit:cover;border-radius:3px;background:#1a1a20}',
            '.mfx-ct{font-size:13px;font-weight:600;line-height:1.3;color:#f4f4f5}',
            '.mfx-cm{font-size:11px;color:#71717a;margin-top:2px}',
            '.mfx-cr{font-size:11px;color:#a1a1aa;margin-top:1px}',

            /* player panel */
            '.mfx-play{display:flex;flex-direction:column;overflow:hidden}',
            '.mfx-pi{padding:14px 20px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0}',
            '.mfx-pt{font-size:18px;font-weight:700;letter-spacing:-.02em;color:#fafafa}',
            '.mfx-pd{margin-top:4px;font-size:12px;color:#a1a1aa;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
            '.mfx-pbar{display:flex;align-items:center;gap:6px;padding:8px 20px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0;flex-wrap:wrap}',
            '.mfx-pb{padding:5px 12px;font-size:11px;font-weight:500;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:#a1a1aa;cursor:pointer;border-radius:4px;transition:all 100ms}',
            '.mfx-pb:hover{background:rgba(255,255,255,.08);color:#d4d4d8}',
            '.mfx-pb.on{background:rgba(229,9,20,.12);border-color:#e50914;color:#fff}',
            '.mfx-pf{flex:1;position:relative;background:#000;min-height:0}',
            '.mfx-pf iframe{position:absolute;inset:0;width:100%;height:100%;border:0}',
            '.mfx-pe{display:flex;align-items:center;justify-content:center;height:100%;color:#3f3f46;font-size:13px}',
            '.mfx-mob{display:none;padding:5px 12px;font-size:11px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:#a1a1aa;cursor:pointer;border-radius:4px}',

            /* open-in-app link */
            '.mfx-open{margin-left:auto;padding:5px 12px;font-size:11px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);color:#71717a;text-decoration:none;border-radius:4px;transition:all 100ms}',
            '.mfx-open:hover{background:rgba(255,255,255,.08);color:#d4d4d8}'
        ].join('\n');
        document.head.appendChild(s);
    }

    // ── build root DOM ──────────────────────────────────────────────────
    function build() {
        if (rootEl) return rootEl;
        injectStyles();

        rootEl = document.createElement('div');
        rootEl.className = 'mfx';
        rootEl.innerHTML =
            '<div class="mfx-hdr">' +
                '<button class="mfx-back" data-a="close">\u2190 Back to Jellyfin</button>' +
                '<div class="mfx-brand">Movie<b>Flix</b></div>' +
                '<div class="mfx-sbar">' +
                    '<input class="mfx-sin" type="search" placeholder="Search movies &amp; TV shows\u2026" />' +
                    '<select class="mfx-sel" data-r="mt">' +
                        '<option value="">All</option>' +
                        '<option value="movie">Movies</option>' +
                        '<option value="tv">TV Shows</option>' +
                    '</select>' +
                    '<button class="mfx-sbtn" data-a="search">Search</button>' +
                '</div>' +
            '</div>' +
            '<div class="mfx-body">' +
                '<div class="mfx-rail"><div class="mfx-empty">Search for a movie or TV show to get started.</div></div>' +
                '<div class="mfx-play">' +
                    '<div class="mfx-pi">' +
                        '<div class="mfx-pt" data-r="pt">Select a title</div>' +
                        '<div class="mfx-pd" data-r="pd">Pick a result from the list to start watching.</div>' +
                    '</div>' +
                    '<div class="mfx-pbar" data-r="pbar"></div>' +
                    '<div class="mfx-pf" data-r="pf"><div class="mfx-pe">No video loaded</div></div>' +
                '</div>' +
            '</div>';

        // wire events
        var input = $('.mfx-sin');
        var go = function () { doSearch(input.value.trim(), $('[data-r="mt"]').value); };
        $('[data-a="search"]').addEventListener('click', go);
        input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); go(); } });
        $('[data-a="close"]').addEventListener('click', deactivate);

        // provider bar
        buildProviders();

        // escape to close
        rootEl.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') { e.stopPropagation(); deactivate(); }
        });

        document.body.appendChild(rootEl);
        return rootEl;
    }

    function buildProviders() {
        var bar = $('[data-r="pbar"]');
        bar.innerHTML = '';

        // mobile back
        var mob = document.createElement('button');
        mob.className = 'mfx-mob';
        mob.textContent = '\u2190 Results';
        mob.addEventListener('click', function () { $('.mfx-body').classList.remove('has-player'); });
        bar.appendChild(mob);

        var cur = provider();
        PROVIDERS.forEach(function (p) {
            var b = document.createElement('button');
            b.className = 'mfx-pb' + (p.id === cur ? ' on' : '');
            b.textContent = p.label;
            b.title = p.tag;
            b.addEventListener('click', function () {
                setProvider(p.id);
                $$('.mfx-pb').forEach(function (x) { x.classList.remove('on'); });
                b.classList.add('on');
                if (selectedItem) loadPlayer(selectedItem);
            });
            bar.appendChild(b);
        });

        // open-in-app link (only if public URL configured)
        if (PUBLIC_URL) {
            var link = document.createElement('a');
            link.className = 'mfx-open';
            link.href = PUBLIC_URL;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = 'Open MovieFlix \u2197';
            bar.appendChild(link);
        }
    }

    // ── search ──────────────────────────────────────────────────────────
    function doSearch(query, mediaType) {
        if (!query) return;
        var rail = $('.mfx-rail');
        rail.innerHTML = '<div class="mfx-empty">Searching\u2026</div>';

        var url = API + '/Search?query=' + encodeURIComponent(query);
        if (mediaType) url += '&mediaType=' + encodeURIComponent(mediaType);

        fetch(url).then(function (res) {
            if (!res.ok) return res.text().then(function (t) { throw new Error(t || 'HTTP ' + res.status); });
            return res.json();
        }).then(function (data) {
            if (!data.items || data.items.length === 0) {
                rail.innerHTML = '<div class="mfx-empty">No results found.</div>';
                return;
            }
            rail.innerHTML = '';
            data.items.forEach(function (item) {
                var card = document.createElement('button');
                card.className = 'mfx-card';
                card.innerHTML =
                    (item.posterUrl
                        ? '<img class="mfx-poster" src="' + esc(item.posterUrl) + '" alt="" loading="lazy"/>'
                        : '<div class="mfx-poster"></div>') +
                    '<div>' +
                        '<div class="mfx-ct">' + esc(item.title) + '</div>' +
                        '<div class="mfx-cm">' + (item.mediaType === 'tv' ? 'TV' : 'Movie') + ' \u00b7 ' + (item.releaseDate ? item.releaseDate.slice(0, 4) : '\u2014') + '</div>' +
                        (item.voteAverage ? '<div class="mfx-cr">\u2605 ' + item.voteAverage.toFixed(1) + ' (' + item.voteCount + ')</div>' : '') +
                    '</div>';
                card.addEventListener('click', function () { pickResult(item, card); });
                rail.appendChild(card);
            });
            // auto-select first
            pickResult(data.items[0], rail.querySelector('.mfx-card'));
        }).catch(function (err) {
            var msg = (err && err.message) ? err.message : 'Search failed.';
            if (msg.indexOf('API key') !== -1) {
                rail.innerHTML = '<div class="mfx-empty" style="flex-direction:column;gap:8px"><strong>TMDB API key issue</strong><span>' + esc(msg) + '</span></div>';
            } else {
                rail.innerHTML = '<div class="mfx-empty">' + esc(msg) + '</div>';
            }
        });
    }

    function pickResult(item, cardEl) {
        selectedItem = item;
        $$('.mfx-card').forEach(function (c) { c.classList.remove('sel'); });
        if (cardEl) cardEl.classList.add('sel');

        $('[data-r="pt"]').textContent = item.title;
        $('[data-r="pd"]').textContent = item.overview || 'No overview available.';
        $('.mfx-body').classList.add('has-player');
        loadPlayer(item);
    }

    function loadPlayer(item) {
        var frame = $('[data-r="pf"]');
        frame.innerHTML = '<div class="mfx-pe">Loading player\u2026</div>';

        var p = provider();
        var url = API + '/PlaybackUrl?tmdbId=' + encodeURIComponent(item.tmdbId) +
            '&mediaType=' + encodeURIComponent(item.mediaType) +
            '&provider=' + encodeURIComponent(p);

        fetch(url).then(function (res) {
            if (!res.ok) return res.text().then(function (t) { throw new Error(t || 'HTTP ' + res.status); });
            return res.json();
        }).then(function (data) {
            if (!data.embedUrl) {
                frame.innerHTML = '<div class="mfx-pe">No playback URL available.</div>';
                return;
            }
            var iframe = document.createElement('iframe');
            iframe.src = data.embedUrl;
            iframe.allowFullscreen = true;
            iframe.referrerPolicy = 'no-referrer';
            iframe.setAttribute('allow', 'autoplay; fullscreen; encrypted-media; picture-in-picture');
            frame.innerHTML = '';
            frame.appendChild(iframe);
        }).catch(function () {
            frame.innerHTML = '<div class="mfx-pe">Failed to load player. Try another provider.</div>';
        });
    }

    // ── activation ──────────────────────────────────────────────────────
    function activate() {
        if (isActive) return;
        isActive = true;
        build().classList.add('open');
        document.body.style.overflow = 'hidden';
        setTimeout(function () { var i = $('.mfx-sin'); if (i) i.focus(); }, 80);

        // check plugin health on first open
        if (!healthData) {
            fetch(API + '/Health').then(function (r) { return r.json(); }).then(function (d) {
                healthData = d;
                if (!d.configured) {
                    var rail = $('.mfx-rail');
                    if (rail) rail.innerHTML = '<div class="mfx-empty" style="flex-direction:column;gap:8px"><strong>TMDB API key not configured</strong><span>Go to Jellyfin Dashboard \u2192 Plugins \u2192 MovieFlix and set your TMDB API key.</span></div>';
                }
            }).catch(function () {});
        }
    }

    function deactivate() {
        if (!isActive) return;
        isActive = false;
        if (rootEl) rootEl.classList.remove('open');
        document.body.style.overflow = '';
        if (window.location.hash === ROUTE) {
            history.replaceState(null, '', window.location.pathname + window.location.search);
        }
        setNavHighlight(false);
    }

    function syncRoute() {
        if (window.location.hash === ROUTE) { activate(); setNavHighlight(true); }
        else { deactivate(); }
    }

    // ── sidebar link ────────────────────────────────────────────────────
    function setNavHighlight(on) {
        $$('[data-mfx]', document).forEach(function (el) {
            el.classList.toggle('navMenuOption-selected', on);
        });
    }

    function injectLink() {
        if (document.querySelector('[data-mfx]')) return;

        var target =
            document.querySelector('.mainDrawer-scrollContainer .sidebarList') ||
            document.querySelector('.mainDrawer-scrollContainer') ||
            null;
        if (!target) return;

        var a = document.createElement('a');
        a.href = ROUTE;
        a.setAttribute('data-mfx', '1');
        a.className = 'navMenuOption';
        a.innerHTML =
            '<span class="material-icons navMenuOptionIcon" aria-hidden="true" style="font-size:inherit">movie_filter</span>' +
            '<span class="navMenuOptionText">MovieFlix</span>';
        a.addEventListener('click', function (e) {
            e.preventDefault();
            window.location.hash = ROUTE;
            // close drawer on mobile
            var drawer = document.querySelector('.mainDrawer');
            if (drawer && drawer.classList.contains('mainDrawer-open')) {
                try { Emby.Page.goHome && false; } catch(ex) {}
                drawer.classList.remove('mainDrawer-open');
            }
        });
        target.appendChild(a);
    }

    // ── bootstrap ───────────────────────────────────────────────────────
    var obs = new MutationObserver(function () { injectLink(); });
    obs.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('hashchange', syncRoute);
    injectLink();
    syncRoute();
})();
