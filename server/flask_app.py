import os
import cv2
import base64
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from ultralytics import YOLO
import mimetypes
import re

# ---------------- CONFIG ----------------
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'}
MAX_FILE_SIZE = 16 * 1024 * 1024  # 16MB
MODEL_PATH = "yolov8n-face.pt"   # <-- change if your model is elsewhere

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ---------------- APP ----------------
app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})  # allow frontend

# Load YOLOv8 face model
print("📥 Loading YOLOv8 model...")
model = YOLO(MODEL_PATH)
print("✅ Model loaded")

# ---------------- HELPERS ----------------
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def secure_filename(filename):
    return re.sub(r'[^a-zA-Z0-9._-]', '_', filename)

def generate_filename(original_filename):
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_%f')[:-3]
    name, ext = os.path.splitext(secure_filename(original_filename))
    return f"{timestamp}_{name}{ext}"

def image_to_base64(image):
    _, buffer = cv2.imencode('.jpg', image)
    return "data:image/jpeg;base64," + base64.b64encode(buffer).decode()

# ---------------- ROUTES ----------------
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'service': 'flask-yolo-server',
        'yolo_available': True,
        'upload_folder': UPLOAD_FOLDER,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/upload-and-process', methods=['POST'])
def upload_and_process():
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400

        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type'}), 400

        # Save file
        filename = generate_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        # Run YOLOv8 face detection
        results = model(filepath)
        boxes = results[0].boxes.xyxy.cpu().numpy()
        confidences = results[0].boxes.conf.cpu().numpy()

        faces = []
        img = cv2.imread(filepath)

        for i, box in enumerate(boxes):
            x1, y1, x2, y2 = box.astype(int)
            conf = float(confidences[i])

            faces.append({
                'bbox': [int(x1), int(y1), int(x2), int(y2)],
                'confidence': conf
            })

            # Draw box
            cv2.rectangle(img, (x1, y1), (x2, y2), (0, 0, 255), 2)

        # Save annotated file
        annotated_filename = f"annotated_{filename}"
        annotated_path = os.path.join(app.config['UPLOAD_FOLDER'], annotated_filename)
        cv2.imwrite(annotated_path, img)

        # Convert annotated image to base64
        annotated_base64 = image_to_base64(img)

        return jsonify({
            'success': True,
            'message': f'Detected {len(faces)} faces',
            'face_count': len(faces),
            'faces': faces,
            'original_image': {
                'filename': filename,
                'url': f'/uploads/{filename}'
            },
            'annotated_image': {
                'filename': annotated_filename,
                'url': f'/uploads/{annotated_filename}',
                'base64': annotated_base64
            },
            'processed_at': datetime.now().isoformat(),
            'yolo_used': True,
            'mock': False
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to process image', 'details': str(e)}), 500

@app.route('/uploads/<filename>', methods=['GET'])
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/list-uploads', methods=['GET'])
def list_uploads():
    try:
        files = []
        for filename in os.listdir(UPLOAD_FOLDER):
            if allowed_file(filename):
                filepath = os.path.join(UPLOAD_FOLDER, filename)
                stat = os.stat(filepath)
                files.append({
                    'filename': filename,
                    'url': f'/uploads/{filename}',
                    'size': stat.st_size,
                    'uploaded_at': datetime.fromtimestamp(stat.st_ctime).isoformat()
                })

        return jsonify({'success': True, 'files': files, 'count': len(files)})

    except Exception as e:
        return jsonify({'error': 'Failed to list files', 'details': str(e)}), 500

# ---------------- MAIN ----------------
if __name__ == '__main__':
    print("🚀 Starting Real Flask YOLOv8 Face Server...")
    print(f"📁 Upload folder: {os.path.abspath(UPLOAD_FOLDER)}")
    print(f"🤖 YOLO model: {MODEL_PATH}")
    app.run(host='0.0.0.0', port=5001, debug=False)
