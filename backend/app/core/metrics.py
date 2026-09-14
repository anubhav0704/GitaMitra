import time
from typing import Dict, Any
from collections import defaultdict, deque

class MetricsCollector:
    """Tracks application request counts, latencies, AI operations, and errors."""
    def __init__(self):
        self.request_counts: Dict[str, int] = defaultdict(int)
        self.error_counts: Dict[str, int] = defaultdict(int)
        self.latencies: Dict[str, deque] = defaultdict(lambda: deque(maxlen=200))
        self.ai_metrics: Dict[str, int] = defaultdict(int)
        self.start_time: float = time.time()

    def record_request(self, endpoint: str, status_code: int, duration_ms: float):
        key = f"{endpoint}:{status_code}"
        self.request_counts[key] += 1
        self.latencies[endpoint].append(duration_ms)
        if status_code >= 400:
            self.error_counts[str(status_code)] += 1

    def record_ai_usage(self, metric_name: str, count: int = 1):
        self.ai_metrics[metric_name] += count

    def get_summary(self) -> Dict[str, Any]:
        uptime_seconds = int(time.time() - self.start_time)
        avg_latencies = {}
        for ep, lat_list in self.latencies.items():
            if lat_list:
                avg_latencies[ep] = round(sum(lat_list) / len(lat_list), 2)

        total_requests = sum(self.request_counts.values())
        total_errors = sum(self.error_counts.values())

        return {
            "uptime_seconds": uptime_seconds,
            "total_requests": total_requests,
            "total_errors": total_errors,
            "error_rate_pct": round((total_errors / total_requests * 100) if total_requests > 0 else 0, 2),
            "avg_latencies_ms": avg_latencies,
            "ai_usage": dict(self.ai_metrics)
        }

metrics_collector = MetricsCollector()
