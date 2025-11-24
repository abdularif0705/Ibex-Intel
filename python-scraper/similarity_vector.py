"""
PyTorch-powered SentenceTransformer pipeline for semantic signal detection.
Enable by installing `sentence-transformers` and wiring this module in main.py.
"""

# # pip install sentence-transformers numpy tqdm
# from sentence_transformers import SentenceTransformer
# import numpy as np
# from typing import List, Dict
# from pydantic import BaseModel

# # =============================================
# # 1. Load fastest + best local model (2025 gold standard)
# # =============================================
# model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2", device="cpu")  # or "cuda" if you have GPU

# # Pre-compute normalized embeddings once at startup
# print("Loading model & building signal embeddings...")

# # =============================================
# # 2. EXTENSIVE CONTEXT-AWARE SIGNAL LIBRARY (2025)
# # Only triggers when ERP/HCM/PLM/ETL/Infrastructure context exists
# # =============================================
# CONTEXT_KEYWORDS = {
#     # Core systems
#     "erp", "hcm", "plm", "crm", "scm", "eim", "etl", "edw", "bi ", "bw/4", "bpc",
#     "s/4hana", "s4hana", "s4/hana", "ecc", "r/3", "rise with sap",
#     "workday", "workday financials", "workday hcm", "workday scm",
#     "oracle cloud", "oracle fusion", "oracle ebs", "oracle erp cloud", "fusion financials",
#     "netsuite", "infor", "dynamics 365", "d365", "ax ", "peoplesoft", "successfactors",
#     "salesforce", "servicenow", "anaplan", "coupa", "concur", "kyriba", "blackline",

#     # Processes & patterns
#     "data migration", "system implementation", "system integration", "core template",
#     "cloud migration", "infrastructure modernization", "lift and shift", "replatforming",
#     "r2r", "record to report", "o2c", "order to cash", "p2p", "procure to pay",
#     "fpa", "financial planning", "eib", "fdm", "picu", "prism", "calc manager"
# }

# # =============================================
# # 2. HIGH-CONFIDENCE TRANSFORMATION SIGNALS , add more as required
# # =============================================
# HIGH_SIGNAL_PHRASES = {
#     # ── PHASE INDICATORS (95–100 = go-live imminent) ───────────────────────
#     "cutover": 96, "cutover weekend": 99, "cutover manager": 98, "cutover lead": 98,
#     "cutover coordinator": 97, "production cutover": 98, "final cutover": 99,
#     "go-live": 94, "go live": 94, "go-live date": 97, "go-live weekend": 98,
#     "go-live support": 93, "post go-live": 90, "post-go-live": 90,
#     "hypercare": 92, "hyper-care": 92, "hyper care": 92,
#     "dress rehearsal": 90, "mock cutover": 91, "mock go-live": 91,
#     "dry run": 88, "parallel run": 89, "parallel payroll": 90,

#     # ── TESTING & VALIDATION (70–85) ───────────────────────────────────────
#     "uat": 78, "user acceptance testing": 79, "sit testing": 75, "system integration testing": 76,
#     "end-to-end testing": 77, "e2e testing": 77, "regression testing lead": 80,

#     # ── DATA MIGRATION RED FLAGS (80–90) ───────────────────────────────────
#     "data migration": 82, "data migration lead": 88, "data conversion": 83,
#     "legacy data migration": 87, "master data lead": 86, "mdm lead": 85,
#     "data cleansing": 80, "data archiving": 78,

#     # ── IMPLEMENTATION ROLES (85–95) ───────────────────────────────────────
#     "transformation director": 94, "transformation lead": 92, "program director": 95,
#     "transformation architect": 93, "solution architect": 88, "principal consultant": 87,
#     "implementation manager": 90, "delivery executive": 89, "change enablement lead": 85,
#     "OCM lead": 88, "organizational change management": 87,

#     # ── VENDOR + HIGH-RISK MODULES (90–98) ─────────────────────────────────
#     "workday financials": 97, "workday scm": 95, "workday adaptive": 92,
#     "r2r": 93, "record to report": 93, "o2c": 91, "order to cash": 91,
#     "p2p": 90, "procure to pay": 90, "revenue accounting": 94,
#     "oracle fusion financials": 94, "oracle revenue management": 95,
#     "netsuite oneworld": 89, "s/4hana finance": 92, "central finance": 93,
#     "group reporting": 90, "sac planning": 88,

#     # ── CONTRACT & URGENCY (75–90) ─────────────────────────────────────────
#     "6 month contract": 85, "6-12 month contract": 87, "12 month contract": 82,
#     "18 month contract": 84, "immediate start": 86, "urgent hire": 88,
#     "asap start": 87, "start asap": 86, "contract-to-hire": 80,

#     # ── INFRASTRUCTURE & CLOUD MIGRATION (80–90) ───────────────────────────
#     "rise with sap": 94, "sap on azure": 88, "sap on aws": 88, "hana enterprise cloud": 87,
#     "ecc to s/4hana": 93, "brownfield": 85, "greenfield": 84, "bluefield": 86,
#     "selective data transition": 87,

#     # ── INTEGRATION & BOLT-ONS (80–88) ─────────────────────────────────────
#     "eib": 80, "enterprise interface builder": 82, "picu": 80, "peoplesoft integration": 83,
#     "core connector": 81, "studio integration": 84, "boomi": 80, "mulesoft": 80, "dell boomi": 80,
#     "fieldglass": 80, "concur integration": 82, "ariba integration": 83,

#     # ── STABILIZATION & POST-LIVE (88–94) ──────────────────────────────────
#     "stabilization lead": 92, "post-implementation support": 89,
#     "center of excellence": 85, "coe lead": 87, "run team": 84,

#     # ── RARE BUT NUCLEAR SIGNALS (98–100) ──────────────────────────────────
#     "war room": 99, "command center": 99, "cutover command center": 100,
#     "rollback plan": 98, "contingency planning": 96
# }

# # Build signal sentences + embeddings
# signal_sentences = list(HIGH_SIGNAL_PHRASES.keys())
# signal_embeddings = model.encode(signal_sentences, normalize_embeddings=True)
# signal_weights = [HIGH_SIGNAL_PHRASES[s] for s in signal_sentences]

# print(f"Loaded {len(signal_sentences)} context-aware signals")

# # =============================================
# # 3. Chunking with overlap for long texts (10-Ks, long job desc)
# # =============================================
# def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
#     words = text.split()
#     chunks = []
#     i = 0
#     while i < len(words):
#         chunk_words = words[i:i + chunk_size]
#         chunk = " ".join(chunk_words)
#         chunks.append(chunk)
#         if len(chunk_words) < chunk_size:
#             break
#         i += chunk_size - overlap
#     return chunks

# # =============================================
# # 4. MAIN DETECTION FUNCTION (context-aware + chunked)
# # =============================================
# def detect_erp_transformation_signals(
#     text: str,
#     vector_threshold: float = 0.36,
#     min_context_words: int = 1
# ) -> List[Dict]:
#     """
#     Input: Any length string (job posting, 10-K, news, etc.)
#     Output: List of high-confidence ERP/HCM/PLM signals with context proof
#     """
#     text_lower = text.lower()
    
#     # Quick context check — reject if no ERP context at all
#     context_count = sum(1 for kw in CONTEXT_KEYWORDS if kw in text_lower)
#     if context_count < min_context_words:
#         return []  # No ERP/HCM/PLM context → ignore "cutover" in unrelated job

#     chunks = chunk_text(text_lower, 100, 20)
#     all_matches = []

#     for chunk in chunks:
#         chunk_emb = model.encode([chunk], normalize_embeddings=True)


#         # Vector similarity using DOT PRODUCT (fastest & best)
#         similarities = np.dot(signal_embeddings, chunk_emb.T).flatten()

#         # print(f"Chunk: {chunk}")
#         for sent, sim, base_weight in zip(signal_sentences, similarities, signal_weights):
#             # print(f"Comparing with ##{chunk} ### sim: {sim} \n\n")
#             if sim > vector_threshold:
#                 # Boost if exact match
#                 score = base_weight if sent in chunk else int(60 + 40 * sim)
#                 score = min(100, score)

#                 all_matches.append({
#                     "signal": sent,
#                     "confidence": score,
#                     "type": "exact" if sent in chunk else "vector",
#                     "similarity": round(float(sim), 3),
#                     "evidence": sent.title(),
#                     "context_keywords_found": context_count
#                 })

#     # Dedupe + sort by confidence
#     seen = set()
#     final = []
#     for m in sorted(all_matches, key=lambda x: x["confidence"], reverse=True):
#         key = m["signal"]
#         if key not in seen:
#             seen.add(key)
#             final.append(m)

#     # print(f"Final signals: {final}")
#     return final[:12]  # Top 12 signals



    
# def classify_transformation_stage(signals: List[Dict], text: str) -> Dict:
#     """
#     Takes output from detect_erp_transformation_signals() + raw text
#     Returns exact stage + confidence + evidence
#     """
#     # Defensive: handle empty signals
#     if not signals:
#         return {
#             "stage": 0,
#             "stage_name": "No Activity",
#             "confidence": 0,
#             "evidence": [],
#             "estimated_months_to_go_live": "N/A"
#         }
#     text_lower = text.lower()
#     score = 0
#     evidence = []

#     # ── Stage 5: GO-LIVE / HYPERCARE (98–100) ─────────────────────────────────
#     if any(p in text_lower for p in ["go-live weekend", "cutover weekend", "final cutover", "war room", "command center"]):
#         return {"stage": 5, "stage_name": "Go-Live / Hypercare", "confidence": 100, "evidence": ["Nuclear go-live signal detected"]}

#     if any(s["signal"] in ["cutover", "cutover weekend", "go-live", "hypercare"] and s["confidence"] >= 95 for s in signals):
#         score += 60
#         evidence.append("Cutover or go-live mentioned with high confidence")

#     # ── Stage 4: LATE STAGE – UAT / Cutover Prep (90–98) ───────────────────────
#     late_signals = ["dress rehearsal", "mock cutover", "uat lead", "parallel run", "cutover manager", "rollback plan"]
#     if any(s["signal"] in late_signals and s["confidence"] >= 85 for s in signals):
#         score += 45
#         evidence.append("Late-stage rehearsal or rollback planning")

#     # ── Stage 3: BUILD & TESTING (75–90) ─────────────────────────────────────
#     if any(kw in text_lower for kw in ["prototype", "configuring", "configuration", "eib", "integration testing", "data migration lead"]):
#         score += 30
#         evidence.append("Active build/configuration phase")

#     # ── Stage 2: DESIGN / VENDOR SELECTION (55–75) ───────────────────────────
#     if any(kw in text_lower for kw in ["blueprint", "fit-gap", "requirements gathering", "process design", "rfp", "vendor selection"]):
#         score += 20
#         evidence.append("Design/blueprint/RFP phase")

#     # ── Stage 1: EARLY PLANNING (30–55) ───────────────────────────────────────
#     if any(kw in text_lower for kw in ["transformation roadmap", "feasibility study", "business case", "target operating model"]):
#         score += 15
#         evidence.append("Strategic planning phase")

#     # ── Contract urgency boost ───────────────────────────────────────────────
#     if any(p in text_lower for p in ["6 month contract", "immediate start", "urgent"]):
#         score += 25
#         evidence.append("Urgent short-term contract → late stage")

#     # Final confidence (capped at 100)
#     confidence = min(100, score)
    
#     if confidence < 30:
#         stage = 0
#         name = "No Activity"
#     elif confidence < 55:
#         stage = 1
#         name = "Early Planning / RFP"
#     elif confidence < 75:
#         stage = 2
#         name = "Vendor Selection & Design"
#     elif confidence < 90:
#         stage = 3
#         name = "Build & Testing"
#     elif confidence < 98:
#         stage = 4
#         name = "Late Stage (UAT/Cutover Prep)"
#     else:
#         stage = 5
#         name = "Go-Live / Hypercare"

#     return {
#         "stage": stage,
#         "stage_name": name,
#         "confidence": confidence,
#         "evidence": evidence[:5],
#         "estimated_months_to_go_live": 
#             ">18" if stage == 1 else
#             "12-18" if stage == 2 else
#             "6-12" if stage == 3 else
#             "1-6" if stage == 4 else
#             "0-3 (NOW)" if stage == 5 else
#             "N/A"
#     }


# # =============================================
# # REAL EXAMPLE (Copy-paste any text)
# # =============================================
# if __name__ == "__main__":
#     example = """
#     We are hiring an SAP S/4HANA Cutover Manager for a 6-month contract 
#     to lead our go-live weekend in Q1 2026. You will manage dress rehearsals, 
#     hypercare support, data migration, and UAT testing. This is an urgent hire 
#     with immediate start required. Experience with R2R and Workday Financials 
#     is a plus. Infrastructure modernization to AWS is part of the scope.
#     """

#     signals = detect_erp_transformation_signals(example)
    
#     print("\nHIGH-CONFIDENCE TRANSFORMATION SIGNALS DETECTED:\n")
#     for s in signals:
#         print(f"{s['confidence']}/100 | {s['type']:6} | {s['signal']}")