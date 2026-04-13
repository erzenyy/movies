# Jellyfin.Plugin.MovieFlix

A Jellyfin companion plugin that adds MovieFlix-style search and playback endpoints to a Jellyfin server.

## What It Does

- Searches TMDB for movies and TV shows.
- Builds playback URLs for the same providers used by the MovieFlix web app.
- Exposes simple Jellyfin-side REST endpoints for search and playback handoff.
- Provides a Jellyfin dashboard configuration page.

## What It Does Not Yet Do

- It does not automatically inject a full custom browsing experience into every Jellyfin client.
- It does not bundle a custom Jellyfin web UI modification.
- It does not compile in this repository yet because the local machine does not currently have the `.NET` SDK installed.

This project is intentionally built as a clean plugin foundation so you can:

1. compile and install it in Jellyfin,
2. call its endpoints from a custom Jellyfin web integration,
3. extend it later into channels or deeper UI integration.

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
3. Use a version like `0.1.0.0`
4. After the workflow finishes, it produces:
   - a release ZIP
   - `jellyfin-plugin-movieflix/repository/manifest.json`
5. In Jellyfin, add this repository URL:

```text
https://raw.githubusercontent.com/erzenyy/movies/main/jellyfin-plugin-movieflix/repository/manifest.json
```

Then install `MovieFlix` from the Jellyfin plugins catalog.

## Web Integration

After installing the plugin, these Jellyfin-hosted pages become available:

- `/MovieFlix/Web/App`
- `/MovieFlix/Web/Integration.js`

Recommended path:

1. Open `/MovieFlix/Web/App` directly once to verify search and playback
2. Use a Jellyfin web custom-JS injector plugin to inject `/MovieFlix/Web/Integration.js`
3. That adds a `MovieFlix` item into the Jellyfin web sidebar
4. Clicking it routes to `#!/movieflix` and opens MovieFlix inside the Jellyfin shell
5. Vidking remains the first-class provider inside the integrated view

## Install Notes

Compile the project, then copy the built plugin DLL and any required companion files into a subfolder under your Jellyfin `plugins` directory, following the official Jellyfin plugin template instructions.
