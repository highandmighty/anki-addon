from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler


class UTF8Handler(SimpleHTTPRequestHandler):
    def guess_type(self, path):
        ctype = super().guess_type(path) or "application/octet-stream"
        return f"{ctype}; charset=utf-8" if ctype.startswith("text/") else ctype


if __name__ == "__main__":
    ThreadingHTTPServer(("127.0.0.1", 8000), UTF8Handler).serve_forever()