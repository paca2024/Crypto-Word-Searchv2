from http.server import HTTPServer, SimpleHTTPRequestHandler
import os

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        return super().end_headers()

def run_server():
    # Change to the directory containing your web files
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Create server
    port = 8080
    server = HTTPServer(('0.0.0.0', port), CORSRequestHandler)
    print(f'Server started at http://localhost:{port}')
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nShutting down server...')
        server.socket.close()

if __name__ == '__main__':
    run_server()
