using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.AspNetCore.StaticFiles;

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
                if (settings.OpenBrowser) OpenBrowser(url, settings);
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
            var contentTypes = new FileExtensionContentTypeProvider();
            contentTypes.Mappings[".ttf"] = "font/ttf";
            app.UseDefaultFiles();
            app.UseStaticFiles(new StaticFileOptions
            {
                ContentTypeProvider = contentTypes,
                OnPrepareResponse = context =>
                {
                    context.Context.Response.Headers["Cache-Control"] = "no-store, no-cache, must-revalidate";
                    context.Context.Response.Headers["Pragma"] = "no-cache";
                    context.Context.Response.Headers["Expires"] = "0";
                },
            });

            app.MapGet("/health", () => Results.Ok(new { ok = true }));
            app.MapPost("/api/prints", async (HttpRequest request) =>
                await SavePrintAsync(request, baseDirectory));
            app.MapFallbackToFile("index.html");

            app.Lifetime.ApplicationStarted.Register(() =>
            {
                WriteLog(baseDirectory, $"서버 시작: {url}");
                if (settings.OpenBrowser) OpenBrowser(url, settings);
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

    private static void OpenBrowser(string url, KioskSettings settings)
    {
        // 브라우저를 지정했으면 인수와 함께 직접 실행한다(--kiosk-printing으로 인쇄 대화상자 제거).
        var browserPath = settings.BrowserPath?.Trim() ?? string.Empty;
        if (browserPath.Length > 0)
        {
            if (!File.Exists(browserPath))
            {
                WriteLog(AppContext.BaseDirectory, $"브라우저를 찾을 수 없습니다: {browserPath}");
            }
            else
            {
                try
                {
                    var arguments = settings.BrowserArguments?.Trim() ?? string.Empty;

                    // 이미 실행 중인 Edge/Chrome이 있으면 새 프로세스가 뜨지 않고 기존 창에 URL만
                    // 전달되어 --kiosk, --kiosk-printing 같은 실행 인수가 통째로 무시된다.
                    // 전용 프로필을 지정하면 별개의 브라우저로 실행되어 인수가 적용된다.
                    if (!arguments.Contains("--user-data-dir", StringComparison.OrdinalIgnoreCase))
                    {
                        var profileDirectory = Path.Combine(AppContext.BaseDirectory, "browser-profile");
                        arguments = $"{arguments} --user-data-dir=\"{profileDirectory}\"".Trim();
                    }

                    Process.Start(new ProcessStartInfo(browserPath)
                    {
                        Arguments = arguments.Length > 0 ? $"{arguments} {url}" : url,
                        UseShellExecute = false,
                    });
                    WriteLog(AppContext.BaseDirectory, $"브라우저 실행: {browserPath} {arguments}");
                    return;
                }
                catch (Exception error)
                {
                    WriteLog(AppContext.BaseDirectory, $"브라우저 실행 실패: {error.Message}");
                }
            }
        }

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

    /// <summary>
    /// 실행할 브라우저의 전체 경로. 비워 두면 지금까지처럼 기본 브라우저를 옵션 없이 연다.
    /// Edge/Chrome 경로를 지정하면 BrowserArguments를 붙여 실행하므로 인쇄 대화상자를 없앨 수 있다.
    /// </summary>
    public string BrowserPath { get; set; } = string.Empty;

    /// <summary>
    /// BrowserPath를 지정했을 때 함께 넘길 실행 인수.
    /// --kiosk는 전체화면, --kiosk-printing은 인쇄 대화상자 없이 기본 프린터로 바로 출력한다.
    /// </summary>
    public string BrowserArguments { get; set; } = "--kiosk --kiosk-printing";
}
