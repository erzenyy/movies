(function () {
    const appUrl = "__MOVIEFLIX_PLUGIN_APP_URL__" || "/MovieFlix/Web/App";
    const publicUrl = "__MOVIEFLIX_PUBLIC_URL__";

    function installLink() {
        if (document.querySelector('[data-movieflix-link="true"]')) return;

        const nav = document.querySelector('.mainDrawer-scrollContainer .itemsContainer')
            || document.querySelector('.skinHeader .headerTabs')
            || document.body;

        const link = document.createElement('a');
        link.href = publicUrl || appUrl;
        link.dataset.movieflixLink = 'true';
        link.textContent = 'MovieFlix';
        link.style.display = 'block';
        link.style.padding = '10px 16px';
        link.style.color = 'inherit';
        link.style.textDecoration = 'none';
        link.style.borderTop = '1px solid rgba(255,255,255,0.06)';

        if (!publicUrl) {
            link.addEventListener('click', function (event) {
                event.preventDefault();
                window.location.href = appUrl;
            });
        }

        nav.appendChild(link);
    }

    const observer = new MutationObserver(function () {
        installLink();
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });
    installLink();
})();
