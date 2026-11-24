"""Export the backend's canonical validation schema for channel producers."""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from services.api.protocol import EventEnvelope  # noqa: E402

destination = ROOT / 'packages/contracts/schemas/event-envelope.schema.json'
destination.parent.mkdir(parents=True, exist_ok=True)
destination.write_text(json.dumps(EventEnvelope.model_json_schema(), indent=2) + '\n', encoding='utf-8')
print(destination)
