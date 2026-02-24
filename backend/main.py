from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from state  import state, reset_state
from models import StartPayload, LogPayload, FinishPayload
from parser import (
    parse_guilty_client,
    parse_attack_round,
    parse_round_metrics,
    find_loss_spike,
)

app = FastAPI(title="FedShield API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ══════════════════════════════════════════════════════
#  COLAB → BACKEND
# ══════════════════════════════════════════════════════

@app.post("/start")
def start_round(payload: StartPayload):
    """Colab calls this when a new federation round begins."""
    reset_state()
    return {"ok": True, "message": "Round started"}


@app.post("/update-logs")
def update_logs(payload: LogPayload):
    """Colab pushes live log content every 5 seconds."""
    if payload.client1: state["logs"]["client1"] = payload.client1
    if payload.client2: state["logs"]["client2"] = payload.client2
    if payload.gm:      state["logs"]["gm"]      = payload.gm
    if payload.server:  state["logs"]["server"]  = payload.server
    return {"ok": True}


@app.post("/finish")
def finish_round(payload: FinishPayload):
    """Colab calls this when the FL round is complete."""

    # Push final log contents if provided
    if payload.logs:
        update_logs(payload.logs)

    # Parse guilty client from GM log
    guilty = payload.guilty_client or parse_guilty_client(state["logs"]["gm"])

    # Parse per-round metrics from server log
    metrics = payload.round_metrics or parse_round_metrics(state["logs"]["server"])

    # Find which round had the loss spike
    spike_round = payload.loss_spike_round
    spike_value = payload.loss_spike_value
    if not spike_round and metrics:
        spike_round, spike_value = find_loss_spike(metrics)

    # Find which round noise was injected
    attack_round = payload.attack_round
    if not attack_round:
        for key in ["client1", "client2"]:
            found = parse_attack_round(state["logs"][key])
            if found:
                attack_round = found
                break

    # Save everything to state
    state["status"]           = "done"
    state["guilty_client"]    = guilty
    state["round_metrics"]    = metrics or []
    state["loss_spike_round"] = spike_round
    state["loss_spike_value"] = round(spike_value, 4) if spike_value else None
    state["attack_round"]     = attack_round

    return {"ok": True, "guilty_client": guilty}


# ══════════════════════════════════════════════════════
#  BACKEND → REACT
# ══════════════════════════════════════════════════════

@app.get("/results")
def get_results():
    """React polls this every 2.5s for round status and metrics."""
    return {
        "status":           state["status"],
        "guilty_client":    state["guilty_client"],
        "round_metrics":    state["round_metrics"],
        "loss_spike_round": state["loss_spike_round"],
        "loss_spike_value": state["loss_spike_value"],
        "attack_round":     state["attack_round"],
    }


@app.get("/logs")
def get_logs():
    """React polls this for live terminal content."""
    return state["logs"]


@app.get("/health")
def health():
    return {"status": "ok", "server": "FedShield API v1.0"}


@app.get("/")
def root():
    return {
        "message": "FedShield API is running",
        "docs":    "Visit http://localhost:8000/docs",
    }