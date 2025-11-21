from typing import List, Dict, Any, Optional
import os
import time
from app.core.config import settings

try:
    import easyocr
    import cv2
    import numpy as np
    from PIL import Image
    import torch
    EASYOCR_AVAILABLE = True
except ImportError:
    EASYOCR_AVAILABLE = False
    easyocr = None
    cv2 = None
    np = None
    torch = None


class OCRService:
    """Сервис для распознавания текста из изображений"""
    
    def __init__(self):
        self.reader = None
        
        
        self.languages = ['en', 'ru']  
    
    def load_model(self):
        """Загрузка модели EasyOCR"""
        if not EASYOCR_AVAILABLE:
            raise ImportError("EasyOCR не установлен. Установите: pip install easyocr")
        if self.reader is None:
            use_gpu = torch.cuda.is_available() if torch else False
            self.reader = easyocr.Reader(self.languages, gpu=use_gpu)
        return self.reader
    
    def recognize(
        self, 
        image_path: str,
        return_boxes: bool = True
    ) -> Dict[str, Any]:
        """
        Распознавание текста из изображения
        
        Args:
            image_path: Путь к изображению
            return_boxes: Возвращать ли координаты bounding boxes
            
        Returns:
            Словарь с результатами распознавания
        """
        reader = self.load_model()
        
        if not EASYOCR_AVAILABLE:
            raise ImportError("EasyOCR не установлен")
        
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"Не удалось загрузить изображение: {image_path}")
        
        results = reader.readtext(
            image_path,
            paragraph=False,  
            detail=1 if return_boxes else 0,  
        )
        
        
        full_text = []
        bounding_boxes = []
        
        for result in results:
            
            if return_boxes and isinstance(result, tuple) and len(result) == 3:
                bbox, text, confidence = result
                full_text.append(text)
                
                
                
                x_coords = [point[0] for point in bbox]
                y_coords = [point[1] for point in bbox]
                
                bounding_boxes.append({
                    "text": text,
                    "confidence": float(confidence),
                    "bbox": {
                        "x_min": min(x_coords),
                        "y_min": min(y_coords),
                        "x_max": max(x_coords),
                        "y_max": max(y_coords),
                        "points": bbox.tolist() if hasattr(bbox, 'tolist') else bbox
                    }
                })
            elif isinstance(result, str):
                
                full_text.append(result)
            else:
                
                if isinstance(result, tuple) and len(result) >= 2:
                    full_text.append(result[1])  
        
        result_text = " ".join(full_text)
        
        response = {
            "text": result_text,
            "language": "auto",  
            "bounding_boxes": bounding_boxes if return_boxes else None,
            "confidence": np.mean([box["confidence"] for box in bounding_boxes]) if bounding_boxes else None
        }
        
        return response
    
    def replace_text_on_image(
        self,
        image_path: str,
        translations: Dict[str, str],
        output_path: str
    ) -> str:
        """
        Бонусная функция: Замена текста на изображении переведенным текстом
        
        Args:
            image_path: Путь к исходному изображению
            translations: Словарь переводов {language_code: translated_text}
            output_path: Путь для сохранения обработанного изображения
            
        Returns:
            Путь к обработанному изображению
        """
        reader = self.load_model()
        image = cv2.imread(image_path)
        
        if image is None:
            raise ValueError(f"Не удалось загрузить изображение: {image_path}")
        
        
        results = reader.readtext(image_path)
        
        
        processed_image = image.copy()
        
        
        for (bbox, original_text, confidence) in results:
            if confidence > 0.5:  
                
                translated_text = list(translations.values())[0] if translations else original_text
                
                
                x_coords = [int(point[0]) for point in bbox]
                y_coords = [int(point[1]) for point in bbox]
                
                x_min, x_max = min(x_coords), max(x_coords)
                y_min, y_max = min(y_coords), max(y_coords)
                
                
                cv2.rectangle(processed_image, (x_min, y_min), (x_max, y_max), (255, 255, 255), -1)
                
                
                font = cv2.FONT_HERSHEY_SIMPLEX
                font_scale = 0.7
                color = (0, 0, 0)
                thickness = 2
                
                
                text_lines = translated_text.split('\n')
                line_height = 30
                
                for i, line in enumerate(text_lines):
                    y_pos = y_min + (i + 1) * line_height
                    cv2.putText(processed_image, line, (x_min, y_pos), font, font_scale, color, thickness)
        
        
        cv2.imwrite(output_path, processed_image)
        return output_path


ocr_service = OCRService()

