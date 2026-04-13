using System.Text.Json.Serialization;

namespace Jellyfin.Plugin.MovieFlix.Api;

/// <summary>
/// Search result item returned by the plugin.
/// </summary>
public class MovieFlixSearchItem
{
    [JsonPropertyName("tmdbId")]
    public string TmdbId { get; set; } = string.Empty;

    [JsonPropertyName("mediaType")]
    public string MediaType { get; set; } = "movie";

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("overview")]
    public string Overview { get; set; } = string.Empty;

    [JsonPropertyName("posterUrl")]
    public string? PosterUrl { get; set; }

    [JsonPropertyName("backdropUrl")]
    public string? BackdropUrl { get; set; }

    [JsonPropertyName("releaseDate")]
    public string? ReleaseDate { get; set; }

    [JsonPropertyName("voteAverage")]
    public double VoteAverage { get; set; }

    [JsonPropertyName("voteCount")]
    public int VoteCount { get; set; }
}

/// <summary>
/// Search response payload.
/// </summary>
public class MovieFlixSearchResponse
{
    [JsonPropertyName("query")]
    public string Query { get; set; } = string.Empty;

    [JsonPropertyName("items")]
    public List<MovieFlixSearchItem> Items { get; set; } = [];
}

/// <summary>
/// Playback response payload.
/// </summary>
public class MovieFlixPlaybackResponse
{
    [JsonPropertyName("provider")]
    public string Provider { get; set; } = string.Empty;

    [JsonPropertyName("embedUrl")]
    public string EmbedUrl { get; set; } = string.Empty;

    [JsonPropertyName("watchUrl")]
    public string? WatchUrl { get; set; }
}

/// <summary>
/// Health response payload.
/// </summary>
public class MovieFlixHealthResponse
{
    [JsonPropertyName("plugin")]
    public string Plugin { get; set; } = "MovieFlix";

    [JsonPropertyName("configured")]
    public bool Configured { get; set; }

    [JsonPropertyName("communityProvidersEnabled")]
    public bool CommunityProvidersEnabled { get; set; }

    [JsonPropertyName("defaultProvider")]
    public string DefaultProvider { get; set; } = string.Empty;
}
