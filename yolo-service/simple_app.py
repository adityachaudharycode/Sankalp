# !/usr/bin/env python3
"""
Simple YOLO Mock Service for Face Detection
This is a lightweight mock service that simulates face detection without heavy ML dependencies
"""

from flask import Flask, request, jsonify
import requests
import random
import base64
import io
import json
from PIL import Image, ImageDraw
import os

app = Flask(__name__)

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'service': 'mock-yolo'})

@app.route('/count-students', methods=['POST'])
def count_students():
    try:
        data = request.get_json()
        image_url = data.get('imageUrl')

        if not image_url:
            return jsonify({'error': 'No image URL provided'}), 400

        print(f"Processing image: {image_url}")

        # Download image from URL
        try:
            response = requests.get(image_url, timeout=10)
            if response.status_code != 200:
                return jsonify({'error': 'Failed to download image'}), 400
        except Exception as e:
            return jsonify({'error': f'Failed to download image: {str(e)}'}), 400

        # Convert to PIL Image
        try:
            image = Image.open(io.BytesIO(response.content))
            width, height = image.size
            print(f"Image dimensions: {width}x{height}")
        except Exception as e:
            return jsonify({'error': f'Invalid image format: {str(e)}'}), 400

        # Mock face detection logic
        # Generate realistic face count based on image size and some randomness
        estimated_faces = max(1, min(50, (width * height) // 50000))  # Rough estimate
        face_count = max(1, estimated_faces + random.randint(-2, 3))
        
        print(f"Estimated faces: {face_count}")

        # Create mock bounding boxes
        detected_faces = []
        annotated_image = image.copy()
        draw = ImageDraw.Draw(annotated_image)

        # Generate realistic face positions
        for i in range(face_count):
            # Random position but avoid edges
            margin = 50
            x1 = random.randint(margin, width - margin - 100)
            y1 = random.randint(margin, height - margin - 100)
            face_size = random.randint(60, 120)  # Realistic face size
            x2 = min(width - margin, x1 + face_size)
            y2 = min(height - margin, y1 + face_size)

            # Draw red rectangle around detected "face"
            draw.rectangle([x1, y1, x2, y2], outline='red', width=3)
            
            # Add face number
            draw.text((x1, y1-20), f'Face {i+1}', fill='red')

            detected_faces.append({
                'bbox': [float(x1), float(y1), float(x2), float(y2)],
                'confidence': round(random.uniform(0.7, 0.95), 2)
            })

        # Convert annotated image to base64
        buffer = io.BytesIO()
        annotated_image.save(buffer, format='JPEG', quality=85)
        annotated_image_b64 = base64.b64encode(buffer.getvalue()).decode()

        result = {
            'studentCount': int(face_count),
            'face_count': int(face_count),  # Alternative field name
            'confidence': 0.85,
            'processed': True,
            'detectedFaces': detected_faces,
            'faces': detected_faces,  # Alternative field name
            'annotatedImage': f'data:image/jpeg;base64,{annotated_image_b64}',
            'annotated_image_url': f'data:image/jpeg;base64,{annotated_image_b64}',  # Alternative field name
            'mock': True,
            'image_dimensions': {'width': width, 'height': height}
        }

        print(f"Returning result: face_count={face_count}, confidence=0.85")
        return jsonify(result)

    except Exception as e:
        print(f"Error processing image: {str(e)}")
        return jsonify({'error': f'Failed to process image: {str(e)}'}), 500

@app.route('/test', methods=['GET'])
def test_endpoint():
    """Test endpoint to verify service is working"""
    return jsonify({
        'message': 'YOLO Mock Service is running',
        'endpoints': ['/health', '/count-students', '/test'],
        'status': 'ready'
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    print(f"Starting YOLO Mock Service on port {port}")
    print("Available endpoints:")
    print("  GET  /health - Health check")
    print("  POST /count-students - Face detection")
    print("  GET  /test - Test endpoint")
    app.run(host='0.0.0.0', port=port, debug=True)
