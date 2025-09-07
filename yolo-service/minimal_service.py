
"""
Minimal HTTP server for YOLO mock service using only built-in Python modules
"""

import http.server
import socketserver
import json
import urllib.parse
import urllib.request
import random
import base64
import io
import os

class YOLOHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            response = {'status': 'healthy', 'service': 'minimal-yolo-mock'}
            self.wfile.write(json.dumps(response).encode())
        
        elif self.path == '/test':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            response = {
                'message': 'Minimal YOLO Mock Service is running',
                'endpoints': ['/health', '/count-students', '/test'],
                'status': 'ready'
            }
            self.wfile.write(json.dumps(response).encode())
        
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_POST(self):
        if self.path == '/count-students':
            try:
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode('utf-8'))
                
                image_url = data.get('imageUrl')
                if not image_url:
                    self.send_error_response({'error': 'No image URL provided'}, 400)
                    return
                
                print(f"Processing image: {image_url}")
                
                # Mock face detection - generate random but realistic count
                face_count = random.randint(5, 35)  # Realistic range for classroom
                
                # Create mock response
                detected_faces = []
                for i in range(face_count):
                    detected_faces.append({
                        'bbox': [
                            random.randint(50, 400),  # x1
                            random.randint(50, 300),  # y1
                            random.randint(450, 600), # x2
                            random.randint(350, 450)  # y2
                        ],
                        'confidence': round(random.uniform(0.7, 0.95), 2)
                    })
                
                # Create a simple base64 placeholder image (1x1 red pixel)
                placeholder_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
                
                result = {
                    'studentCount': int(face_count),
                    'face_count': int(face_count),
                    'confidence': 0.85,
                    'processed': True,
                    'detectedFaces': detected_faces,
                    'faces': detected_faces,
                    'annotatedImage': f'data:image/png;base64,{placeholder_b64}',
                    'annotated_image_url': f'data:image/png;base64,{placeholder_b64}',
                    'mock': True,
                    'message': f'Mock detection found {face_count} faces'
                }
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(result).encode())
                
                print(f"Returned mock result: {face_count} faces detected")
                
            except Exception as e:
                print(f"Error: {str(e)}")
                self.send_error_response({'error': f'Failed to process image: {str(e)}'}, 500)
        
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_OPTIONS(self):
        # Handle CORS preflight requests
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def send_error_response(self, error_data, status_code):
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(error_data).encode())

def run_server(port=8080):
    with socketserver.TCPServer(("", port), YOLOHandler) as httpd:
        print(f"Minimal YOLO Mock Service running on port {port}")
        print("Available endpoints:")
        print("  GET  /health - Health check")
        print("  POST /count-students - Face detection (mock)")
        print("  GET  /test - Test endpoint")
        print(f"Access at: http://localhost:{port}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server...")
            httpd.shutdown()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    run_server(port)
