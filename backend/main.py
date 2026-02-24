from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import re

app = FastAPI(title="FedShield API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── In-memory state (resets when server restarts) ───────────────────────────
state = {
    "status":       "idle",       # idle | running | done
    "guilty_client": None,        # "hospital1" | "hospital2" | None
    "round_metrics": [],          # list of per-round metrics
    "loss_spike_round": None,     # which round had the spike
    "loss_spike_value": None,     # how big the spike was
    "attack_round": None,         # round where noise was injected
    "logs": {
        "client1": "",
        "client2": "",
        "gm":      "",
        "server":  "",
    }
}


# ══════════════════════════════════════════════════════════════
#  PYDANTIC MODELS  (shapes of data sent to each endpoint)
# ══════════════════════════════════════════════════════════════

class StartPayload(BaseModel):
    message: Optional[str] = "Federation round started"

class LogPayload(BaseModel):
    client1: Optional[str] = ""
    client2: Optional[str] = ""
    gm:      Optional[str] = ""
    server:  Optional[str] = ""

class FinishPayload(BaseModel):
    """
    Colab sends this when the round is complete.
    All fields are parsed from the actual log files.
    """
    guilty_client:    Optional[str]       = None   # "hospital1" or "hospital2"
    loss_spike_round: Optional[int]       = None   # e.g. 2
    loss_spike_value: Optional[float]     = None   # e.g. 376.04
    attack_round:     Optional[int]       = None   # round where noise injected
    round_metrics:    Optional[List[dict]] = None  # per-round accuracy + loss
    logs:             Optional[LogPayload] = None  # final log contents


# ══════════════════════════════════════════════════════════════
#  PARSING HELPERS
#  These read the actual log formats from your Colab output
# ══════════════════════════════════════════════════════════════

def parse_guilty_from_gm_log(gm_log: str) -> Optional[str]:
    """
    Looks for this line in gm_output.log:
      ++ [MATCH] Signature matches Client ID: hospital2
    Returns "hospital2" or "hospital1" or None.
    """
    for line in gm_log.splitlines():
        if "[MATCH]" in line and "Client ID:" in line:
            return line.split("Client ID:")[-1].strip()
    return None


def parse_attack_round_from_client_log(log: str) -> Optional[int]:
    """
    Looks for this line in client2_error.log:
      WARNING:Hospital2:🚨 [Round 2] Injecting NOISE Attack...
    Returns the round number as int, or None.
    """
    match = re.search(r"Injecting NOISE Attack.*?\[Round (\d+)\]|"
                      r"\[Round (\d+)\].*?Injecting NOISE", log)
    if not match:
        # Try the format: WARNING:Hospital2:🚨 [Round 2]
        match = re.search(r"NOISE Attack.*Round\s+(\d+)|Round\s+(\d+).*NOISE", log)
    if match:
        return int(next(g for g in match.groups() if g is not None))
    return None


def parse_round_metrics_from_server_log(server_log: str):
    """
    Looks for this line in server_error.log:
      metrics_distributed {'accuracy': [(1, 0.61), (2, 0.38), (3, 0.62)],
                            'loss':     [(1, 0.65), (2, 376.04), (3, 0.64)]}
    Returns list of dicts: [{"round":1,"accuracy":0.61,"loss":0.65}, ...]
    """
    metrics = []
    acc_match  = re.search(r"'accuracy':\s*\[([^\]]+)\]", server_log)
    loss_match = re.search(r"'loss':\s*\[([^\]]+)\]",     server_log)

    if acc_match and loss_match:
        acc_pairs  = re.findall(r"\((\d+),\s*([\d.]+)\)", acc_match.group(1))
        loss_pairs = re.findall(r"\((\d+),\s*([\d.]+)\)", loss_match.group(1))

        loss_map = {int(r): float(v) for r, v in loss_pairs}

        for rnd, acc in acc_pairs:
            r = int(rnd)
            metrics.append({
                "round":    r,
                "accuracy": round(float(acc), 4),
                "loss":     round(loss_map.get(r, 0.0), 4),
            })

    return metrics


def find_loss_spike(round_metrics: list):
    """
    Finds the round where loss was anomalously high.
    A spike = any round where loss is 10x higher than the median of others.
    """
    if len(round_metrics) < 2:
        return None, None

    losses = [(m["round"], m["loss"]) for m in round_metrics]
    values = [l for _, l in losses]
    median = sorted(values)[len(values) // 2]

    for rnd, loss in losses:
        if loss > median * 10:
            return rnd, loss

    # Fallback: just return the highest loss round
    max_round = max(losses, key=lambda x: x[1])
    return max_round[0], max_round[1]


# ══════════════════════════════════════════════════════════════
#  ROUTES CALLED BY COLAB
# ══════════════════════════════════════════════════════════════

@app.post("/start")
def start_round(payload: StartPayload):
    """Colab calls this at the beginning of a federation round."""
    state["status"]        = "running"
    state["guilty_client"] = None
    state["round_metrics"] = []
    state["loss_spike_round"] = None
    state["loss_spike_value"] = None
    state["attack_round"]  = None
    state["logs"]          = {"client1": "", "client2": "", "gm": "", "server": ""}
    return {"ok": True, "message": "Round started"}


@app.post("/update-logs")
def update_logs(payload: LogPayload):
    """Colab calls this periodically to push live log content."""
    if payload.client1: state["logs"]["client1"] = payload.client1
    if payload.client2: state["logs"]["client2"] = payload.client2
    if payload.gm:      state["logs"]["gm"]      = payload.gm
    if payload.server:  state["logs"]["server"]  = payload.server
    return {"ok": True}


@app.post("/finish")
def finish_round(payload: FinishPayload):
    """
    Colab calls this when the FL round is complete.
    Accepts pre-parsed data OR raw logs and parses them here.
    """
    # ── Update logs if provided ──
    if payload.logs:
        update_logs(payload.logs)

    # ── Parse guilty client ──
    guilty = payload.guilty_client
    if not guilty and state["logs"]["gm"]:
        guilty = parse_guilty_from_gm_log(state["logs"]["gm"])

    # ── Parse round metrics ──
    metrics = payload.round_metrics
    if not metrics and state["logs"]["server"]:
        metrics = parse_round_metrics_from_server_log(state["logs"]["server"])

    # ── Find loss spike ──
    spike_round = payload.loss_spike_round
    spike_value = payload.loss_spike_value
    if not spike_round and metrics:
        spike_round, spike_value = find_loss_spike(metrics)

    # ── Find attack round from client logs ──
    attack_round = payload.attack_round
    if not attack_round:
        for key in ["client1", "client2"]:
            found = parse_attack_round_from_client_log(state["logs"][key])
            if found:
                attack_round = found
                break

    # ── Store everything ──
    state["status"]           = "done"
    state["guilty_client"]    = guilty
    state["round_metrics"]    = metrics or []
    state["loss_spike_round"] = spike_round
    state["loss_spike_value"] = round(spike_value, 4) if spike_value else None
    state["attack_round"]     = attack_round

    return {"ok": True, "guilty_client": guilty}


# ══════════════════════════════════════════════════════════════
#  ROUTES CALLED BY REACT FRONTEND
# ══════════════════════════════════════════════════════════════

@app.get("/results")
def get_results():
    """React polls this every 2-3 seconds to check round status."""
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
    """Quick check — visit http://localhost:8000/health in browser to confirm it's running."""
    return {"status": "ok", "server": "FedShield API v1.0"}


@app.get("/")
def root():
    return {
        "message": "FedShield API is running",
        "docs":    "Visit http://localhost:8000/docs for interactive API docs",
        "health":  "Visit http://localhost:8000/health",
    }