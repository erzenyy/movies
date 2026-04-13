using Jellyfin.Plugin.MovieFlix.Configuration;
using Jellyfin.Plugin.MovieFlix.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.MovieFlix.Api;

/// <summary>
/// REST API endpoints for MovieFlix search and playback.
/// </summary>
[ApiController]
[Route("MovieFlix")]
public class MovieFlixController : ControllerBase
{
    private readonly ILogger<MovieFlixController> _logger;
    private readonly MovieFlixService _service = new();

    /// <summary>
    /// Initializes a new instance of the <see cref="MovieFlixController"/> class.
    /// </summary>
    public MovieFlixController(ILogger<MovieFlixController> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Health endpoint.
    /// </summary>
    [HttpGet("Health")]
    [ProducesResponseType(typeof(MovieFlixHealthResponse), StatusCodes.Status200OK)]
    public ActionResult<MovieFlixHealthResponse> Health()
    {
        var config = GetConfig();
        return Ok(new MovieFlixHealthResponse
        {
            Configured = !string.IsNullOrWhiteSpace(config.TmdbApiKey),
            CommunityProvidersEnabled = config.EnableCommunityProviders,
            DefaultProvider = config.DefaultProvider
        });
    }

    /// <summary>
    /// Search endpoint backed by TMDB.
    /// </summary>
    [HttpGet("Search")]
    [ProducesResponseType(typeof(MovieFlixSearchResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<MovieFlixSearchResponse>> Search(
        [FromQuery] string query,
        [FromQuery] string? mediaType,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return BadRequest("Query is required.");
        }

        try
        {
            var result = await _service.SearchAsync(GetConfig(), query, mediaType, cancellationToken).ConfigureAwait(false);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "MovieFlix search failed for query {Query}", query);
            return StatusCode(StatusCodes.Status502BadGateway, "Search failed.");
        }
    }

    /// <summary>
    /// Build playback and deep-link URLs for a title.
    /// </summary>
    [HttpGet("PlaybackUrl")]
    [ProducesResponseType(typeof(MovieFlixPlaybackResponse), StatusCodes.Status200OK)]
    public ActionResult<MovieFlixPlaybackResponse> PlaybackUrl(
        [FromQuery] string tmdbId,
        [FromQuery] string mediaType = "movie",
        [FromQuery] int? season = null,
        [FromQuery] int? episode = null,
        [FromQuery] string? provider = null)
    {
        if (string.IsNullOrWhiteSpace(tmdbId))
        {
            return BadRequest("tmdbId is required.");
        }

        var normalizedType = mediaType.Equals("tv", StringComparison.OrdinalIgnoreCase) ? "tv" : "movie";
        var result = _service.BuildPlaybackResponse(GetConfig(), tmdbId, normalizedType, season, episode, provider);
        return Ok(result);
    }

    private static PluginConfiguration GetConfig()
    {
        return Plugin.Instance?.Configuration ?? new PluginConfiguration();
    }
}
