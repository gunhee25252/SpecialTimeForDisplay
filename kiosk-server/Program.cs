using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace SpecialTimeKiosk;

internal static class Program
{
    private const long MaxRequestBytes = 50 * 1024 * 1024;
    private const string ImagePrefix = "data:image/png;base64,";

    [STAThread]
    public static async Task Main(string[] args)
    {
        var baseDirectory = AppContext.BaseDirectory;

        try
        {
            var settings = await LoadSettingsAsync(baseDirectory);
            if (args.Contains("--server-only", StringComparer.OrdinalIgnoreCase))
            {
                settings.OpenBrowser = false;
            }
            var url = $"http://127.0.0.1:{settings.Port}";

            if (await IsServerRunningAsync(url))
            {
                if (settings.OpenBrowser) OpenBrowser(url);
                return;
            }

            var webRoot = Path.Combine(baseDirectory, "web");
            if (!File.Exists(Path.Combine(webRoot, "index.html")))
            {
                throw new InvalidOperationException("web 폴더에서 index.html을 찾을 수 없습니다.");
            }

            var builder = WebApplication.CreateBuilder(new WebApplicationOptions
            {
                ContentRootPath = baseDirectory,
                WebRootPath = webRoot,
            });
            builder.Logging.ClearProviders();
            builder.WebHost.UseUrls(url);
            builder.WebHost.ConfigureKestrel(options =>
            {
                options.Limits.MaxRequestBodySize = MaxRequestBytes;
            });

            var app = builder.Build();
            app.UseDefaultFiles();
            app.UseStaticFiles();

            app.MapGet("/health", () => Results.Ok(new { ok = true }));
            app.MapPost("/api/prints", async (HttpRequest request) =>
                await SavePrintAsync(request, baseDirectory));
            app.MapFallbackToFile("index.html");

            app.Lifetime.ApplicationStarted.Register(() =>
            {
                WriteLog(baseDirectory, $"서버 시작: {url}");
                if (settings.OpenBrowser) OpenBrowser(url);
            });

            await app.RunAsync();
        }
        catch (Exception error)
        {
            WriteLog(baseDirectory, error.ToString());
            ShowError($"특별시 키오스크를 실행하지 못했습니다.\n\n{error.Message}\n\nkiosk-server.log를 확인해 주세요.");
        }
    }

    private static async Task<IResult> SavePrintAsync(HttpRequest request, string baseDirectory)
    {
        try
        {
            var payload = await JsonNode.ParseAsync(
                request.Body,
                cancellationToken: request.HttpContext.RequestAborted) as JsonObject;
            var imageDataUrl = payload?["imageDataUrl"]?.GetValue<string>();
            var spec = payload?["spec"] as JsonObject;

            if (spec is null ||
                imageDataUrl is null ||
                !imageDataUrl.StartsWith(ImagePrefix, StringComparison.Ordinal) ||
                !TryGetPrintId(spec, out var printId))
            {
                return Results.BadRequest("Invalid print payload");
            }

            var imageBytes = Convert.FromBase64String(imageDataUrl[ImagePrefix.Length..]);
            var paddedId = printId.ToString("D3");
            var imageFile = $"print-{paddedId}.png";
            var jsonFile = $"print-{paddedId}.json";
            var outputDirectory = Path.Combine(baseDirectory, "print-results");
            Directory.CreateDirectory(outputDirectory);

            spec["imageFile"] = imageFile;
            await File.WriteAllBytesAsync(
                Path.Combine(outputDirectory, imageFile),
                imageBytes,
                request.HttpContext.RequestAborted);
            await File.WriteAllTextAsync(
                Path.Combine(outputDirectory, jsonFile),
                spec.ToJsonString(new JsonSerializerOptions { WriteIndented = true }),
                request.HttpContext.RequestAborted);

            return Results.Json(new { ok = true, imageFile, jsonFile });
        }
        catch (FormatException)
        {
            return Results.BadRequest("Invalid PNG data");
        }
        catch (Exception error)
        {
            WriteLog(baseDirectory, error.ToString());
            return Results.Problem("Failed to save print files");
        }
    }

    private static bool TryGetPrintId(JsonObject spec, out int printId)
    {
        printId = 0;
        try
        {
            printId = spec["printId"]?.GetValue<int>() ?? 0;
            return printId > 0;
        }
        catch
        {
            return false;
        }
    }

    private static async Task<KioskSettings> LoadSettingsAsync(string baseDirectory)
    {
        var path = Path.Combine(baseDirectory, "kiosk-settings.json");
        if (!File.Exists(path)) return new KioskSettings();

        var json = await File.ReadAllTextAsync(path);
        var settings = JsonSerializer.Deserialize<KioskSettings>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
        }) ?? new KioskSettings();
        settings.Port = settings.Port is >= 1024 and <= 65535 ? settings.Port : 4173;
        return settings;
    }

    private static async Task<bool> IsServerRunningAsync(string url)
    {
        try
        {
            using var client = new HttpClient { Timeout = TimeSpan.FromMilliseconds(700) };
            using var response = await client.GetAsync($"{url}/health");
            return response.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }

    private static void OpenBrowser(string url)
    {
        try
        {
            Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
        }
        catch
        {
            // The kiosk vendor may launch the browser separately.
        }
    }

    private static void WriteLog(string baseDirectory, string message)
    {
        try
        {
            File.AppendAllText(
                Path.Combine(baseDirectory, "kiosk-server.log"),
                $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] {message}{Environment.NewLine}");
        }
        catch
        {
            // Logging must not stop the kiosk.
        }
    }

    private static void ShowError(string message)
    {
        MessageBox(IntPtr.Zero, message, "특별시 키오스크", 0x10);
    }

    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    private static extern int MessageBox(IntPtr hWnd, string text, string caption, uint type);
}

internal sealed class KioskSettings
{
    public int Port { get; set; } = 4173;
    public bool OpenBrowser { get; set; } = true;
}
