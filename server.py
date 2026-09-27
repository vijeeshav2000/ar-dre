import http.server
import os
import re
import socketserver
import sys

class RangeHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

    def send_head(self):
        if 'Range' not in self.headers:
            return super().send_head()
        
        path = self.translate_path(self.path)
        if not os.path.isfile(path):
            return super().send_head()

        range_header = self.headers['Range']
        match = re.match(r'^bytes=(\d+)-(\d+)?$', range_header.strip())
        if not match:
            return super().send_head()

        size = os.path.getsize(path)
        start = int(match.group(1))
        end = int(match.group(2)) if match.group(2) else size - 1

        if start >= size:
            self.send_error(416, "Requested Range Not Satisfiable")
            return None

        self.send_response(206)
        self.send_header("Content-type", self.guess_type(path))
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Content-Length", str(end - start + 1))
        self.end_headers()

        f = open(path, 'rb')
        f.seek(start)
        
        class ChunkReader:
            def __init__(self, file_handle, total_bytes):
                self.f = file_handle
                self.total = total_bytes
            def read(self, n=-1):
                if self.total <= 0:
                    return b""
                read_size = self.total if n < 0 else min(n, self.total)
                chunk = self.f.read(read_size)
                self.total -= len(chunk)
                return chunk
            def close(self):
                self.f.close()

        return ChunkReader(f, end - start + 1)

if __name__ == '__main__':
    port = 8000
    socketserver.TCPServer.allow_reuse_address = True
    with http.server.ThreadingHTTPServer(('0.0.0.0', port), RangeHTTPRequestHandler) as httpd:
        print(f"Serving at http://localhost:{port}/ with HTTP Range Support", flush=True)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass
