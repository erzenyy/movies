using MediaBrowser.Model.Plugins;

namespace Jellyfin.Plugin.MovieFlix.Configuration;

/// <summary>
/// Plugin configuration.
/// </summary>
public class PluginConfiguration : BasePluginConfiguration
{
    /// <summary>
    /// Gets or sets the TMDB API key used for search.
    /// </summary>
    public string TmdbApiKey { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the public MovieFlix web URL for deep links back into the app.
    /// </summary>
    public string PublicBaseUrl { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the default streaming provider.
    /// </summary>
    public string DefaultProvider { get; set; } = "vidking";

    /// <summary>
    /// Gets or sets a value indicating whether community providers are enabled.
    /// </summary>
    public bool EnableCommunityProviders { get; set; } = false;

    /// <summary>
    /// Gets or sets a value indicating whether TV results should be included in multi-search.
    /// </summary>
    public bool IncludeTvInSearch { get; set; } = true;
}
