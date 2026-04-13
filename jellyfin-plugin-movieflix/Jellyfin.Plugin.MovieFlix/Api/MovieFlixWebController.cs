using System.Reflection;
using System.Text;
using Jellyfin.Plugin.MovieFlix.Configuration;
using Microsoft.AspNetCore.Mvc;

namespace Jellyfin.Plugin.MovieFlix.Api;

/// <summary>
/// Serves the MovieFlix web integration assets.
/// </summary>
[ApiController]
[Route("MovieFlix/Web")]
public class MovieFlixWebController : ControllerBase
{
    [HttpGet("App")]
    public IActionResult App()
    {
        return Content(ReadEmbeddedText("app.html"), "text/html", Encoding.UTF8);
    }

    [HttpGet("Client.js")]
    public IActionResult ClientScript()
    {
        return Content(ReadEmbeddedText("client.js"), "application/javascript", Encoding.UTF8);
    }

    [HttpGet("Integration.js")]
    public IActionResult IntegrationScript()
    {
        var config = Plugin.Instance?.Configuration ?? new PluginConfiguration();
        var payload = ReadEmbeddedText("integration.js")
            .Replace("__MOVIEFLIX_PUBLIC_URL__", config.PublicBaseUrl.TrimEnd('/'))
            .Replace("__MOVIEFLIX_PLUGIN_APP_URL__", "/MovieFlix/Web/App");
        return Content(payload, "application/javascript", Encoding.UTF8);
    }

    private static string ReadEmbeddedText(string fileName)
    {
        var assembly = typeof(Plugin).Assembly;
        var resourceName = $"{typeof(Plugin).Namespace}.Web.{fileName}";
        using var stream = assembly.GetManifestResourceStream(resourceName)
            ?? throw new InvalidOperationException($"Missing embedded resource {resourceName}.");
        using var reader = new StreamReader(stream, Encoding.UTF8);
        return reader.ReadToEnd();
    }
}
