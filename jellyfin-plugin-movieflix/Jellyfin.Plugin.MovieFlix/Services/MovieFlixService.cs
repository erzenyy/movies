using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Jellyfin.Plugin.MovieFlix.Api;
using Jellyfin.Plugin.MovieFlix.Configuration;

namespace Jellyfin.Plugin.MovieFlix.Services;

/// <summary>
/// Handles MovieFlix search and playback URL generation.
/// </summary>
public sealed class MovieFlixService
{
    private static readonly HttpClient HttpClient = new();

    /// <summary>
    /// Search TMDB for movies and TV shows.
    /// </summary>
    public async Task<MovieFlixSearchResponse> SearchAsync(
        PluginConfiguration config,
        string query,
        string? mediaType,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(config.TmdbApiKey))
        {
            throw new InvalidOperationException("TMDB API key is not configured.");
        }

        var normalizedQuery = query.Trim();
        if (normalizedQuery.Length == 0)
        {
            return new MovieFlixSearchResponse { Query = query, Items = [] };
        }

        var endpoint = mediaType?.ToLowerInvariant() switch
        {
            "movie" => "movie",
            "tv" => "tv",
            _ => config.IncludeTvInSearch ? "multi" : "movie"
        };

        var url =
            $"https://api.themoviedb.org/3/search/{endpoint}?api_key={Uri.EscapeDataString(config.TmdbApiKey)}&language=en-US&query={Uri.EscapeDataString(normalizedQuery)}";

        var payload = await HttpClient.GetFromJsonAsync<TmdbSearchResponse>(url, cancellationToken).ConfigureAwait(false);
        var items = (payload?.Results ?? [])
            .Where(item => item.Id > 0)
            .Where(item => item.MediaType is "movie" or "tv" || endpoint != "multi")
            .Select(item => new MovieFlixSearchItem
            {
                TmdbId = item.Id.ToString(),
                MediaType = item.MediaType ?? (endpoint == "tv" ? "tv" : "movie"),
                Title = item.Title ?? item.Name ?? string.Empty,
                Overview = item.Overview ?? string.Empty,
                PosterUrl = BuildImageUrl(item.PosterPath, "w500"),
                BackdropUrl = BuildImageUrl(item.BackdropPath, "w780"),
                ReleaseDate = item.ReleaseDate ?? item.FirstAirDate,
                VoteAverage = item.VoteAverage,
                VoteCount = item.VoteCount
            })
            .Where(item => !string.IsNullOrWhiteSpace(item.Title))
            .ToList();

        return new MovieFlixSearchResponse
        {
            Query = normalizedQuery,
            Items = items
        };
    }

    /// <summary>
    /// Build a playback URL for the requested provider.
    /// </summary>
    public MovieFlixPlaybackResponse BuildPlaybackResponse(
        PluginConfiguration config,
        string tmdbId,
        string mediaType,
        int? season,
        int? episode,
        string? provider)
    {
        var selectedProvider = (provider ?? config.DefaultProvider).Trim().ToLowerInvariant();
        if (selectedProvider != "vidking" && !config.EnableCommunityProviders)
        {
            selectedProvider = "vidking";
        }

        var embedUrl = BuildEmbedUrl(selectedProvider, tmdbId, mediaType, season, episode);
        var watchUrl = BuildMovieFlixWatchUrl(config.PublicBaseUrl, tmdbId, mediaType, season, episode);

        return new MovieFlixPlaybackResponse
        {
            Provider = selectedProvider,
            EmbedUrl = embedUrl,
            WatchUrl = watchUrl
        };
    }

    private static string? BuildMovieFlixWatchUrl(
        string publicBaseUrl,
        string tmdbId,
        string mediaType,
        int? season,
        int? episode)
    {
        if (string.IsNullOrWhiteSpace(publicBaseUrl))
        {
            return null;
        }

        var baseUrl = publicBaseUrl.TrimEnd('/');
        return mediaType == "tv"
            ? $"{baseUrl}/watch/tv/{tmdbId}/{season ?? 1}/{episode ?? 1}"
            : $"{baseUrl}/watch/movie/{tmdbId}";
    }

    private static string BuildEmbedUrl(
        string provider,
        string tmdbId,
        string mediaType,
        int? season,
        int? episode)
    {
        var id = new string(tmdbId.Where(char.IsDigit).ToArray());
        if (string.IsNullOrWhiteSpace(id))
        {
            id = tmdbId;
        }

        if (mediaType == "tv")
        {
            var s = season ?? 1;
            var e = episode ?? 1;
            return provider switch
            {
                "vidsrc" => $"https://vidsrc.to/embed/tv/{id}/{s}/{e}",
                "multiembed" => $"https://multiembed.mov/?video_id={id}&tmdb=1&s={s}&e={e}",
                "moviesapi" => $"https://moviesapi.club/tv/{id}-{s}-{e}",
                _ => $"https://www.vidking.net/embed/tv/{id}/{s}/{e}?color=e50914&autoPlay=true&nextEpisode=true&episodeSelector=true"
            };
        }

        return provider switch
        {
            "vidsrc" => $"https://vidsrc.to/embed/movie/{id}",
            "multiembed" => $"https://multiembed.mov/?video_id={id}&tmdb=1",
            "moviesapi" => $"https://moviesapi.club/movie/{id}",
            _ => $"https://www.vidking.net/embed/movie/{id}?color=e50914&autoPlay=true"
        };
    }

    private static string? BuildImageUrl(string? path, string size)
    {
        return string.IsNullOrWhiteSpace(path) ? null : $"https://image.tmdb.org/t/p/{size}{path}";
    }

    private sealed class TmdbSearchResponse
    {
        [JsonPropertyName("results")]
        public List<TmdbSearchItem>? Results { get; set; }
    }

    private sealed class TmdbSearchItem
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("media_type")]
        public string? MediaType { get; set; }

        [JsonPropertyName("title")]
        public string? Title { get; set; }

        [JsonPropertyName("name")]
        public string? Name { get; set; }

        [JsonPropertyName("overview")]
        public string? Overview { get; set; }

        [JsonPropertyName("poster_path")]
        public string? PosterPath { get; set; }

        [JsonPropertyName("backdrop_path")]
        public string? BackdropPath { get; set; }

        [JsonPropertyName("release_date")]
        public string? ReleaseDate { get; set; }

        [JsonPropertyName("first_air_date")]
        public string? FirstAirDate { get; set; }

        [JsonPropertyName("vote_average")]
        public double VoteAverage { get; set; }

        [JsonPropertyName("vote_count")]
        public int VoteCount { get; set; }
    }
}
