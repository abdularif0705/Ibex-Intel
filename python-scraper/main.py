"""
Python Scraper + NLP Signal Service
-----------------------------------
- curl_cffi + BoringSSL impersonation defeats TLS/JA3 bot checks
- Flask API also exposes TF-IDF signal scoring + stage classification (see similarity.py)
- Optional PyTorch SentenceTransformer (MiniLM) vector path is ready when sentence-transformers is installed

Installation:
    pip install -r requirements.txt  # includes Flask, curl_cffi, scikit-learn, numpy

Run:
    python main.py

Deploy Options:
    1. Railway.app (recommended, free tier available)
    2. Render.com (free tier)
    3. Any VPS with Python 3.8+
    4. Docker container

Environment Variables:
    PORT: Port to run on (default: 8080)
    ALLOWED_ORIGINS: Comma-separated list of allowed CORS origins
"""

from http.client import HTTPException
from urllib.request import Request
from flask import Flask, request, jsonify
from curl_cffi import requests
import os
import logging
from similarity import detect_erp_transformation_signals, classify_transformation_stage
# from similarity_vector import detect_erp_transformation_signals as detect_erp_transformation_signals_vector , classify_transformation_stage as classify_transformation_stage_vector  # Requires sentence-transformers (PyTorch)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# CORS configuration
ALLOWED_ORIGINS = os.getenv('ALLOWED_ORIGINS', '*').split(',')

def add_cors_headers(response):
    """Add CORS headers to response"""
    origin = request.headers.get('Origin', '*')
    if '*' in ALLOWED_ORIGINS or origin in ALLOWED_ORIGINS:
        response.headers['Access-Control-Allow-Origin'] = origin
    response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response

@app.after_request
def after_request(response):
    return add_cors_headers(response)

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'curl_cffi-scraper'}), 200

@app.route('/scrape', methods=['POST', 'OPTIONS'])
def scrape():
    """
    Scrape a URL using curl_cffi with browser impersonation
    
    Request body:
        {
            "url": "https://example.com",
            "browser": "chrome120" (optional, default: chrome120),
            "headers": {} (optional, additional headers)
        }
    """
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.get_json()
        url = data.get('url')
        browser = data.get('browser', 'chrome120')
        custom_headers = data.get('headers', {})
        
        if not url:
            return jsonify({'success': False, 'error': 'URL is required'}), 400
        
        logger.info(f"Scraping URL: {url} with browser profile: {browser}")
        
        # Available browser profiles:
        # chrome99, chrome100, chrome101, chrome104, chrome107, chrome110, chrome116, chrome119, chrome120
        # edge99, edge101
        # safari15_3, safari15_5, safari17_0, safari17_2_1
        
        # Perform request with browser impersonation
        response = requests.get(
            url,
            impersonate=browser,
            headers=custom_headers,
            timeout=30,
            allow_redirects=True
        )
        
        # Check if successful
        if response.status_code != 200:
            logger.warning(f"Non-200 status code: {response.status_code}")
            return jsonify({
                'success': False,
                'error': f'HTTP {response.status_code}',
                'status_code': response.status_code
            }), 200  # Return 200 but indicate failure in body
        
        # Extract content
        content = response.text
        
        # Basic text extraction (remove scripts and styles)
        import re
        text_content = re.sub(r'<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>', '', content, flags=re.IGNORECASE)
        text_content = re.sub(r'<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>', '', text_content, flags=re.IGNORECASE)
        text_content = re.sub(r'<[^>]+>', ' ', text_content)
        text_content = re.sub(r'\s+', ' ', text_content).strip()
        
        logger.info(f"Successfully scraped {url} - {len(content)} bytes")
        
        return jsonify({
            'success': True,
            'content': text_content,
            'html': content,
            'url': url,
            'status_code': response.status_code,
            'browser': browser
        }), 200
        
    except requests.RequestException as e:
        logger.error(f"Request error: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Request failed: {str(e)}'
        }), 200
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}'
        }), 500


@app.route("/api/v1/detect-signals", methods=["POST", "OPTIONS"])
def detect_signals():
    """
    Detect ERP transformation signals in provided text using enhanced NLP.
    
    Endpoint: POST /api/v1/detect-signals
    
    Request Body:
        {
            "text": <str, required> - The text to analyze (minimum 50 characters),
            "source": <str, optional> - Source identifier (default: "unknown"),
            "similarity_threshold": <float, optional> - Cosine similarity threshold (default: 0.35)
        }
    
    Response (200 OK):
        {
            "signals_found": int,
            "confidence_score_avg": float,
            "top_signals": list of dicts with calibrated confidence scores,
            "has_erp_context": bool,
            "source": str,
            "transformation_stage": {
                "stage": int (0-5),
                "stage_name": str,
                "confidence": int (0-100),
                "estimated_months_to_go_live": str,
                "evidence": list of strings
            }
        }
    
    Error Responses:
        400: Text too short, missing, or too long
        500: Internal server error
    """
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.get_json(force=True)
        text = data.get("text", "").strip()
        source = data.get("source", "unknown")
        similarity_threshold = float(data.get("similarity_threshold", 0.35))
        
        # Validation
        if not text or len(text) < 50:
            return jsonify({"error": "Text too short or missing (minimum 50 characters)"}), 400
        if len(text) > 100_000:
            return jsonify({"error": "Text too long (max 100,000 characters)"}), 400
        if not 0.2 <= similarity_threshold <= 0.9:
            return jsonify({"error": "similarity_threshold must be between 0.2 and 0.9"}), 400
        
        logger.info(f"Detecting signals for text of length {len(text)} from source: {source}")
        
        # 1. Detect signals using enhanced TF-IDF approach
        signals = detect_erp_transformation_signals(
            text,
            similarity_threshold=similarity_threshold,
            min_context_keywords=1
        )
        
        # 2. Classify transformation stage
        stage_info = classify_transformation_stage(signals, text)
        
        # Handle no signals case
        if not signals:
            logger.info("No transformation signals detected")
            return jsonify({
                "signals_found": 0,
                "confidence_score_avg": 0.0,
                "top_signals": [],
                "has_erp_context": False,
                "source": source,
                "transformation_stage": {
                    "stage": 0,
                    "stage_name": "No Activity",
                    "confidence": 0,
                    "estimated_months_to_go_live": "N/A",
                    "evidence": []
                },
                "message": "No ERP/HCM/PLM transformation signals detected"
            }), 200
        
        # Calculate average confidence
        avg_confidence = sum(s["confidence"] for s in signals) / len(signals)
        
        # Build response
        response = {
            "signals_found": len(signals),
            "confidence_score_avg": round(avg_confidence, 1),
            "top_signals": signals[:10],  # Top 10 signals
            "has_erp_context": True,
            "source": source,
            "transformation_stage": {
                "stage": stage_info["stage"],
                "stage_name": stage_info["stage_name"],
                "confidence": stage_info["confidence"],
                "estimated_months_to_go_live": stage_info["estimated_months_to_go_live"],
                "evidence": stage_info["evidence"]
            }
        }
        
        logger.info(f"Detected {len(signals)} signals, Stage {stage_info['stage']}: {stage_info['stage_name']}")
        return jsonify(response), 200
        
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        return jsonify({"error": f"Invalid input: {str(e)}"}), 400
    except Exception as e:
        logger.error(f"Signal detection error: {str(e)}", exc_info=True)
        return jsonify({"error": f"Server error: {str(e)}"}), 500 



# @app.route("/api/v1/detect-signals-vector", methods=["POST", "OPTIONS"])
# def detect_signals_vector():
#     """
#     Detect ERP transformation signals in provided text using enhanced NLP.
    
#     Endpoint: POST /api/v1/detect-signals-vector
    
#     Request Body:
#         {
#             "text": <str, required> - The text to analyze (minimum 50 characters),
#             "source": <str, optional> - Source identifier (default: "unknown"),
#             "similarity_threshold": <float, optional> - Cosine similarity threshold (default: 0.35)
#         }
    
#     Response (200 OK):
#         {
#             "signals_found": int,
#             "confidence_score_avg": float,
#             "top_signals": list of dicts with calibrated confidence scores,
#             "has_erp_context": bool,
#             "source": str,
#             "transformation_stage": {
#                 "stage": int (0-5),
#                 "stage_name": str,
#                 "confidence": int (0-100),
#                 "estimated_months_to_go_live": str,
#                 "evidence": list of strings
#             }
#         }
    
#     Error Responses:
#         400: Text too short, missing, or too long
#         500: Internal server error
#     """
#     if request.method == 'OPTIONS':
#         return '', 204
    
#     try:
#         data = request.get_json(force=True)
#         text = data.get("text", "").strip()
#         source = data.get("source", "unknown")
#         similarity_threshold = float(data.get("similarity_threshold", 0.35))
        
#         # Validation
#         if not text or len(text) < 50:
#             return jsonify({"error": "Text too short or missing (minimum 50 characters)"}), 400
#         if len(text) > 100_000:
#             return jsonify({"error": "Text too long (max 100,000 characters)"}), 400
#         if not 0.2 <= similarity_threshold <= 0.9:
#             return jsonify({"error": "similarity_threshold must be between 0.2 and 0.9"}), 400
        
#         logger.info(f"Detecting signals for text of length {len(text)} from source: {source}")
        
#         # 1. Detect signals using enhanced TF-IDF approach
#         signals = detect_erp_transformation_signals_vector(
#             text,
#             vector_threshold=similarity_threshold,
#             min_context_words=1
#         )
        
#         # 2. Classify transformation stage
#         stage_info = classify_transformation_stage_vector(signals, text)
        
#         # Handle no signals case
#         if not signals:
#             logger.info("No transformation signals detected")
#             return jsonify({
#                 "signals_found": 0,
#                 "confidence_score_avg": 0.0,
#                 "top_signals": [],
#                 "has_erp_context": False,
#                 "source": source,
#                 "transformation_stage": {
#                     "stage": 0,
#                     "stage_name": "No Activity",
#                     "confidence": 0,
#                     "estimated_months_to_go_live": "N/A",
#                     "evidence": []
#                 },
#                 "message": "No ERP/HCM/PLM transformation signals detected"
#             }), 200
        
#         # Calculate average confidence
#         avg_confidence = sum(s["confidence"] for s in signals) / len(signals)
        
#         # Build response
#         response = {
#             "signals_found": len(signals),
#             "confidence_score_avg": round(avg_confidence, 1),
#             "top_signals": signals[:10],  # Top 10 signals
#             "has_erp_context": True,
#             "source": source,
#             "transformation_stage": {
#                 "stage": stage_info["stage"],
#                 "stage_name": stage_info["stage_name"],
#                 "confidence": stage_info["confidence"],
#                 "estimated_months_to_go_live": stage_info["estimated_months_to_go_live"],
#                 "evidence": stage_info["evidence"]
#             }
#         }
        
#         logger.info(f"Detected {len(signals)} signals, Stage {stage_info['stage']}: {stage_info['stage_name']}")
#         return jsonify(response), 200
        
#     except ValueError as e:
#         logger.error(f"Validation error: {str(e)}")
#         return jsonify({"error": f"Invalid input: {str(e)}"}), 400
#     except Exception as e:
#         logger.error(f"Signal detection error: {str(e)}", exc_info=True)
#         return jsonify({"error": f"Server error: {str(e)}"}), 500 


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    logger.info(f"Starting curl_cffi scraper service on port {port}")
    logger.info(f"Endpoints available: /health, /scrape")
    app.run(host='0.0.0.0', port=port, debug=False)
