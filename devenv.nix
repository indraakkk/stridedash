{ pkgs, ... }:

{
  packages = [
    pkgs.nodejs_22
    pkgs.bun
    pkgs.ffmpeg
    pkgs.uv
  ];

  dotenv.enable = true;

  env = {
    PLAYWRIGHT_BROWSERS_PATH = "$HOME/.cache/ms-playwright";
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = "0";
  };

  enterShell = ''
    export PATH="$PWD/node_modules/.bin:$HOME/.local/bin:$PATH"

    echo ""
    echo "=== stridash ==="
    echo "  node $(node --version)"
    echo "  bun $(bun --version)"
    echo "  ffmpeg $(ffmpeg -version 2>&1 | head -1)"
    echo "  uv $(uv --version)"
    echo ""
  '';
}
