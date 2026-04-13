# Jellyfin.Plugin.MovieFlix

A Jellyfin companion plugin that adds MovieFlix-style search and playback endpoints to a Jellyfin server.

## What It Does

- Searches TMDB for movies and TV shows.
- Builds playback URLs for the same providers used by the MovieFlix web app.
- Exposes simple Jellyfin-side REST endpoints for search and playback handoff.
- Provides a Jellyfin dashboard configuration page.

## Current Limitations

- It does not compile in this repository yet because the local machine does not currently have the `.NET` SDK installed.
- The integration targets the Jellyfin **web** client only (not native apps like Android TV, iOS, etc.).

## Official References Used

- Jellyfin plugin template:
  [https://github.com/jellyfin/jellyfin-plugin-template](https://github.com/jellyfin/jellyfin-plugin-template)
- Jellyfin plugin development quickstart in the template README.

## Project Layout

- `Jellyfin.Plugin.MovieFlix/Plugin.cs`
- `Jellyfin.Plugin.MovieFlix/Configuration/PluginConfiguration.cs`
- `Jellyfin.Plugin.MovieFlix/Api/MovieFlixController.cs`
- `Jellyfin.Plugin.MovieFlix/Services/MovieFlixService.cs`
- `Jellyfin.Plugin.MovieFlix/Configuration/configPage.html`

## Expected Endpoints

After install, the plugin exposes:

- `GET /MovieFlix/Health`
- `GET /MovieFlix/Search?query=inception`
- `GET /MovieFlix/PlaybackUrl?tmdbId=27205&mediaType=movie`

## Configuration

Set these in the Jellyfin dashboard page:

- `TMDB API Key`
- `Public MovieFlix Base URL`
- `Default Provider`
- `Enable Community Providers`

## Build Notes

The official Jellyfin template currently targets modern `.NET` and Jellyfin package versions. This plugin now targets `.NET 9`, which matches the Jellyfin `10.11.3` package requirements used in the project. I still could not run `dotnet build` locally in this workspace because `dotnet` is not installed on this machine.

## Easy Install Path

If you want the simplest install flow through Jellyfin's repository system:

1. Push this repo to GitHub
2. Run the GitHub Action `Release Jellyfin Plugin`
3. Use a version like `0.2.0.0`
4. After the workflow finishes, it produces:
   - a release ZIP
   - `jellyfin-plugin-movieflix/repository/manifest.json`
5. In Jellyfin, add this stable repository URL:

```text
https://raw.githubusercontent.com/erzenyy/movies/main/jellyfin-plugin-movieflix/repository/manifest.json
```

The release workflow now updates that file automatically and preserves version history, so users do not need to change repository URLs for each new plugin version.

## Web Integration

After installing the plugin, these Jellyfin-hosted pages become available:

- `/MovieFlix/Web/App` — standalone search + player page (fallback / testing)
- `/MovieFlix/Web/Integration.js` — native Jellyfin integration script

Recommended path:

1. Use a Jellyfin web custom-JS injector plugin to inject `/MovieFlix/Web/Integration.js`
2. That adds a **MovieFlix** item into the Jellyfin web sidebar
3. Clicking it opens a **native full-screen search + player UI** directly inside Jellyfin
4. Search queries hit the plugin's `/MovieFlix/Search` API (backed by TMDB)
5. Playback loads a **single direct embed iframe** — no nested iframes, no external app pages
6. Provider switching (Vidking, VidSrc, MultiEmbed, MoviesAPI) works inline
7. Press **Escape** or click **← Back to Jellyfin** to return to the normal Jellyfin UI
8. `/MovieFlix/Web/App` remains available as a standalone page for testing outside Jellyfin

## Install Notes

Compile the project, then copy the built plugin DLL and any required companion files into a subfolder under your Jellyfin `plugins` directory, following the official Jellyfin plugin template instructions.
