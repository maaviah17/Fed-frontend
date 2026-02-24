import re
from typing import Optional, List, Tuple


def parse_guilty_client(gm_log: str) -> Optional[str]:
    """
    Finds the guilty client from gm_output.log.

    Looks for:
      ++ [MATCH] Signature matches Client ID: hospital2

    Returns "hospital1" or "hospital2" or None.
    """
    for line in gm_log.splitlines():
        if "[MATCH]" in line and "Client ID:" in line:
            return line.split("Client ID:")[-1].strip()
    return None


def parse_attack_round(client_log: str) -> Optional[int]:
    """
    Finds which round the noise attack was injected from client logs.

    Looks for:
      WARNING:Hospital2:🚨 [Round 2] Injecting NOISE Attack...

    Returns round number as int, or None.
    """
    match = re.search(r"\[Round\s+(\d+)\].*?NOISE|NOISE.*?\[Round\s+(\d+)\]", client_log)
    if match:
        return int(next(g for g in match.groups() if g is not None))
    return None


def parse_round_metrics(server_log: str) -> List[dict]:
    """
    Parses per-round accuracy and loss from server_error.log.

    Looks for:
      metrics_distributed {
        'accuracy': [(1, 0.61), (2, 0.38), (3, 0.62)],
        'loss':     [(1, 0.65), (2, 376.04), (3, 0.64)]
      }

    Returns: [{ round, accuracy, loss }, ...]
    """
    metrics = []
    acc_match  = re.search(r"'accuracy':\s*\[([^\]]+)\]", server_log)
    loss_match = re.search(r"'loss':\s*\[([^\]]+)\]",     server_log)

    if not acc_match or not loss_match:
        return metrics

    acc_pairs  = re.findall(r"\((\d+),\s*([\d.]+)\)", acc_match.group(1))
    loss_pairs = re.findall(r"\((\d+),\s*([\d.]+)\)", loss_match.group(1))
    loss_map   = {int(r): float(v) for r, v in loss_pairs}

    for rnd, acc in acc_pairs:
        r = int(rnd)
        metrics.append({
            "round":    r,
            "accuracy": round(float(acc), 4),
            "loss":     round(loss_map.get(r, 0.0), 4),
        })

    return metrics


def find_loss_spike(round_metrics: list) -> Tuple[Optional[int], Optional[float]]:
    """
    Identifies the round where loss spiked anomalously.
    A spike = any round where loss is 10x higher than the median.

    Returns (spike_round, spike_value) or (None, None).
    """
    if len(round_metrics) < 2:
        return None, None

    losses = [(m["round"], m["loss"]) for m in round_metrics]
    values = [l for _, l in losses]
    median = sorted(values)[len(values) // 2]

    for rnd, loss in losses:
        if loss > median * 10:
            return rnd, loss

    # Fallback — return the highest loss round
    max_rnd = max(losses, key=lambda x: x[1])
    return max_rnd[0], max_rnd[1]