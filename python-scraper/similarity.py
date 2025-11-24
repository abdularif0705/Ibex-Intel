"""
Enhanced ERP Transformation Signal Detection using TF-IDF + Scikit-Learn
Lightweight NLP solution optimized for <512MB memory footprint
"""

# For the PyTorch/SentenceTransformer variant, see similarity_vector.py.

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from typing import List, Dict, Tuple
import re
from collections import defaultdict

# =============================================
# EXTENSIVE CONTEXT-AWARE SIGNAL LIBRARY (2025)
# =============================================
CONTEXT_KEYWORDS = {
    # Core systems
    "erp", "hcm", "plm", "crm", "scm", "eim", "etl", "edw", "bi", "bw/4", "bpc",
    "s/4hana", "s4hana", "s4/hana", "ecc", "r/3", "rise with sap",
    "workday", "workday financials", "workday hcm", "workday scm",
    "oracle cloud", "oracle fusion", "oracle ebs", "oracle erp cloud", "fusion financials",
    "netsuite", "infor", "dynamics 365", "d365", "ax", "peoplesoft", "successfactors",
    "salesforce", "servicenow", "anaplan", "coupa", "concur", "kyriba", "blackline",
    "sap", "oracle", "microsoft dynamics",
    
    # Processes & patterns
    "data migration", "system implementation", "system integration", "core template",
    "cloud migration", "infrastructure modernization", "lift and shift", "replatforming",
    "r2r", "record to report", "o2c", "order to cash", "p2p", "procure to pay",
    "fpa", "financial planning", "eib", "fdm", "picu", "prism", "calc manager",
    "transformation", "digital transformation", "implementation", "migration"
}

# =============================================
# SIGNAL PHRASES WITH WEIGHTED IMPORTANCE
# Weights represent: (base_confidence, stage_indicator, urgency_multiplier)
# =============================================
SIGNAL_LIBRARY = {
    # ── PHASE INDICATORS (95–100 = go-live imminent) ───────────────────────
    "cutover": (96, 5, 1.0),
    "cutover weekend": (99, 5, 1.2),
    "cutover manager": (98, 5, 1.1),
    "cutover lead": (98, 5, 1.1),
    "cutover coordinator": (97, 5, 1.0),
    "production cutover": (98, 5, 1.1),
    "final cutover": (99, 5, 1.2),
    "go-live": (94, 5, 1.0),
    "go live": (94, 5, 1.0),
    "go-live date": (97, 5, 1.1),
    "go-live weekend": (98, 5, 1.2),
    "go-live support": (93, 5, 0.9),
    "post go-live": (90, 5, 0.8),
    "post-go-live": (90, 5, 0.8),
    "hypercare": (92, 5, 1.0),
    "hyper-care": (92, 5, 1.0),
    "hyper care": (92, 5, 1.0),
    "dress rehearsal": (90, 4, 1.0),
    "mock cutover": (91, 4, 1.0),
    "mock go-live": (91, 4, 1.0),
    "dry run": (88, 4, 0.9),
    "parallel run": (89, 4, 0.9),
    "parallel payroll": (90, 4, 1.0),
    
    # ── TESTING & VALIDATION (70–85) ───────────────────────────────────────
    "uat": (78, 4, 0.9),
    "user acceptance testing": (79, 4, 0.9),
    "sit testing": (75, 3, 0.8),
    "system integration testing": (76, 3, 0.8),
    "end-to-end testing": (77, 4, 0.9),
    "e2e testing": (77, 4, 0.9),
    "regression testing": (75, 3, 0.8),
    "regression testing lead": (80, 4, 0.9),
    "uat lead": (82, 4, 1.0),
    "test lead": (75, 3, 0.8),
    "testing coordinator": (74, 3, 0.8),
    
    # ── DATA MIGRATION RED FLAGS (80–90) ───────────────────────────────────
    "data migration": (82, 3, 1.0),
    "data migration lead": (88, 4, 1.1),
    "data conversion": (83, 3, 1.0),
    "legacy data migration": (87, 4, 1.1),
    "master data lead": (86, 3, 1.0),
    "mdm lead": (85, 3, 1.0),
    "data cleansing": (80, 3, 0.9),
    "data archiving": (78, 3, 0.8),
    "data validation": (79, 3, 0.9),
    "etl development": (81, 3, 0.9),
    
    # ── IMPLEMENTATION ROLES (85–95) ───────────────────────────────────────
    "transformation director": (94, 4, 1.1),
    "transformation lead": (92, 4, 1.0),
    "program director": (95, 4, 1.1),
    "transformation architect": (93, 4, 1.0),
    "solution architect": (88, 3, 0.9),
    "principal consultant": (87, 3, 0.9),
    "implementation manager": (90, 4, 1.0),
    "delivery executive": (89, 4, 0.9),
    "change enablement lead": (85, 3, 0.9),
    "ocm lead": (88, 3, 0.9),
    "organizational change management": (87, 3, 0.9),
    "change management lead": (86, 3, 0.9),
    "deployment manager": (89, 4, 1.0),
    
    # ── VENDOR + HIGH-RISK MODULES (90–98) ─────────────────────────────────
    "workday financials": (97, 4, 1.1),
    "workday scm": (95, 4, 1.0),
    "workday adaptive": (92, 3, 0.9),
    "r2r": (93, 4, 1.0),
    "record to report": (93, 4, 1.0),
    "o2c": (91, 4, 1.0),
    "order to cash": (91, 4, 1.0),
    "p2p": (90, 4, 0.9),
    "procure to pay": (90, 4, 0.9),
    "revenue accounting": (94, 4, 1.0),
    "oracle fusion financials": (94, 4, 1.1),
    "oracle revenue management": (95, 4, 1.0),
    "netsuite oneworld": (89, 3, 0.9),
    "s/4hana finance": (92, 4, 1.0),
    "central finance": (93, 4, 1.0),
    "group reporting": (90, 4, 0.9),
    "sac planning": (88, 3, 0.9),
    "hcm implementation": (91, 4, 1.0),
    "finance transformation": (92, 4, 1.0),
    
    # ── CONTRACT & URGENCY (75–90) ─────────────────────────────────────────
    "6 month contract": (85, 4, 1.2),
    "6-12 month contract": (87, 4, 1.2),
    "12 month contract": (82, 3, 1.0),
    "18 month contract": (84, 3, 0.9),
    "immediate start": (86, 4, 1.3),
    "urgent hire": (88, 4, 1.3),
    "asap start": (87, 4, 1.3),
    "start asap": (86, 4, 1.3),
    "contract-to-hire": (80, 3, 1.0),
    "urgent requirement": (85, 4, 1.2),
    
    # ── INFRASTRUCTURE & CLOUD MIGRATION (80–90) ───────────────────────────
    "rise with sap": (94, 4, 1.0),
    "sap on azure": (88, 3, 0.9),
    "sap on aws": (88, 3, 0.9),
    "hana enterprise cloud": (87, 3, 0.9),
    "ecc to s/4hana": (93, 4, 1.1),
    "brownfield": (85, 3, 0.9),
    "greenfield": (84, 3, 0.9),
    "bluefield": (86, 3, 0.9),
    "selective data transition": (87, 4, 1.0),
    "system conversion": (86, 4, 1.0),
    
    # ── INTEGRATION & BOLT-ONS (75–88) ─────────────────────────────────────
    "eib": (80, 3, 0.8),
    "enterprise interface builder": (82, 3, 0.9),
    "picu": (80, 3, 0.8),
    "peoplesoft integration": (83, 3, 0.9),
    "core connector": (81, 3, 0.8),
    "studio integration": (84, 3, 0.9),
    "boomi": (80, 3, 0.8),
    "mulesoft": (80, 3, 0.8),
    "dell boomi": (80, 3, 0.8),
    "fieldglass": (80, 3, 0.8),
    "concur integration": (82, 3, 0.9),
    "ariba integration": (83, 3, 0.9),
    "integration architect": (85, 3, 0.9),
    
    # ── STABILIZATION & POST-LIVE (88–94) ──────────────────────────────────
    "stabilization lead": (92, 5, 1.0),
    "post-implementation support": (89, 5, 0.9),
    "center of excellence": (85, 4, 0.8),
    "coe lead": (87, 4, 0.9),
    "run team": (84, 4, 0.8),
    "production support": (86, 4, 0.9),
    
    # ── RARE BUT NUCLEAR SIGNALS (98–100) ──────────────────────────────────
    "war room": (99, 5, 1.2),
    "command center": (99, 5, 1.2),
    "cutover command center": (100, 5, 1.3),
    "rollback plan": (98, 5, 1.1),
    "contingency planning": (96, 5, 1.0),
    "go-live readiness": (97, 5, 1.1),
    
    # ── DESIGN & PLANNING (60–75) ──────────────────────────────────────────
    "blueprint": (70, 2, 0.7),
    "fit-gap": (72, 2, 0.7),
    "fit gap analysis": (72, 2, 0.7),
    "requirements gathering": (68, 2, 0.6),
    "process design": (70, 2, 0.7),
    "rfp": (65, 1, 0.6),
    "vendor selection": (67, 2, 0.6),
    "business case": (63, 1, 0.6),
    "feasibility study": (64, 1, 0.6),
    "target operating model": (66, 2, 0.7),
    "transformation roadmap": (65, 1, 0.6),
    
    # ── BUILD PHASE (70–85) ────────────────────────────────────────────────
    "configuration": (75, 3, 0.8),
    "system configuration": (76, 3, 0.8),
    "prototype": (72, 3, 0.7),
    "development": (70, 3, 0.7),
    "configuration lead": (78, 3, 0.9),
    "functional consultant": (74, 3, 0.8),
    "technical consultant": (75, 3, 0.8),
}


class SignalDetector:
    """
    Enhanced signal detection using TF-IDF vectorization and cosine similarity
    with calibrated confidence scoring
    """
    
    def __init__(self):
        # Create corpus from signal library
        self.signal_phrases = list(SIGNAL_LIBRARY.keys())
        self.signal_metadata = SIGNAL_LIBRARY
        
        # Initialize TF-IDF vectorizer with optimized parameters
        self.vectorizer = TfidfVectorizer(
            lowercase=True,
            ngram_range=(1, 4),  # Capture 1-4 word phrases
            max_features=1000,   # Limit vocabulary size
            min_df=1,
            strip_accents='unicode',
            token_pattern=r'(?u)\b[\w/\-]+\b'  # Handle special chars like S/4HANA
        )
        
        # Fit vectorizer on signal phrases
        self.signal_vectors = self.vectorizer.fit_transform(self.signal_phrases)
        
    def chunk_text(self, text: str, chunk_size: int = 150, overlap: int = 30) -> List[str]:
        """Split text into overlapping chunks for better context preservation"""
        words = text.split()
        chunks = []
        i = 0
        while i < len(words):
            chunk_words = words[i:i + chunk_size]
            chunk = " ".join(chunk_words)
            chunks.append(chunk)
            if len(chunk_words) < chunk_size:
                break
            i += chunk_size - overlap
        return chunks if chunks else [text]
    
    def detect_signals(
        self,
        text: str,
        similarity_threshold: float = 0.35,
        min_context_keywords: int = 1
    ) -> List[Dict]:
        """
        Detect transformation signals with improved confidence scoring
        
        Returns:
            List of signal dictionaries with calibrated confidence scores
        """
        text_lower = text.lower()
        
        # Context validation - require ERP/transformation keywords
        context_count = sum(1 for kw in CONTEXT_KEYWORDS if kw in text_lower)
        if context_count < min_context_keywords:
            return []  # No relevant context
        
        # Chunk text for better processing
        chunks = self.chunk_text(text_lower)
        all_matches = []
        
        for chunk_idx, chunk in enumerate(chunks):
            # Vectorize chunk
            chunk_vector = self.vectorizer.transform([chunk])
            
            # Calculate cosine similarities
            similarities = cosine_similarity(chunk_vector, self.signal_vectors).flatten()
            
            # Process matches
            for idx, similarity in enumerate(similarities):
                if similarity > similarity_threshold:
                    signal = self.signal_phrases[idx]
                    base_conf, stage, urgency = self.signal_metadata[signal]
                    
                    # Check for exact match
                    is_exact = signal in chunk
                    
                    # Calculate calibrated confidence
                    if is_exact:
                        # Exact match gets full base confidence
                        confidence = base_conf
                        match_type = "exact"
                    else:
                        # Semantic match gets scaled confidence
                        # Use sigmoid-like scaling for smoother scores
                        semantic_boost = self._calculate_semantic_boost(similarity)
                        confidence = min(95, int(base_conf * 0.7 + semantic_boost * 30))
                        match_type = "semantic"
                    
                    # Apply urgency multiplier
                    confidence = min(100, int(confidence * urgency))
                    
                    # Context boosting - more context = higher confidence
                    context_boost = min(5, context_count)
                    confidence = min(100, confidence + context_boost)
                    
                    all_matches.append({
                        "signal": signal,
                        "confidence": confidence,
                        "type": match_type,
                        "similarity": round(float(similarity), 3),
                        "evidence": signal.title(),
                        "stage": stage,
                        "context_keywords_found": context_count,
                        "chunk_index": chunk_idx
                    })
        
        # Deduplicate and sort by confidence
        seen = {}
        for match in all_matches:
            key = match["signal"]
            if key not in seen or match["confidence"] > seen[key]["confidence"]:
                seen[key] = match
        
        final = sorted(seen.values(), key=lambda x: x["confidence"], reverse=True)
        return final[:15]  # Top 15 signals
    
    def _calculate_semantic_boost(self, similarity: float) -> float:
        """
        Calculate semantic similarity boost using sigmoid scaling
        Maps 0.35-1.0 similarity to 0-1 boost smoothly
        """
        # Normalize to 0-1 range
        normalized = (similarity - 0.35) / 0.65
        # Apply sigmoid for smooth curve
        sigmoid = 1 / (1 + np.exp(-10 * (normalized - 0.5)))
        return sigmoid


class StageClassifier:
    """
    Classify transformation stage with statistical confidence
    """
    
    # Stage definitions with score ranges
    STAGES = {
        0: {"name": "No Activity", "range": (0, 30), "months": "N/A"},
        1: {"name": "Early Planning / RFP", "range": (30, 55), "months": ">18"},
        2: {"name": "Vendor Selection & Design", "range": (55, 75), "months": "12-18"},
        3: {"name": "Build & Testing", "range": (75, 90), "months": "6-12"},
        4: {"name": "Late Stage (UAT/Cutover Prep)", "range": (90, 98), "months": "1-6"},
        5: {"name": "Go-Live / Hypercare", "range": (98, 101), "months": "0-3 (NOW)"}
    }
    
    def classify(self, signals: List[Dict], text: str) -> Dict:
        """
        Classify transformation stage using multi-factor analysis
        """
        if not signals:
            return self._no_activity_response()
        
        text_lower = text.lower()
        
        # Calculate base score from signals
        stage_scores = defaultdict(int)
        max_signal_conf = 0
        
        for signal in signals:
            stage = signal.get("stage", 0)
            confidence = signal.get("confidence", 0)
            stage_scores[stage] += confidence
            max_signal_conf = max(max_signal_conf, confidence)
        
        # Find dominant stage
        if stage_scores:
            dominant_stage = max(stage_scores.items(), key=lambda x: x[1])[0]
            stage_score = stage_scores[dominant_stage] / len(signals)
        else:
            dominant_stage = 0
            stage_score = 0
        
        # Nuclear signals override everything
        nuclear_signals = ["war room", "command center", "cutover weekend", "go-live weekend"]
        if any(ns in text_lower for ns in nuclear_signals):
            return self._build_response(5, 100, ["Nuclear go-live signal detected"])
        
        # Build evidence list
        evidence = self._gather_evidence(signals, text_lower, dominant_stage)
        
        # Calculate final confidence
        confidence = self._calculate_confidence(
            signals, stage_score, max_signal_conf, dominant_stage, text_lower
        )
        
        # Determine final stage
        final_stage = self._determine_stage(confidence, dominant_stage, signals)
        
        return self._build_response(final_stage, confidence, evidence)
    
    def _gather_evidence(self, signals: List[Dict], text: str, stage: int) -> List[str]:
        """Gather evidence for stage classification"""
        evidence = []
        
        # Top signals
        top_signals = [s for s in signals if s.get("confidence", 0) >= 85]
        if top_signals:
            evidence.append(f"{len(top_signals)} high-confidence signals detected")
        
        # Stage-specific evidence
        stage_keywords = {
            1: ["rfp", "feasibility", "business case", "roadmap"],
            2: ["blueprint", "fit-gap", "vendor selection", "design"],
            3: ["configuration", "development", "integration", "testing"],
            4: ["uat", "dress rehearsal", "parallel run", "cutover prep"],
            5: ["go-live", "cutover", "hypercare", "production"]
        }
        
        if stage in stage_keywords:
            found = [kw for kw in stage_keywords[stage] if kw in text]
            if found:
                evidence.append(f"Stage {stage} keywords: {', '.join(found[:3])}")
        
        # Urgency indicators
        urgency = ["urgent", "immediate", "asap", "6 month"]
        if any(u in text for u in urgency):
            evidence.append("Urgent timeline indicated")
        
        return evidence[:5]  # Top 5 pieces of evidence
    
    def _calculate_confidence(
        self, signals: List[Dict], stage_score: float,
        max_conf: int, stage: int, text: str
    ) -> int:
        """Calculate calibrated confidence score"""
        # Base confidence from average signal confidence
        avg_conf = sum(s.get("confidence", 0) for s in signals) / len(signals)
        
        # Weight factors
        signal_count_factor = min(1.0, len(signals) / 10)  # More signals = higher confidence
        max_conf_factor = max_conf / 100  # Highest signal confidence
        stage_consistency = stage_score / 100  # How consistent is the stage
        
        # Weighted combination
        confidence = (
            avg_conf * 0.4 +
            max_conf * 0.3 +
            stage_score * 0.2 +
            signal_count_factor * 10
        )
        
        # Ensure confidence aligns with stage
        stage_range = self.STAGES[stage]["range"]
        confidence = max(stage_range[0], min(stage_range[1] - 1, confidence))
        
        return int(confidence)
    
    def _determine_stage(self, confidence: int, dominant_stage: int, signals: List[Dict]) -> int:
        """Determine final stage based on confidence and signals"""
        # Check each stage's confidence range
        for stage, info in self.STAGES.items():
            min_conf, max_conf = info["range"]
            if min_conf <= confidence < max_conf:
                return stage
        
        # Fallback to dominant stage from signals
        return dominant_stage
    
    def _build_response(self, stage: int, confidence: int, evidence: List[str]) -> Dict:
        """Build structured stage response"""
        stage_info = self.STAGES[stage]
        return {
            "stage": stage,
            "stage_name": stage_info["name"],
            "confidence": confidence,
            "evidence": evidence,
            "estimated_months_to_go_live": stage_info["months"]
        }
    
    def _no_activity_response(self) -> Dict:
        """Return response for no activity detected"""
        return {
            "stage": 0,
            "stage_name": "No Activity",
            "confidence": 0,
            "evidence": [],
            "estimated_months_to_go_live": "N/A"
        }


# =============================================
# GLOBAL INSTANCES (initialized once)
# =============================================
detector = SignalDetector()
classifier = StageClassifier()


# =============================================
# PUBLIC API
# =============================================
def detect_erp_transformation_signals(
    text: str,
    similarity_threshold: float = 0.35,
    min_context_keywords: int = 1
) -> List[Dict]:
    """
    Detect ERP/HCM/PLM transformation signals in text
    
    Args:
        text: Input text to analyze
        similarity_threshold: Minimum cosine similarity (0.0-1.0)
        min_context_keywords: Minimum ERP context keywords required
    
    Returns:
        List of detected signals with confidence scores
    """
    return detector.detect_signals(text, similarity_threshold, min_context_keywords)


def classify_transformation_stage(signals: List[Dict], text: str) -> Dict:
    """
    Classify transformation stage based on detected signals
    
    Args:
        signals: List of detected signals from detect_erp_transformation_signals
        text: Original text for additional context
    
    Returns:
        Dictionary with stage, confidence, evidence, and timeline
    """
    return classifier.classify(signals, text)


# =============================================
# TESTING
# =============================================
if __name__ == "__main__":
    # Test example
    example = """
    We are hiring an SAP S/4HANA Cutover Manager for a 6-month contract 
    to lead our go-live weekend in Q1 2026. You will manage dress rehearsals, 
    hypercare support, data migration, and UAT testing. This is an urgent hire 
    with immediate start required. Experience with R2R and Workday Financials 
    is a plus. Infrastructure modernization to AWS is part of the scope.
    """
    
    print("Testing Signal Detection System...\n")
    signals = detect_erp_transformation_signals(example)
    
    print(f"Detected {len(signals)} signals:\n")
    for s in signals[:10]:
        print(f"{s['confidence']:3d}/100 | {s['type']:8} | {s['signal']}")
    
    print("\n" + "="*60)
    stage_info = classify_transformation_stage(signals, example)
    print(f"\nStage: {stage_info['stage']} - {stage_info['stage_name']}")
    print(f"Confidence: {stage_info['confidence']}/100")
    print(f"Timeline: {stage_info['estimated_months_to_go_live']} months to go-live")
    print(f"\nEvidence:")
    for e in stage_info['evidence']:
        print(f"  • {e}")
