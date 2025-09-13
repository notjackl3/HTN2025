import cv2
import numpy as np
import mediapipe as mp
import face_recognition
from typing import List, Dict, Tuple
import os
import json

# Initialize MediaPipe face detection
mp_face_detection = mp.solutions.face_detection
mp_drawing = mp.solutions.drawing_utils

# Enhanced object detection classes with sponsor categories
CLASSES = [
    "background", "person", "bicycle", "car", "motorcycle", "airplane", "bus", "train", "truck", "boat",
    "traffic light", "fire hydrant", "stop sign", "parking meter", "bench", "bird", "cat", "dog", "horse",
    "sheep", "cow", "elephant", "bear", "zebra", "giraffe", "backpack", "umbrella", "handbag", "tie",
    "suitcase", "frisbee", "skis", "snowboard", "sports ball", "kite", "baseball bat", "baseball glove",
    "skateboard", "surfboard", "tennis racket", "bottle", "wine glass", "cup", "fork", "knife", "spoon",
    "bowl", "banana", "apple", "sandwich", "orange", "broccoli", "carrot", "hot dog", "pizza", "donut",
    "cake", "chair", "couch", "potted plant", "bed", "dining table", "toilet", "tv", "laptop", "mouse",
    "remote", "keyboard", "cell phone", "microwave", "oven", "toaster", "sink", "refrigerator", "book",
    "clock", "vase", "scissors", "teddy bear", "hair drier", "toothbrush"
]

# Sponsor categories for enhanced betting
SPONSOR_CATEGORIES = {
    "tech_giants": {
        "keywords": ["laptop", "mouse", "keyboard", "cell phone", "tv", "remote"],
        "multiplier": 1.5,
        "sponsor": "Tech Giants"
    },
    "food_delivery": {
        "keywords": ["bottle", "wine glass", "cup", "fork", "knife", "spoon", "bowl", "pizza", "donut", "cake"],
        "multiplier": 2.0,
        "sponsor": "Food Delivery"
    },
    "transportation": {
        "keywords": ["bicycle", "car", "motorcycle", "bus", "train", "truck", "boat", "airplane"],
        "multiplier": 1.8,
        "sponsor": "Transportation"
    },
    "sports_fitness": {
        "keywords": ["sports ball", "skateboard", "surfboard", "tennis racket", "frisbee", "skis", "snowboard"],
        "multiplier": 2.2,
        "sponsor": "Sports & Fitness"
    },
    "fashion_lifestyle": {
        "keywords": ["backpack", "umbrella", "handbag", "tie", "suitcase", "watch", "jewelry"],
        "multiplier": 1.3,
        "sponsor": "Fashion & Lifestyle"
    },
    "home_office": {
        "keywords": ["chair", "couch", "bed", "dining table", "book", "clock", "vase", "lamp"],
        "multiplier": 1.1,
        "sponsor": "Home & Office"
    }
}

def load_object_detection_model():
    """Load the MobileNet SSD model for object detection"""
    try:
        # Try to load the model files (you'll need to download these)
        net = cv2.dnn.readNetFromCaffe(
            'MobileNetSSD_deploy.prototxt',
            'MobileNetSSD_deploy.caffemodel'
        )
        return net
    except:
        # Fallback: return None if model files not found
        print("Warning: MobileNet SSD model files not found. Object detection will be limited.")
        return None

def load_yolo_model():
    """Load YOLO model for better object detection"""
    try:
        # Try to load YOLO model
        net = cv2.dnn.readNet('yolov4.weights', 'yolov4.cfg')
        return net
    except:
        print("Warning: YOLO model files not found. Using fallback detection.")
        return None

# Global model variables
object_net = load_object_detection_model()
yolo_net = load_yolo_model()

def detect_objects_enhanced(image_bytes: bytes, confidence_threshold: float = 0.4) -> Dict:
    """
    Enhanced object detection with sponsor categorization and external webcam optimization
    
    Args:
        image_bytes: Raw image bytes from external webcam
        confidence_threshold: Minimum confidence for detection
    
    Returns:
        Dictionary with detected objects, sponsor categories, and betting opportunities
    """
    if object_net is None and yolo_net is None:
        # Fallback: return mock data for demo
        return {
            "objects": ["laptop", "coffee cup", "phone"],
            "sponsor_categories": ["tech_giants"],
            "betting_opportunities": [
                {
                    "object": "laptop",
                    "sponsor": "Tech Giants",
                    "multiplier": 1.5,
                    "confidence": 0.8
                }
            ],
            "total_objects": 3
        }
    
    try:
        # Convert bytes to numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            return {"objects": [], "sponsor_categories": [], "betting_opportunities": [], "total_objects": 0}
        
        # Preprocess for external webcam (shirt clip perspective)
        frame = preprocess_external_camera_frame(frame)
        
        detected_objects = []
        sponsor_categories = set()
        betting_opportunities = []
        
        # Try YOLO first (better accuracy)
        if yolo_net is not None:
            yolo_results = detect_with_yolo(frame, confidence_threshold)
            detected_objects.extend(yolo_results["objects"])
            sponsor_categories.update(yolo_results["sponsor_categories"])
            betting_opportunities.extend(yolo_results["betting_opportunities"])
        
        # Fallback to MobileNet SSD
        if object_net is not None and len(detected_objects) == 0:
            ssd_results = detect_with_mobilenet(frame, confidence_threshold)
            detected_objects.extend(ssd_results["objects"])
            sponsor_categories.update(ssd_results["sponsor_categories"])
            betting_opportunities.extend(ssd_results["betting_opportunities"])
        
        # Remove duplicates and filter
        detected_objects = list(set(detected_objects))
        sponsor_categories = list(sponsor_categories)
        
        return {
            "objects": detected_objects,
            "sponsor_categories": sponsor_categories,
            "betting_opportunities": betting_opportunities,
            "total_objects": len(detected_objects)
        }
    
    except Exception as e:
        print(f"Error in enhanced object detection: {e}")
        return {"objects": [], "sponsor_categories": [], "betting_opportunities": [], "total_objects": 0}

def preprocess_external_camera_frame(frame):
    """Preprocess frame for external webcam (shirt clip perspective)"""
    # Resize for better processing
    height, width = frame.shape[:2]
    if width > 1280:
        scale = 1280 / width
        new_width = int(width * scale)
        new_height = int(height * scale)
        frame = cv2.resize(frame, (new_width, new_height))
    
    # Enhance contrast for better detection
    lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    l = clahe.apply(l)
    enhanced = cv2.merge([l, a, b])
    frame = cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)
    
    return frame

def detect_with_yolo(frame, confidence_threshold):
    """Detect objects using YOLO model"""
    try:
        height, width = frame.shape[:2]
        
        # Create blob
        blob = cv2.dnn.blobFromImage(frame, 1/255.0, (416, 416), swapRB=True, crop=False)
        yolo_net.setInput(blob)
        outputs = yolo_net.forward()
        
        detected_objects = []
        sponsor_categories = set()
        betting_opportunities = []
        
        # Process detections
        for output in outputs:
            for detection in output:
                scores = detection[5:]
                class_id = np.argmax(scores)
                confidence = scores[class_id]
                
                if confidence > confidence_threshold and class_id < len(CLASSES):
                    object_name = CLASSES[class_id]
                    detected_objects.append(object_name)
                    
                    # Check sponsor categories
                    category_info = get_sponsor_category(object_name)
                    if category_info:
                        sponsor_categories.add(category_info["category"])
                        betting_opportunities.append({
                            "object": object_name,
                            "sponsor": category_info["sponsor"],
                            "multiplier": category_info["multiplier"],
                            "confidence": float(confidence)
                        })
        
        return {
            "objects": detected_objects,
            "sponsor_categories": list(sponsor_categories),
            "betting_opportunities": betting_opportunities
        }
    
    except Exception as e:
        print(f"Error in YOLO detection: {e}")
        return {"objects": [], "sponsor_categories": [], "betting_opportunities": []}

def detect_with_mobilenet(frame, confidence_threshold):
    """Detect objects using MobileNet SSD model"""
    try:
        (h, w) = frame.shape[:2]
        
        # Create blob
        blob = cv2.dnn.blobFromImage(
            cv2.resize(frame, (300, 300)), 
            0.007843, 
            (300, 300), 
            127.5
        )
        
        object_net.setInput(blob)
        detections = object_net.forward()
        
        detected_objects = []
        sponsor_categories = set()
        betting_opportunities = []
        
        # Process detections
        for i in range(detections.shape[2]):
            confidence = detections[0, 0, i, 2]
            
            if confidence > confidence_threshold:
                idx = int(detections[0, 0, i, 1])
                if idx < len(CLASSES):
                    object_name = CLASSES[idx]
                    detected_objects.append(object_name)
                    
                    # Check sponsor categories
                    category_info = get_sponsor_category(object_name)
                    if category_info:
                        sponsor_categories.add(category_info["category"])
                        betting_opportunities.append({
                            "object": object_name,
                            "sponsor": category_info["sponsor"],
                            "multiplier": category_info["multiplier"],
                            "confidence": float(confidence)
                        })
        
        return {
            "objects": detected_objects,
            "sponsor_categories": list(sponsor_categories),
            "betting_opportunities": betting_opportunities
        }
    
    except Exception as e:
        print(f"Error in MobileNet detection: {e}")
        return {"objects": [], "sponsor_categories": [], "betting_opportunities": []}

def get_sponsor_category(object_name):
    """Get sponsor category information for an object"""
    for category, info in SPONSOR_CATEGORIES.items():
        if object_name in info["keywords"]:
            return {
                "category": category,
                "sponsor": info["sponsor"],
                "multiplier": info["multiplier"]
            }
    return None

# Legacy function for backward compatibility
def detect_objects(image_bytes: bytes, confidence_threshold: float = 0.4) -> List[str]:
    """Legacy function - use detect_objects_enhanced for new features"""
    result = detect_objects_enhanced(image_bytes, confidence_threshold)
    return result["objects"]

def detect_faces(image_bytes: bytes) -> List[Dict]:
    """
    Detect faces in an image using MediaPipe
    
    Args:
        image_bytes: Raw image bytes
    
    Returns:
        List of face detection results
    """
    try:
        # Convert bytes to numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            return []
        
        # Convert BGR to RGB
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Initialize face detection
        with mp_face_detection.FaceDetection(
            model_selection=0, 
            min_detection_confidence=0.5
        ) as face_detection:
            
            results = face_detection.process(rgb_frame)
            
            faces = []
            if results.detections:
                for detection in results.detections:
                    # Get bounding box
                    bbox = detection.location_data.relative_bounding_box
                    h, w, _ = frame.shape
                    
                    face_info = {
                        "confidence": detection.score[0],
                        "bounding_box": {
                            "x": int(bbox.xmin * w),
                            "y": int(bbox.ymin * h),
                            "width": int(bbox.width * w),
                            "height": int(bbox.height * h)
                        }
                    }
                    faces.append(face_info)
            
            return faces
    
    except Exception as e:
        print(f"Error in face detection: {e}")
        return []

def detect_faces_advanced(image_bytes: bytes) -> List[Dict]:
    """
    Advanced face detection using face_recognition library
    This provides more detailed face analysis but requires more setup
    """
    try:
        # Convert bytes to numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            return []
        
        # Convert BGR to RGB
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Find face locations
        face_locations = face_recognition.face_locations(rgb_frame)
        face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)
        
        faces = []
        for i, (top, right, bottom, left) in enumerate(face_locations):
            face_info = {
                "id": i,
                "bounding_box": {
                    "x": left,
                    "y": top,
                    "width": right - left,
                    "height": bottom - top
                },
                "encoding": face_encodings[i].tolist() if i < len(face_encodings) else None
            }
            faces.append(face_info)
        
        return faces
    
    except Exception as e:
        print(f"Error in advanced face detection: {e}")
        return []

def get_face_encoding(image_bytes: bytes) -> List[float]:
    """
    Get face encoding for a single face in the image
    Useful for face recognition/comparison
    """
    try:
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            return []
        
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        face_encodings = face_recognition.face_encodings(rgb_frame)
        
        if face_encodings:
            return face_encodings[0].tolist()
        
        return []
    
    except Exception as e:
        print(f"Error getting face encoding: {e}")
        return []
