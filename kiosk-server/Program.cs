using System.Diagnostics;
using System.Drawing;
using System.Drawing.Printing;
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
                await SavePrintAsync(request, baseDirectory, settings));
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

    private static async Task<IResult> SavePrintAsync(
        HttpRequest request,
        string baseDirectory,
        KioskSettings settings)
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

            // 저장이 끝나면 서버가 직접 프린터로 보낸다. 브라우저는 인쇄에 관여하지 않으므로
            // 인쇄 대화상자가 뜨지 않는다. 실패해도 저장은 이미 끝났으므로 요청은 성공으로 둔다.
            var printed = false;
            string? printError = null;
            if (settings.SilentPrint)
            {
                var imagePath = Path.Combine(outputDirectory, imageFile);
                (printed, printError) = PrintImage(imagePath, settings, baseDirectory);
            }

            return Results.Json(new { ok = true, imageFile, jsonFile, printed, printError });
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

    /// <summary>
    /// 저장된 PNG를 프린터로 직접 보낸다. 브라우저를 거치지 않으므로 인쇄 대화상자가 없다.
    /// </summary>
    private static (bool Printed, string? Error) PrintImage(
        string imagePath,
        KioskSettings settings,
        string baseDirectory)
    {
        try
        {
            using var image = Image.FromFile(imagePath);
            using var document = new PrintDocument();

            var printerName = settings.PrinterName?.Trim() ?? string.Empty;
            if (printerName.Length > 0)
            {
                document.PrinterSettings.PrinterName = printerName;
            }

            if (!document.PrinterSettings.IsValid)
            {
                var target = printerName.Length > 0 ? printerName : "기본 프린터";
                var message = $"프린터를 사용할 수 없습니다: {target}";
                WriteLog(baseDirectory, message);
                return (false, message);
            }

            // 확인용: 실제 용지 대신 파일로 출력(파일명을 묻는 대화상자도 뜨지 않는다).
            var printToFilePath = settings.PrintToFilePath?.Trim() ?? string.Empty;
            if (printToFilePath.Length > 0)
            {
                document.PrinterSettings.PrintToFile = true;
                document.PrinterSettings.PrintFileName = Path.GetFullPath(printToFilePath);
            }

            document.DocumentName = Path.GetFileNameWithoutExtension(imagePath);
            document.OriginAtMargins = false;
            document.DefaultPageSettings.Margins = new Margins(0, 0, 0, 0);
            document.DefaultPageSettings.Landscape = image.Width > image.Height;

            var paperSize = FindPaperSize(document.PrinterSettings, settings);
            if (paperSize is not null)
            {
                document.DefaultPageSettings.PaperSize = paperSize;
            }

            document.PrintPage += (_, pageEvent) =>
            {
                if (pageEvent.Graphics is null) return;
                pageEvent.Graphics.InterpolationMode =
                    System.Drawing.Drawing2D.InterpolationMode.HighQualityBicubic;

                // 용지를 꽉 채우되 비율은 유지한다(넘치는 부분은 잘림). 인화지 출력과 같은 방식.
                var bounds = pageEvent.PageBounds;
                var scale = Math.Max(
                    (float)bounds.Width / image.Width,
                    (float)bounds.Height / image.Height);
                var width = image.Width * scale;
                var height = image.Height * scale;
                var x = bounds.X + ((bounds.Width - width) / 2f);
                var y = bounds.Y + ((bounds.Height - height) / 2f);

                pageEvent.Graphics.DrawImage(image, x, y, width, height);
                pageEvent.HasMorePages = false;
            };

            document.Print();

            var used = document.DefaultPageSettings.PaperSize;
            WriteLog(
                baseDirectory,
                $"인쇄 전송: {Path.GetFileName(imagePath)} → {document.PrinterSettings.PrinterName}" +
                $" (용지 {used.PaperName} {used.Width}x{used.Height})");
            return (true, null);
        }
        catch (Exception error)
        {
            WriteLog(baseDirectory, $"인쇄 실패: {error}");
            return (false, error.Message);
        }
    }

    /// <summary>
    /// 4x6인치(단위 1/100인치 기준 400x600)에 가장 가까운 용지를 고른다.
    /// PaperSizeName을 지정했으면 그 이름을 우선한다. 맞는 용지가 없으면 null(프린터 기본값 사용).
    /// </summary>
    private static PaperSize? FindPaperSize(PrinterSettings printerSettings, KioskSettings settings)
    {
        var wantedName = settings.PaperSizeName?.Trim() ?? string.Empty;
        if (wantedName.Length > 0)
        {
            foreach (PaperSize size in printerSettings.PaperSizes)
            {
                if (string.Equals(size.PaperName, wantedName, StringComparison.OrdinalIgnoreCase))
                {
                    return size;
                }
            }
            return null;
        }

        const int targetShortSide = 400;
        const int targetLongSide = 600;
        PaperSize? best = null;
        var bestDistance = int.MaxValue;

        foreach (PaperSize size in printerSettings.PaperSizes)
        {
            var shortSide = Math.Min(size.Width, size.Height);
            var longSide = Math.Max(size.Width, size.Height);
            var distance = Math.Abs(shortSide - targetShortSide) + Math.Abs(longSide - targetLongSide);
            if (distance < bestDistance)
            {
                bestDistance = distance;
                best = size;
            }
        }

        // 0.4인치 넘게 차이나면 4x6 용지가 없는 것으로 보고 프린터 기본 용지를 쓴다.
        return bestDistance <= 40 ? best : null;
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

    /// <summary>
    /// true면 서버가 저장한 이미지를 프린터로 직접 보낸다(인쇄 대화상자 없음).
    /// false로 두면 브라우저가 인쇄를 처리하며, 이때는 인쇄 대화상자가 나타난다.
    /// </summary>
    public bool SilentPrint { get; set; } = true;

    /// <summary>사용할 프린터 이름. 비워 두면 Windows 기본 프린터.</summary>
    public string PrinterName { get; set; } = string.Empty;

    /// <summary>용지 이름을 강제로 지정할 때 사용. 비워 두면 4x6인치에 가장 가까운 용지를 고른다.</summary>
    public string PaperSizeName { get; set; } = string.Empty;

    /// <summary>
    /// 설정하면 실제 용지 대신 이 경로의 파일로 출력한다(PDF 프린터 등).
    /// 종이를 쓰지 않고 인쇄 설정을 확인할 때만 사용하고, 운영 시에는 비워 둔다.
    /// </summary>
    public string PrintToFilePath { get; set; } = string.Empty;
}
