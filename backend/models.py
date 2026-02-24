from pydantic import BaseModel
from typing import Optional, List


class StartPayload(BaseModel):
    message: Optional[str] = "Federation round started"


class LogPayload(BaseModel):
    client1: Optional[str] = ""
    client2: Optional[str] = ""
    gm:      Optional[str] = ""
    server:  Optional[str] = ""


class FinishPayload(BaseModel):
    """
    Colab sends this when the FL round is complete.
    Backend parses everything from the log contents.
    """
    guilty_client:    Optional[str]        = None
    loss_spike_round: Optional[int]        = None
    loss_spike_value: Optional[float]      = None
    attack_round:     Optional[int]        = None
    round_metrics:    Optional[List[dict]] = None
    logs:             Optional[LogPayload] = None