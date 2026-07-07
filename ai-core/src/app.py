"""
BAUIMPERIUM - AI Core Microservice
Computer Vision, NLP, Matching Engine & Automation
"""

import os
import json
import logging
import time
from datetime import datetime
from typing import Optional, List, Dict, Any

import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# ============================================================
# MOCK AI MODELS (In production, load actual ML models)
# ============================================================

class MockNLPModel:
    """Mock NLP model for project analysis & offer generation.
    In production, use OpenAI API, Llama 3, or fine-tuned BERT models."""

    def analyze_project(self, text: str, images: Optional[List[str]] = None) -> Dict[str, Any]:
        """Analyze project description and extract specifications."""
        logger.info(f"Analyzing project: {text[:50]}...")

        # Simulate DIN norm matching
        din_norms = []
        keywords = {
            'bad': ['DIN 18352', 'DIN 18157'],
            'dach': ['DIN 18338', 'DIN 18421'],
            'fliesen': ['DIN 18352', 'DIN 18157'],
            'elektro': ['DIN VDE 0100', 'DIN 18015'],
            'heizung': ['DIN 18380', 'DIN 4751'],
            'fassade': ['DIN 18516', 'DIN V 18599'],
            'boden': ['DIN 18353', 'DIN 18202'],
        }

        text_lower = text.lower()
        for keyword, norms in keywords.items():
            if keyword in text_lower:
                din_norms.extend(norms)

        # Estimate area (simple heuristic)
        import re
        area_match = re.search(r'(\d+)\s*(?:m²|qm|quadratmeter)', text_lower)
        estimated_area = float(area_match.group(1)) if area_match else 25.0

        # Estimate costs based on project type
        cost_multipliers = {
            'bad': 1200,
            'dach': 800,
            'fliesen': 200,
            'maler': 60,
            'elektro': 150,
            'heizung': 500,
        }

        base_cost_per_sqm = 300
        for keyword, multiplier in cost_multipliers.items():
            if keyword in text_lower:
                base_cost_per_sqm = multiplier
                break

        estimated_min = estimated_area * base_cost_per_sqm * 0.7
        estimated_max = estimated_area * base_cost_per_sqm * 1.3

        return {
            'confidence': 0.87,
            'specifications': [
                {'key': 'area_sqm', 'value': estimated_area, 'unit': 'm²', 'confidence': 0.85},
                {'key': 'project_type', 'value': self._detect_project_type(text), 'confidence': 0.8},
                {'key': 'complexity', 'value': 'medium', 'confidence': 0.7},
            ],
            'estimatedCosts': {
                'min': round(estimated_min, 2),
                'max': round(estimated_max, 2),
                'currency': 'EUR',
                'confidence': 0.75,
            },
            'estimatedDuration': {
                'min': max(3, int(estimated_area / 10)),
                'max': max(7, int(estimated_area / 5)),
                'unit': 'days',
            },
            'dinNorms': list(set(din_norms)) if din_norms else ['DIN 18299'],
            'requiredMaterials': self._estimate_materials(text, estimated_area),
            'processingTime': int(time.time() * 1000),
        }

    def generate_offer(self, project_data: Dict, craftsman_rate: Optional[float] = None) -> Dict[str, Any]:
        """Generate a professional offer based on project analysis."""
        logger.info(f"Generating offer for project: {project_data.get('title', 'Unknown')[:50]}")

        specifications = project_data.get('specifications', [])
        estimated_costs = project_data.get('estimatedCosts', {})
        area = next((s['value'] for s in specifications if s['key'] == 'area_sqm'), 25)

        rate = craftsman_rate or 85  # Default hourly rate
        estimated_hours = area * 2.5  # Rough estimate

        labor_cost = rate * estimated_hours
        material_cost = (estimated_costs.get('max', 15000) or 15000) * 0.4
        disposal_cost = area * 15
        travel_cost = 150
        total_net = labor_cost + material_cost + disposal_cost + travel_cost

        return {
            'totalAmount': round(total_net * 1.19, 2),
            'items': [
                {'description': 'Arbeitsleistung (geschätzt)', 'quantity': estimated_hours, 'unit': 'h', 'unitPrice': rate, 'totalPrice': round(labor_cost, 2)},
                {'description': 'Materialkosten inkl. Nebenkosten', 'quantity': 1, 'unit': 'pauschal', 'unitPrice': round(material_cost, 2), 'totalPrice': round(material_cost, 2)},
                {'description': 'Entsorgung & Container', 'quantity': 1, 'unit': 'pauschal', 'unitPrice': round(disposal_cost, 2), 'totalPrice': round(disposal_cost, 2)},
                {'description': 'An- & Abfahrt', 'quantity': 1, 'unit': 'pauschal', 'unitPrice': round(travel_cost, 2), 'totalPrice': round(travel_cost, 2)},
            ],
            'confidence': 0.72,
            'validityDays': 30,
            'warrantyMonths': 60,
        }

    def _detect_project_type(self, text: str) -> str:
        text_lower = text.lower()
        if any(w in text_lower for w in ['bad', 'badezimmer', 'dusche', 'wc', 'sanitär']):
            return 'bathroom_renovation'
        elif any(w in text_lower for w in ['dach', 'dachdeck', 'dachstuhl']):
            return 'roofing'
        elif any(w in text_lower for w in ['fliesen', 'boden', 'parkett', 'laminat']):
            return 'flooring'
        elif any(w in text_lower for w in ['maler', 'streichen', 'tapezieren']):
            return 'painting'
        else:
            return 'general_construction'

    def _estimate_materials(self, text: str, area: float) -> List[Dict]:
        """Estimate required materials based on project type."""
        project_type = self._detect_project_type(text)
        materials_map = {
            'bathroom_renovation': [
                {'name': 'Fliesen', 'estimatedQuantity': str(area * 1.1), 'unit': 'm²'},
                {'name': 'Fliesenkleber', 'estimatedQuantity': str(round(area * 3)), 'unit': 'kg'},
                {'name': 'Silikon', 'estimatedQuantity': '5', 'unit': 'Stk'},
            ],
            'flooring': [
                {'name': 'Bodenbelag', 'estimatedQuantity': str(area * 1.05), 'unit': 'm²'},
                {'name': 'Trittschalldämmung', 'estimatedQuantity': str(area), 'unit': 'm²'},
                {'name': 'Sockelleisten', 'estimatedQuantity': str(round(np.sqrt(area) * 4)), 'unit': 'm'},
            ],
            'painting': [
                {'name': 'Farbe (weiß)', 'estimatedQuantity': str(max(2, round(area / 15))), 'unit': 'Eimer'},
                {'name': 'Malervlies', 'estimatedQuantity': str(area), 'unit': 'm²'},
                {'name': 'Abdeckband', 'estimatedQuantity': '5', 'unit': 'Rollen'},
            ],
            'roofing': [
                {'name': 'Dachziegel', 'estimatedQuantity': str(round(area * 10)), 'unit': 'Stk'},
                {'name': 'Dämmung', 'estimatedQuantity': str(area), 'unit': 'm²'},
                {'name': 'Unterspannbahn', 'estimatedQuantity': str(area), 'unit': 'm²'},
            ],
        }
        return materials_map.get(project_type, [
            {'name': 'Baumaterial (allgemein)', 'estimatedQuantity': '1', 'unit': 'pauschal'},
        ])


class MockVisionModel:
    """Mock computer vision model for construction verification"""

    def verify_construction(self, video_url: str, cad_specs: Optional[Dict] = None) -> Dict[str, Any]:
        """Verify construction work against CAD specifications using 3D video analysis."""
        logger.info(f"Verifying construction from video: {video_url[:50]}...")

        # Simulate analysis
        processing_time = np.random.uniform(1.5, 4.0)

        # Simulate pass/fail with high pass rate
        passed = np.random.random() > 0.15

        return {
            'passed': passed,
            'confidence': round(np.random.uniform(0.85, 0.99), 2) if passed else round(np.random.uniform(0.4, 0.7), 2),
            'processingTime': round(processing_time, 2),
            'measurements': {
                'overall_quality': 'good' if passed else 'needs_improvement',
                'deviation_mm': round(np.random.uniform(0, 3), 1) if passed else round(np.random.uniform(5, 20), 1),
                'surface_flatness': 'within_tolerance' if passed else 'out_of_tolerance',
            },
            'deviations': [] if passed else [
                {'type': 'measurement_deviation', 'description': 'Toleranzüberschreitung an Position X', 'severity': 'medium'},
            ],
            'recommendations': [] if passed else [
                'Kantenüberprüfung und Nachbesserung empfohlen',
            ],
            'cadMatch': True if passed else False,
        }


class MockMatchingEngine:
    """Smart matching algorithm for pairing projects with craftsmen"""

    def match_craftsmen(self, project: Dict, craftsmen: List[Dict]) -> List[Dict[str, Any]]:
        """Match a project with the most suitable craftsmen using multi-factor scoring."""
        logger.info(f"Matching project with {len(craftsmen)} potential craftsmen")

        scored_craftsmen = []
        for craftsman in craftsmen:
            score = 0.0
            reasons = []

            # Category match (highest weight)
            if project.get('category_id') in [c['category_id'] for c in craftsman.get('categories', [])]:
                score += 40
                reasons.append('Gewerk-Match')

            # Location proximity
            if craftsman.get('distance_km') is not None:
                if craftsman['distance_km'] <= 10:
                    score += 30
                    reasons.append('Sehr nah (< 10km)')
                elif craftsman['distance_km'] <= 25:
                    score += 20
                    reasons.append('Nah (10-25km)')
                elif craftsman['distance_km'] <= 50:
                    score += 10
                    reasons.append('Im Einzugsgebiet (25-50km)')

            # Rating score
            avg_rating = craftsman.get('average_rating', 0)
            score += avg_rating * 5
            if avg_rating >= 4.5:
                reasons.append('Top-Bewertung')

            # Premium status bonus
            if craftsman.get('is_premium'):
                score += 15
                reasons.append('Premium-Mitglied')

            # Verification bonus
            if craftsman.get('is_verified'):
                score += 10
                reasons.append('Verifiziert')

            # Credit rating bonus
            credit_rating = craftsman.get('credit_rating', 700)
            if credit_rating >= 800:
                score += 10
                reasons.append('Hervorragende Bonität')
            elif credit_rating >= 600:
                score += 5
                reasons.append('Gute Bonität')

            # Capacity check
            active_projects = craftsman.get('active_projects', 0)
            max_projects = craftsman.get('max_projects', 5)
            if active_projects < max_projects:
                capacity_score = ((max_projects - active_projects) / max_projects) * 10
                score += capacity_score
                reasons.append('Freie Kapazitäten')

            completed_projects = craftsman.get('completed_projects', 0)
            if completed_projects > 10:
                score += 5
                reasons.append('Langjährige Erfahrung')

            scored_craftsmen.append({
                'craftsman_id': craftsman['id'],
                'company_name': craftsman.get('company_name', ''),
                'total_score': round(score, 1),
                'reasons': reasons,
                'suggested': score >= 70,
                'estimated_price_range': self._estimate_price(project, craftsman),
            })

        # Sort by score descending
        scored_craftsmen.sort(key=lambda x: x['total_score'], reverse=True)

        return scored_craftsmen[:10]  # Top 10

    def _estimate_price(self, project: Dict, craftsman: Dict) -> Dict:
        """Estimate price range for this craftsman-project combination."""
        rate = craftsman.get('rate_per_hour', 85)
        estimated_hours = project.get('estimated_hours', 40)
        base = rate * estimated_hours

        return {
            'min': round(base * 0.9, 2),
            'max': round(base * 1.3, 2),
            'currency': 'EUR',
        }


# Initialize models
nlp_model = MockNLPModel()
vision_model = MockVisionModel()
matching_engine = MockMatchingEngine()


# ============================================================
# API ROUTES
# ============================================================

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'service': 'bauimperium-ai-core',
        'version': '1.0.0',
        'timestamp': datetime.utcnow().isoformat(),
        'models_loaded': True,
    })


@app.route('/api/v1/analyze/project', methods=['POST'])
def analyze_project():
    """Analyze a project description using NLP + optional image analysis."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        text = data.get('text', '')
        images = data.get('mediaUrls', [])
        project_id = data.get('projectId')

        if not text and not images:
            return jsonify({'error': 'No input provided (text or images required)'}), 400

        result = nlp_model.analyze_project(text, images)

        logger.info(f"Project analysis complete: {project_id or 'unknown'}")
        return jsonify(result)

    except Exception as e:
        logger.error(f"Analysis error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/v1/generate/offer', methods=['POST'])
def generate_offer():
    """Generate a professional offer based on project analysis."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        project = data.get('project', data)
        craftsman_rate = data.get('craftsmanRate')

        result = nlp_model.generate_offer(project, craftsman_rate)

        logger.info(f"Offer generated for project: {project.get('title', 'unknown')[:50]}")
        return jsonify(result)

    except Exception as e:
        logger.error(f"Offer generation error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/v1/verify/construction', methods=['POST'])
def verify_construction():
    """Verify construction work using computer vision on 3D video."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        video_url = data.get('videoUrl', '')
        cad_specs = data.get('cadSpecs')

        if not video_url:
            return jsonify({'error': 'No video URL provided'}), 400

        result = vision_model.verify_construction(video_url, cad_specs)

        logger.info(f"Construction verification: {'PASSED' if result['passed'] else 'FAILED'}")
        return jsonify(result)

    except Exception as e:
        logger.error(f"Verification error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/v1/match/craftsmen', methods=['POST'])
def match_craftsmen():
    """Match a project with the best fitting craftsmen."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        project = data.get('project', {})
        craftsmen = data.get('craftsmen', [])

        if not craftsmen:
            return jsonify({'error': 'No craftsmen provided'}), 400

        result = matching_engine.match_craftsmen(project, craftsmen)

        logger.info(f"Matching complete: {len(result)} candidates ranked")
        return jsonify({
            'matches': result,
            'total_candidates': len(result),
            'suggested_count': sum(1 for m in result if m['suggested']),
        })

    except Exception as e:
        logger.error(f"Matching error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/v1/transcribe', methods=['POST'])
def transcribe_voice():
    """Transcribe voice input and extract structured data."""
    try:
        data = request.get_json()
        text = data.get('text', data.get('transcribedText', ''))

        if not text:
            return jsonify({'error': 'No text provided'}), 400

        # Simple NLP parsing (in production: use Whisper + LLM)
        import re

        # Extract entities
        numbers = re.findall(r'\d+', text)
        euros = re.findall(r'(\d+(?:[.,]\d+)?)\s*(?:€|Euro|euro)', text)

        result = {
            'transcribedText': text,
            'structuredData': {
                'project_title': text.split('.')[0] if '.' in text else text[:50],
                'extracted_numbers': numbers,
                'extracted_prices': euros,
                'entities': {
                    'has_area': 'm²' in text.lower() or 'qm' in text.lower(),
                    'has_material': any(m in text.lower() for m in ['fliesen', 'farbe', 'holz', 'beton', 'ziegel']),
                    'has_urgency': any(u in text.lower() for u in ['eil', 'schnell', 'sofort', 'dringend']),
                },
            },
            'confidence': 0.85,
        }

        return jsonify(result)

    except Exception as e:
        logger.error(f"Transcription error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/v1/parse/invoice', methods=['POST'])
def parse_invoice():
    """Parse voice/text input into invoice items."""
    try:
        data = request.get_json()
        text = data.get('text', '')

        if not text:
            return jsonify({'error': 'No text provided'}), 400

        # Parse into line items
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        items = []

        for line in lines:
            # Try to extract quantity and price
            import re
            qty_match = re.search(r'(\d+)[xX*]', line)
            price_match = re.search(r'(\d+(?:[.,]\d+)?)\s*(?:€|Euro)', line)

            items.append({
                'description': line,
                'quantity': float(qty_match.group(1)) if qty_match else 1.0,
                'unit': 'Stk',
                'unitPrice': float(price_match.group(1).replace(',', '.')) if price_match else 0.0,
            })

        return jsonify({'items': items})

    except Exception as e:
        logger.error(f"Invoice parsing error: {str(e)}")
        return jsonify({'error': str(e)}), 500


# ============================================================
# BACKGROUND TASKS (in production: use Celery)
# ============================================================

@app.route('/api/v1/task/status/<task_id>', methods=['GET'])
def task_status(task_id: str):
    """Check status of async AI tasks."""
    # Simplified: in production, query Celery/Redis
    return jsonify({
        'task_id': task_id,
        'status': 'completed',
        'progress': 100,
    })


@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def server_error(e):
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
