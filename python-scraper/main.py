"""
Python Scraper Service using curl_cffi
This service bypasses anti-bot detection using TLS/JA3 fingerprint spoofing

Installation:
    pip install curl_cffi flask gunicorn

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
# from similarity import detect_erp_transformation_signals, classify_transformation_stage

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



@app.route("/api/v1/detect-signals", methods=["POST"])
def detect_signals():
    return jsonify({}), 200
    """
    Detect ERP transformation signals in provided text.
    Endpoint: POST /api/v1/detect-signals
    Request:
        Content-Type: application/json
        Body:
            {
                "text": <str, required> - The text to analyze (minimum 50 characters),
                "source": <str, optional> - Source identifier (default: "unknown")
            }
    Response (200 OK):
        JSON object with:
            - signals_found: int
            - confidence_score_avg: float
            - top_signals: list of dicts
            - has_erp_context: bool
            - source: str
            - transformation_stage: dict {
                  stage: int,
                  stage_name: str,
                  confidence: float,
                  estimated_months_to_go_live: str,
                  evidence: list
              }
    Error Responses:
        400 Bad Request: If "text" is missing or too short.
            { "error": "Text too short or missing" }
        500 Internal Server Error: For unexpected errors.
            { "error": "<error message>" }
    Returns:
        JSON response as described above.
    """
    # try:
    #     data = request.get_json(force=True)
    #     text = data.get("text", "").strip()
    #     source = data.get("source", "unknown")

    #     if not text or len(text) < 50:
    #         return jsonify({"error": "Text too short or missing"}), 400
    #     if len(text) > 100_000:  # 100KB limit
    #         return jsonify({"error": "Text too long (max 100,000 characters)"}), 400

    #     # 1. Detect raw signals
    #     signals = detect_erp_transformation_signals(text)

    #     # 2. Classify stage
    #     stage_info = classify_transformation_stage(signals, text)

    #     if not signals:
    #         return jsonify({
    #             "signals_found": 0,
    #             "confidence_score_avg": 0.0,
    #             "top_signals": [],
    #             "has_erp_context": False,
    #             "stage": 0,
    #             "stage_name": "No Activity",
    #             "estimated_months_to_go_live": "N/A",
    #             "message": "No ERP/HCM/PLM transformation signals detected"
    #         })

    #     avg_confidence = sum(s["confidence"] for s in signals) / len(signals)

    #     response = {
    #         "signals_found": len(signals),
    #         "confidence_score_avg": round(avg_confidence, 1),
    #         "top_signals": signals[:10],  # Top 10 only
    #         "has_erp_context": True,
    #         "source": source,

    #         # ← NEW: Stage intelligence (this is the money printer)
    #         "transformation_stage": {
    #             "stage": stage_info["stage"],
    #             "stage_name": stage_info["stage_name"],
    #             "confidence": stage_info["confidence"],
    #             "estimated_months_to_go_live": stage_info["estimated_months_to_go_live"],
    #             "evidence": stage_info["evidence"]
    #         }
    #     }

    #     return jsonify(response), 200

    # except Exception as e:
    #     return jsonify({"error": str(e)}), 500 


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    logger.info(f"Starting curl_cffi scraper service on port {port}")
    logger.info(f"Endpoints available: /health, /scrape")
    app.run(host='0.0.0.0', port=port, debug=False)
