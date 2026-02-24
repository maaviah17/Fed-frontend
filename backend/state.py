state = {
    "status":           "idle",   # idle | running | done
    "guilty_client":    None,     # "hospital1" | "hospital2" | None
    "round_metrics":    [],       # [{ round, accuracy, loss }, ...]
    "loss_spike_round": None,     # e.g. 2
    "loss_spike_value": None,     # e.g. 376.04
    "attack_round":     None,     # round where noise was injected
    "logs": {
        "client1": "",
        "client2": "",
        "gm":      "",
        "server":  "",
    }
}


def reset_state():
    """Call this at the start of every new federation round."""
    state["status"]           = "running"
    state["guilty_client"]    = None
    state["round_metrics"]    = []
    state["loss_spike_round"] = None
    state["loss_spike_value"] = None
    state["attack_round"]     = None
    state["logs"]             = {"client1": "", "client2": "", "gm": "", "server": ""}