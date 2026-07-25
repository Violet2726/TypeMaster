from __future__ import annotations

import hashlib
import json
import math
import struct
import wave
from pathlib import Path

RATE = 44_100


def envelope(position: float, duration: float, attack: float = 0.01, release: float = 0.08) -> float:
    return min(1.0, position / attack) * min(1.0, max(0.0, duration - position) / release)


def write(path: Path, duration: float, sample) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(RATE)
        frames = []
        for index in range(round(duration * RATE)):
            value = max(-1.0, min(1.0, sample(index / RATE)))
            frames.append(struct.pack("<h", round(value * 32767)))
        output.writeframes(b"".join(frames))


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    root = Path("apps/web/public/game/v1")
    audio = root / "audio"
    assets = {
        "hit": (0.1, lambda t: math.sin(2 * math.pi * (320 + 1300 * t) * t) * envelope(t, 0.1) * 0.23),
        "error": (0.16, lambda t: (math.sin(2 * math.pi * 142 * t) + 0.35 * math.sin(2 * math.pi * 71 * t)) * envelope(t, 0.16, 0.005, 0.11) * 0.17),
        "surge": (0.52, lambda t: (math.sin(2 * math.pi * (160 + 720 * t) * t) + 0.35 * math.sin(2 * math.pi * (310 + 900 * t) * t)) * envelope(t, 0.52, 0.04, 0.18) * 0.18),
        "upgrade": (0.44, lambda t: (math.sin(2 * math.pi * 440 * t) + math.sin(2 * math.pi * 660 * t) + math.sin(2 * math.pi * 880 * t)) * envelope(t, 0.44, 0.02, 0.25) * 0.085),
        "ambient-loop": (6.0, lambda t: (math.sin(2 * math.pi * 55 * t) + 0.6 * math.sin(2 * math.pi * 82.5 * t) + 0.25 * math.sin(2 * math.pi * 110 * t)) * (0.55 + 0.45 * math.sin(math.pi * t / 6) ** 2) * 0.045)
    }
    records = []
    for name, (duration, sample) in assets.items():
        path = audio / f"{name}.wav"
        write(path, duration, sample)
        records.append({"id": name, "kind": "audio", "src": f"/game/v1/audio/{path.name}", "durationMs": round(duration * 1000), "sha256": digest(path), "altKey": f"asset.audio.{name}.label"})
    manifest_path = root / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest["assets"] = [item for item in manifest["assets"] if item["kind"] != "audio"] + records
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
