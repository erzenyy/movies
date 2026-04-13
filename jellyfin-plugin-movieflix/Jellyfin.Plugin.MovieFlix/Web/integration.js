(function () {
    const baseAppUrl = "__MOVIEFLIX_PLUGIN_APP_URL__" || "/MovieFlix/Web/App";
    const publicUrl = "__MOVIEFLIX_PUBLIC_URL__";
    const routeHash = "#!/movieflix";
    const rootId = "movieflix-jellyfin-root";
    const activeAttr = "data-movieflix-active";

    function getHeaderRect() {
        const header = document.querySelector(".skinHeader")
            || document.querySelector(".mainHeader")
            || document.querySelector("header");
        return header ? header.getBoundingClientRect() : { bottom: 0 };
    }

    function getDrawerInset() {
        const drawer = document.querySelector(".mainDrawer")
            || document.querySelector(".mainDrawer-scrollContainer")?.closest(".mainDrawer");
        if (!drawer) return 0;

        const style = window.getComputedStyle(drawer);
        if (style.display === "none" || style.visibility === "hidden") return 0;

        const rect = drawer.getBoundingClientRect();
        return rect.width > 0 ? rect.width : 0;
    }

    function getEmbedAppUrl() {
        const url = new URL(publicUrl || baseAppUrl, window.location.origin);
        url.searchParams.set("embedded", "1");
        return url.toString();
    }

    function ensureRoot() {
        let root = document.getElementById(rootId);
        if (root) return root;

        root = document.createElement("div");
        root.id = rootId;
        root.style.position = "fixed";
        root.style.right = "0";
        root.style.bottom = "0";
        root.style.background = "#0b0b0c";
        root.style.display = "none";
        root.style.zIndex = "40";
        root.style.borderLeft = "1px solid rgba(255,255,255,0.06)";
        root.style.borderTop = "1px solid rgba(255,255,255,0.06)";
        root.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.04)";

        const frame = document.createElement("iframe");
        frame.src = getEmbedAppUrl();
        frame.title = "MovieFlix";
        frame.allowFullscreen = true;
        frame.referrerPolicy = "no-referrer";
        frame.style.width = "100%";
        frame.style.height = "100%";
        frame.style.border = "0";
        frame.style.background = "#0b0b0c";
        root.appendChild(frame);

        document.body.appendChild(root);
        return root;
    }

    function positionRoot() {
        const root = ensureRoot();
        const headerRect = getHeaderRect();
        const drawerInset = getDrawerInset();

        root.style.top = Math.max(0, headerRect.bottom) + "px";
        root.style.left = drawerInset + "px";
    }

    function setActiveNavState(active) {
        document.querySelectorAll("[data-movieflix-link='true']").forEach(function (link) {
            if (active) {
                link.setAttribute(activeAttr, "true");
                link.style.background = "rgba(255,255,255,0.08)";
                link.style.color = "#fff";
            } else {
                link.removeAttribute(activeAttr);
                link.style.background = "";
                link.style.color = "";
            }
        });
    }

    function renderRoute() {
        const active = window.location.hash === routeHash;
        const root = ensureRoot();
        positionRoot();
        root.style.display = active ? "block" : "none";
        setActiveNavState(active);
        document.documentElement.classList.toggle("movieflix-route-active", active);
        document.body.style.overflow = active ? "hidden" : "";
    }

    function createLink() {
        const link = document.createElement("a");
        link.href = routeHash;
        link.dataset.movieflixLink = "true";
        link.textContent = "MovieFlix";
        link.style.display = "block";
        link.style.padding = "10px 16px";
        link.style.color = "inherit";
        link.style.textDecoration = "none";
        link.style.borderTop = "1px solid rgba(255,255,255,0.06)";
        link.style.transition = "background 140ms ease, color 140ms ease";

        link.addEventListener("click", function (event) {
            event.preventDefault();
            window.location.hash = routeHash;
            renderRoute();
        });

        return link;
    }

    function installLink() {
        const existing = document.querySelector("[data-movieflix-link='true']");
        if (existing) return;

        const nav = document.querySelector(".mainDrawer-scrollContainer .itemsContainer")
            || document.querySelector(".mainDrawer-scrollContainer")
            || document.querySelector(".skinHeader .headerTabs")
            || document.body;

        nav.appendChild(createLink());
        renderRoute();
    }

    const observer = new MutationObserver(function () {
        installLink();
        positionRoot();
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener("hashchange", renderRoute);
    window.addEventListener("resize", positionRoot);

    installLink();
    renderRoute();
})();
