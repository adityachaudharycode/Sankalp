from flask import Flask, request, jsonify
import cv2
import numpy as np
from ultralytics import YOLO
import requests
from io import BytesIO
from PIL import Image, ImageDraw
import os
import base64

app = Flask(__name__)

# Load YOLOv8n-face model for face detection
try:
    # Try to load YOLOv8n-face model (better for face detection)
    model = YOLO('yolov8n-face.pt')
except:
    # Fallback to regular YOLOv8n if face model not available
    model = YOLO('yolov8n.pt')

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'})

@app.route('/count-students', methods=['POST'])
def count_students():
    try:
        data = request.get_json()
        image_url = data.get('imageUrl')

        if not image_url:
            return jsonify({'error': 'No image URL provided'}), 400

        # Download image from URL
        response = requests.get(image_url)
        if response.status_code != 200:
            return jsonify({'error': 'Failed to download image'}), 400

        # Convert to PIL Image
        image = Image.open(BytesIO(response.content))

        # Convert PIL to OpenCV format
        cv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)

        # Run YOLO detection
        results = model(cv_image)

        # Process results and draw bounding boxes
        face_count = 0
        detected_faces = []

        # Create a copy of the original image for drawing
        annotated_image = image.copy()
        draw = ImageDraw.Draw(annotated_image)

        for result in results:
            boxes = result.boxes
            if boxes is not None:
                # Get bounding boxes and confidence scores
                boxes_xyxy = boxes.xyxy.cpu().numpy()
                confidences = boxes.conf.cpu().numpy()

                # For YOLOv8n-face, all detections are faces
                # For regular YOLO, filter for person class (class 0)
                if hasattr(boxes, 'cls'):
                    classes = boxes.cls.cpu().numpy()
                    # Filter for faces/persons with confidence > 0.5
                    for i, (box, conf, cls) in enumerate(zip(boxes_xyxy, confidences, classes)):
                        if conf > 0.5 and (cls == 0 or 'face' in str(model.names.get(int(cls), ''))):
                            face_count += 1
                            x1, y1, x2, y2 = box

                            # Draw red rectangle around detected face
                            draw.rectangle([x1, y1, x2, y2], outline='red', width=3)

                            # Store face coordinates
                            detected_faces.append({
                                'bbox': [float(x1), float(y1), float(x2), float(y2)],
                                'confidence': float(conf)
                            })
                else:
                    # If no class info, assume all detections are faces
                    for i, (box, conf) in enumerate(zip(boxes_xyxy, confidences)):
                        if conf > 0.5:
                            face_count += 1
                            x1, y1, x2, y2 = box

                            # Draw red rectangle around detected face
                            draw.rectangle([x1, y1, x2, y2], outline='red', width=3)

                            detected_faces.append({
                                'bbox': [float(x1), float(y1), float(x2), float(y2)],
                                'confidence': float(conf)
                            })

        # Convert annotated image to base64 for return
        buffer = BytesIO()
        annotated_image.save(buffer, format='JPEG')
        annotated_image_b64 = base64.b64encode(buffer.getvalue()).decode()

        return jsonify({
            'studentCount': int(face_count),
            'confidence': 0.85,
            'processed': True,
            'detectedFaces': detected_faces,
            'annotatedImage': f'data:image/jpeg;base64,{annotated_image_b64}'
        })

    except Exception as e:
        print(f"Error processing image: {str(e)}")
        return jsonify({'error': 'Failed to process image'}), 500

@app.route('/mock-count', methods=['POST'])
def mock_count():
    """Mock endpoint for testing without actual YOLO processing"""
    try:
        data = request.get_json()
        reported_meals = data.get('reportedMeals', 10)
        
        # Generate a realistic mock count (within ±3 of reported)
        import random
        mock_count = max(1, reported_meals + random.randint(-3, 3))
        
        return jsonify({
            'studentCount': mock_count,
            'confidence': 0.75,
            'processed': True,
            'mock': True
        })
        
    except Exception as e:
        return jsonify({'error': 'Failed to generate mock count'}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=True)
