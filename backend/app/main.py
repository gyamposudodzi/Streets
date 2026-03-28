from fastapi import FastAPI


app = FastAPI(
    title="Streets API",
    version="0.1.0",
    description="Phase 0 API scaffold for the Streets platform.",
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/v1/meta")
def meta() -> dict[str, str]:
    return {
        "name": "Streets API",
        "phase": "0",
        "status": "scaffold",
    }
