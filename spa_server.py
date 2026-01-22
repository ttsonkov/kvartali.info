#!/usr/bin/env python3
"""
Simple HTTP server for SPA (Single Page Application) development.
Serves all routes to index.html to support client-side routing.
"""

import http.server
import socketserver
import os
from urllib.parse import urlparse

PORT = 8000

class SPAHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP handler that serves index.html for all non-file routes"""
    
    def do_GET(self):
        # Parse the URL path
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        # Remove leading slash
        if path.startswith('/'):
            path = path[1:]
        
        # If empty path, serve index.html
        if not path:
            path = 'index.html'
        
        # Check if the requested path is a file that exists
        if os.path.isfile(path):
            # Serve the actual file (CSS, JS, images, etc.)
            return super().do_GET()
        
        # Check if path has a file extension (like .css, .js, .json, etc.)
        if '.' in os.path.basename(path):
            # It's a file request but doesn't exist - return 404
            return super().do_GET()
        
        # For all other routes (SPA routes), serve index.html
        self.path = '/index.html'
        return super().do_GET()
    
    def end_headers(self):
        # Add CORS headers for local development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

def run_server():
    """Start the SPA server"""
    handler = SPAHTTPRequestHandler
    
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        print(f"🚀 SPA Server running at http://localhost:{PORT}/")
        print(f"📁 Serving: {os.getcwd()}")
        print(f"\n✅ Test URLs:")
        print(f"   http://localhost:{PORT}/")
        print(f"   http://localhost:{PORT}/sofia")
        print(f"   http://localhost:{PORT}/detskigradini/sofia")
        print(f"   http://localhost:{PORT}/lekari/varna")
        print(f"\n⏹️  Press Ctrl+C to stop\n")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n👋 Server stopped")
            pass

if __name__ == '__main__':
    run_server()
