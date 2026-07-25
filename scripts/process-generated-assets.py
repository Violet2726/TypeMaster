from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image


ENEMIES = ["drift", "flare", "veil", "hinge", "choir", "lattice", "cipher", "warden", "echo"]
BOSSES = ["harbor-mind", "still-engine", "terminal-sun"]
UPGRADES = [
    "clean-strike", "echo-lance", "prism-arc", "quiet-blade", "signal-ray", "orbit-burst",
    "terminal-wave", "lumen-cascade", "calm-buffer", "steady-heart", "glass-memory", "soft-landing",
    "shard-vault", "resonance-loop", "deep-breath", "second-light", "focus-glyph", "number-glyph",
    "punctuation-glyph", "mirror-glyph", "velocity-glyph", "fracture-glyph", "boss-glyph", "black-core-key"
]


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def cover(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    source = image.convert("RGB")
    ratio = max(size[0] / source.width, size[1] / source.height)
    resized = source.resize((round(source.width * ratio), round(source.height * ratio)), Image.Resampling.LANCZOS)
    left = (resized.width - size[0]) // 2
    top = (resized.height - size[1]) // 2
    return resized.crop((left, top, left + size[0], top + size[1]))


def remove_checkerboard(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    output = []
    for red, green, blue, _ in rgba.getdata():
        brightness = max(red, green, blue)
        chroma = brightness - min(red, green, blue)
        if brightness > 218 and chroma < 32:
            alpha = 0
        elif brightness > 190 and chroma < 48:
            alpha = max(0, min(255, (chroma - 10) * 9 + (218 - brightness) * 4))
        else:
            alpha = 255
        output.append((red, green, blue, alpha))
    rgba.putdata(output)
    return rgba


def isolate(cell: Image.Image, size: int, padding: int) -> Image.Image:
    transparent = remove_checkerboard(cell)
    alpha = transparent.getchannel("A")
    bounds = alpha.getbbox()
    if bounds:
        transparent = transparent.crop(bounds)
    scale = min((size - padding * 2) / transparent.width, (size - padding * 2) / transparent.height)
    resized = transparent.resize((max(1, round(transparent.width * scale)), max(1, round(transparent.height * scale))), Image.Resampling.LANCZOS)
    result = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    result.alpha_composite(resized, ((size - resized.width) // 2, (size - resized.height) // 2))
    return result


def split_sheet(source: Path, output_dir: Path, names: list[str], columns: int, rows: int, size: int, padding: int, kind: str) -> list[dict[str, object]]:
    image = Image.open(source).convert("RGB")
    output_dir.mkdir(parents=True, exist_ok=True)
    cell_width = image.width / columns
    cell_height = image.height / rows
    records = []
    for index, name in enumerate(names):
        column = index % columns
        row = index // columns
        box = (round(column * cell_width), round(row * cell_height), round((column + 1) * cell_width), round((row + 1) * cell_height))
        asset = isolate(image.crop(box), size, padding)
        path = output_dir / f"{name}.png"
        asset.save(path, optimize=True)
        records.append({"id": name, "kind": kind, "src": f"/game/v1/{output_dir.name}/{path.name}", "width": size, "height": size, "sha256": sha256(path), "colorSpace": "sRGB", "altKey": f"asset.{kind}.{name}.alt"})
    return records


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--prism", type=Path, required=True)
    parser.add_argument("--forge", type=Path, required=True)
    parser.add_argument("--core", type=Path, required=True)
    parser.add_argument("--enemies", type=Path, required=True)
    parser.add_argument("--bosses", type=Path, required=True)
    parser.add_argument("--upgrades", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()

    args.out.mkdir(parents=True, exist_ok=True)
    records: list[dict[str, object]] = []
    backgrounds = args.out / "backgrounds"
    backgrounds.mkdir(exist_ok=True)
    for name, source in [("prism-harbor", args.prism), ("quiet-forge", args.forge), ("black-core", args.core)]:
        path = backgrounds / f"{name}.webp"
        cover(Image.open(source), (1920, 1080)).save(path, "WEBP", quality=88, method=6)
        records.append({"id": name, "kind": "background", "src": f"/game/v1/backgrounds/{path.name}", "width": 1920, "height": 1080, "sha256": sha256(path), "colorSpace": "sRGB", "altKey": f"asset.background.{name}.alt"})
    records.extend(split_sheet(args.enemies, args.out / "enemies", ENEMIES, 3, 3, 384, 24, "enemy"))
    records.extend(split_sheet(args.bosses, args.out / "bosses", BOSSES, 3, 1, 512, 28, "boss"))
    records.extend(split_sheet(args.upgrades, args.out / "upgrades", UPGRADES, 6, 4, 192, 14, "upgrade"))
    manifest = {"contentVersion": 1, "generated": True, "license": "Original project asset generated for TypeRift", "assets": records}
    (args.out / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
