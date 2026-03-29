from pydantic import BaseModel


class MetaResponse(BaseModel):
    name: str
    phase: str
    environment: str
    status: str
