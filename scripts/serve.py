#!/usr/bin/env python3
"""CanFenci'yi bağımlılıksız bir yerel HTTP sunucusunda açar."""

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os
import threading
import webbrowser


PROJECT_ROOT = Path(__file__).resolve().parent.parent
HOST = "127.0.0.1"
PORT = 4173


class NoCacheHandler(SimpleHTTPRequestHandler):
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript",
        ".json": "application/json",
        ".webp": "image/webp",
        ".webm": "video/webm",
        ".svg": "image/svg+xml",
    }

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


def open_browser(url):
    import shutil
    import subprocess
    import sys
    try:
        if sys.platform == "darwin" and shutil.which("open"):
            subprocess.Popen(["open", url], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            return
        if shutil.which("xdg-open"):
            subprocess.Popen(["xdg-open", url], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            return
    except Exception:
        pass
    webbrowser.open(url)


def main():
    os.chdir(PROJECT_ROOT)
    server = ThreadingHTTPServer((HOST, PORT), NoCacheHandler)
    url = f"http://{HOST}:{PORT}"
    print(f"CanFenci hazır: {url}")
    print("Kapatmak için bu pencereye dönüp Ctrl+C tuşlarına basın.")
    threading.Timer(0.6, lambda: open_browser(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nCanFenci kapatıldı.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
