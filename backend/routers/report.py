"""
Report download router.
GET /report/{analysis_id}/json  → JSON download
GET /report/{analysis_id}/pdf   → PDF download
"""
from __future__ import annotations
import logging
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from services.report_service import generate_json_report, generate_pdf_report

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/report", tags=["Reports"])


def _get_result(analysis_id: str):
    from main import analysis_store
    result = analysis_store.get(analysis_id)
    if result is None:
        raise HTTPException(
            status_code=404,
            detail=f"Analysis '{analysis_id}' not found. Results expire when the server restarts.",
        )
    return result


@router.get("/{analysis_id}/json")
async def download_json_report(analysis_id: str):
    """Download the analysis result as a formatted JSON file."""
    result = _get_result(analysis_id)
    filename = f"apk_report_{analysis_id[:8]}.json"
    json_bytes = generate_json_report(result)
    return Response(
        content=json_bytes,
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/{analysis_id}/pdf")
async def download_pdf_report(analysis_id: str):
    """Download the analysis result as a formatted PDF document."""
    result = _get_result(analysis_id)
    filename = f"apk_report_{analysis_id[:8]}.pdf"
    try:
        pdf_bytes = generate_pdf_report(result)
    except Exception as e:
        logger.exception("PDF generation failed")
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
