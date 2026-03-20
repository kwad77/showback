"""FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db import init_db
from app.routers import birthright, employees, outliers, personas, reports, upload

app = FastAPI(
    title="Employee TCO Analyzer",
    description="Calculate and visualise the total technology cost of ownership per employee.",
    version="1.0.0",
)

# ── CORS (allow Vite dev server) ──────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(personas.router, prefix="/api/personas", tags=["Personas"])
app.include_router(birthright.router, prefix="/api/birthright", tags=["Birthright"])
app.include_router(employees.router, prefix="/api/employees", tags=["Employees"])
app.include_router(outliers.router, prefix="/api/outliers", tags=["Outliers"])
app.include_router(upload.router, prefix="/api/upload", tags=["Upload"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/api/health", tags=["Health"])
def health():
    return {"status": "ok", "service": "TCO Analyzer"}
