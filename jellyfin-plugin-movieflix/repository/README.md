# Jellyfin Repository Files

This folder contains the repository manifest scaffolding for installing the MovieFlix plugin through Jellyfin's plugin catalog.

## Files

- `manifest.template.json`: template used by the release workflow
- `manifest.json`: generated release manifest you will publish from GitHub Pages, raw GitHub, or another static host

## How Jellyfin Uses This

In Jellyfin:

1. Dashboard
2. Plugins
3. Repositories
4. Add repository
5. Paste the public URL to your published `manifest.json`

Example final URL:

```text
https://raw.githubusercontent.com/erzenyy/movies/main/jellyfin-plugin-movieflix/repository/manifest.json
```

Only use that URL after you publish a real plugin ZIP and update the manifest with the correct version, source URL, and checksum.
