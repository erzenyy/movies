namespace Jellyfin.Plugin.MovieFlix.Api;

/// <summary>
/// Search result item returned by the plugin.
/// </summary>
public class MovieFlixSearchItem
{
    public string TmdbId { get; set; } = string.Empty;

    public string MediaType { get; set; } = "movie";

    public string Title { get; set; } = string.Empty;

    public string Overview { get; set; } = string.Empty;

    public string? PosterUrl { get; set; }

    public string? BackdropUrl { get; set; }

    public string? ReleaseDate { get; set; }

    public double VoteAverage { get; set; }

    public int VoteCount { get; set; }
}

/// <summary>
/// Search response payload.
/// </summary>
public class MovieFlixSearchResponse
{
    public string Query { get; set; } = string.Empty;

    public List<MovieFlixSearchItem> Items { get; set; } = [];
}

/// <summary>
/// Playback response payload.
/// </summary>
public class MovieFlixPlaybackResponse
{
    public string Provider { get; set; } = string.Empty;

    public string EmbedUrl { get; set; } = string.Empty;

    public string? WatchUrl { get; set; }
}

/// <summary>
/// Health response payload.
/// </summary>
public class MovieFlixHealthResponse
{
    public string Plugin { get; set; } = "MovieFlix";

    public bool Configured { get; set; }

    public bool CommunityProvidersEnabled { get; set; }

    public string DefaultProvider { get; set; } = string.Empty;
}
