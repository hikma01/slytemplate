"""SPIKE_ONLY / NON_PRODUCTION — WeasyPrint benchmark adapter."""
import json
import os
import resource
import subprocess
import sys
import time
from pathlib import Path

from weasyprint import HTML

ROOT = Path(__file__).resolve().parents[1]
FIXTURES = json.loads((ROOT / "fixtures" / "fixtures.json").read_text())
EVIDENCE = ROOT / "evidence"
EVIDENCE.mkdir(parents=True, exist_ok=True)

def run_fixture(fixture):
    from common_html import fixture_html
    html = fixture_html(fixture)
    started = time.perf_counter()
    document = HTML(string=html, base_url=str(ROOT)).render()
    pdf_path = EVIDENCE / f"{fixture['id'].lower()}-weasyprint.pdf"
    document.write_pdf(str(pdf_path))
    return {
        "fixture_id": fixture["id"],
        "page_count": len(document.pages),
        "page_bounds": [{"width": page.width, "height": page.height} for page in document.pages],
        "duration_ms": (time.perf_counter() - started) * 1000,
        "artifact_bytes": pdf_path.stat().st_size,
        "slot_bounds": "UNAVAILABLE_FROM_PUBLIC_API",
        "overflow_height": "UNAVAILABLE_FROM_PUBLIC_API",
        "overflow_width": "UNAVAILABLE_FROM_PUBLIC_API",
        "constraint_measurements": "UNAVAILABLE_FROM_PUBLIC_API",
    }

results = []
for fixture in FIXTURES:
    try:
        results.append(run_fixture(fixture))
    except Exception as error:
        results.append({
            "fixture_id": fixture["id"],
            "status": "RENDER_FAILED",
            "failure_type": type(error).__name__,
            "sanitized_message": str(error)[:240],
        })
report = {
    "benchmark": "SLYDESIGN-RENDERER-BENCHMARK-001",
    "stack": "weasyprint",
    "status": "SPIKE_ONLY / NON_PRODUCTION",
    "environment": {
        "renderer_engine": "WeasyPrint",
        "renderer_engine_version": __import__("weasyprint").__version__,
        "locale": "en-US",
        "timezone": "UTC",
        "network_policy": "no external resources supplied",
    },
    "resource": {"max_rss_kb": resource.getrusage(resource.RUSAGE_SELF).ru_maxrss},
    "results": results,
    "limitations": ["public API did not expose normalized slot bounds in this adapter", "font set not frozen"],
}
(EVIDENCE / "weasyprint-results.json").write_text(json.dumps(report, indent=2))
print(json.dumps({"stack": report["stack"], "fixtures": len(results), "evidence": str(EVIDENCE / "weasyprint-results.json")}, indent=2))
