"""Read the answer key off the scanned ARV 2 Testbogen.

The three source sheets carry no printed answer letters. Instead a grey band
covers the right-hand column of every page and exactly one option per question
is filled in with a black marker. This tool measures that band numerically so
the answer key rests on evidence rather than on someone squinting at a photo --
reading these marks by eye at low resolution demonstrably produces off-by-one
row errors.

Geometry note: the pages were photographed in landscape but stored portrait, so
the upright reading order is a 90 deg counter-clockwise rotation. We stay in the
ORIGINAL pixel coordinates and swap axes instead of rotating 14 MP of pixels:

    upright_x = y_orig                      (across a row of the table)
    upright_y = (width_orig - 1) - x_orig   (down the page)

So an option row is a *vertical slice* (a range of x_orig) and the marker band
is a *horizontal band* (a range of y_orig). Descending x_orig == top-to-bottom.

Structure comes from the printed table rules, which are crisp even on the worst
photo; darkness is used only to decide which cell is filled and to tell an
option row apart from the whitespace between question blocks.

Output is one JSON document per Testbogen listing every option row in reading
order with its measured darkness, the chosen answer, and a confidence margin.
Thin margins are flagged for human review rather than guessed.
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

DPI = 300

# A filled cell must beat the runner-up by this fraction of its own darkness
# before the reading is accepted without human review.
MIN_MARGIN = 0.18

# Plausible option-row heights at 300 dpi: ~57 px for a single-line option,
# ~100 px for one that wraps to two lines.
MIN_ROW_PX = 34
MAX_ROW_PX = 150


def load_pgm(path: Path) -> tuple[int, int, memoryview]:
    data = path.read_bytes()
    fields: list[int] = []
    pos = 2
    while len(fields) < 3:
        while data[pos : pos + 1].isspace():
            pos += 1
        if data[pos : pos + 1] == b"#":
            while data[pos : pos + 1] not in (b"\n", b""):
                pos += 1
            continue
        start = pos
        while not data[pos : pos + 1].isspace():
            pos += 1
        fields.append(int(data[start:pos]))
    pos += 1
    w, h, _ = fields
    return w, h, memoryview(data)[pos : pos + w * h]


def render_page(pdf: Path, page: int, out_dir: Path) -> Path:
    stem = out_dir / f"{pdf.stem}-p{page}"
    for stale in out_dir.glob(f"{stem.name}-*.pgm"):
        stale.unlink()
    subprocess.run(
        ["pdftoppm", "-gray", "-r", str(DPI), "-f", str(page), "-l", str(page),
         str(pdf), str(stem)],
        check=True,
    )
    produced = sorted(out_dir.glob(f"{stem.name}-*.pgm"))
    if not produced:
        raise RuntimeError(f"pdftoppm produced no page for {pdf.name} p{page}")
    return produced[0]


def paper_bounds(
    px: memoryview, w: int, h: int, margin: int = 60
) -> tuple[int, int, int, int]:
    """Find the sheet of paper, excluding any dark background around the photo.

    Testbogen 1 page 1 was shot over a dark surface; without this the darkest
    region of the image is the tabletop rather than the answer band.
    """
    def run_of(profile: list[float], limit: int) -> tuple[int, int]:
        # Outer envelope of the bright region, not the largest bright run: the
        # answer band is a dark stripe *inside* the paper and must not clip it.
        bright = [i for i in range(limit) if profile[i] > 0.5]
        if not bright:
            return 0, limit - 1
        return bright[0], bright[-1]

    rows = [
        sum(1 for x in range(0, w, 16) if px[y * w + x] > 190) / len(range(0, w, 16))
        for y in range(h)
    ]
    cols = [
        sum(1 for y in range(0, h, 16) if px[y * w + x] > 190) / len(range(0, h, 16))
        for x in range(w)
    ]
    y0, y1 = run_of(rows, h)
    x0, x1 = run_of(cols, w)

    # Pull in from the sheet edge. On the page shot over a dark tabletop the
    # paper border itself is the darkest thing in the frame and would otherwise
    # outrank the answer band.
    if margin and x1 - x0 > 4 * margin and y1 - y0 > 4 * margin:
        x0, x1, y0, y1 = x0 + margin, x1 - margin, y0 + margin, y1 - margin
    return x0, x1, y0, y1


def find_marker_band(
    px: memoryview, w: int, x0: int, x1: int, y0: int, y1: int
) -> tuple[int, int]:
    """Locate the grey band covering the answer column (a range of y_orig).

    Scored by the fraction of pixels that are solidly dark rather than by mean
    darkness: the band is a solid fill, while question text is thin strokes
    that never blacken a whole column.
    """
    xs = range(x0, x1, 6)
    score = [
        sum(1 for x in xs if px[y * w + x] < 150) / len(xs) for y in range(y0, y1)
    ]

    best: tuple[float, int, int] | None = None
    peak = max(score) if score else 0.0
    if peak <= 0:
        raise RuntimeError("blank page")
    cutoff = peak * 0.45

    i = 0
    while i < len(score):
        if score[i] > cutoff:
            start = i
            while i < len(score) and score[i] > cutoff:
                i += 1
            width = i - start
            if 50 <= width <= 420:
                mean = sum(score[start:i]) / width
                if best is None or mean > best[0]:
                    best = (mean, y0 + start, y0 + i - 1)
        else:
            i += 1
    if best is None:
        raise RuntimeError("no marker band found")
    return best[1], best[2]


def column_profile(
    px: memoryview, w: int, ya: int, yb: int, x0: int, x1: int
) -> list[float]:
    """Mean darkness of each x_orig over a horizontal window."""
    ys = range(ya, yb, 2)
    n = len(ys)
    out = [0.0] * w
    for x in range(x0, x1 + 1):
        out[x] = sum(255 - px[y * w + x] for y in ys) / n
    return out


def find_row_rules(px: memoryview, w: int, band_y0: int, x0: int, x1: int) -> list[int]:
    """Find the table rules separating option rows.

    Sampled just inside the table but to the right of the wrapped option text,
    so the only ink in the window is the rules themselves.
    """
    ya = max(0, band_y0 - 280)
    yb = max(1, band_y0 - 40)
    profile = column_profile(px, w, ya, yb, x0, x1)

    rules: list[int] = []
    x = x0
    while x <= x1:
        if profile[x] > 60:
            start = x
            while x <= x1 and profile[x] > 60:
                x += 1
            rules.append((start + x - 1) // 2)
        else:
            x += 1
    return rules


def split_rows_and_gaps(
    rules: list[int], band: list[float]
) -> list[tuple[int, int, float, bool]]:
    """Classify each gap between rules as an option row or block whitespace.

    An option row sits under the covering band and is therefore dark; the
    whitespace between question blocks is bare paper. Splitting on the widest
    natural break in the darkness distribution avoids hard-coding a threshold
    that would not survive the variation between these photographs.
    """
    spans: list[tuple[int, int, float]] = []
    for a, b in zip(rules, rules[1:]):
        if not (MIN_ROW_PX <= b - a <= MAX_ROW_PX):
            continue
        pad = max(4, (b - a) // 8)
        lo, hi = a + pad, b - pad
        spans.append((lo, hi, sum(band[lo:hi]) / (hi - lo)))
    if not spans:
        return []

    values = sorted(s[2] for s in spans)
    cut = values[0]
    widest = 0.0
    for lo, hi in zip(values, values[1:]):
        if hi - lo > widest:
            widest, cut = hi - lo, (lo + hi) / 2
    # If every span is dark (a page with no block whitespace sampled) keep them all.
    if widest < 18:
        cut = -1.0

    return [(lo, hi, val, val > cut) for lo, hi, val in spans]


def measure(pdf: Path, page: int, work: Path) -> dict:
    pgm = render_page(pdf, page, work)
    w, h, px = load_pgm(pgm)

    x0, x1, y0, y1 = paper_bounds(px, w, h)
    band_y0, band_y1 = find_marker_band(px, w, x0, x1, y0, y1)
    inset = (band_y1 - band_y0) // 5
    band = column_profile(px, w, band_y0 + inset, band_y1 - inset, x0, x1)
    rules = find_row_rules(px, w, band_y0, x0, x1)
    spans = split_rows_and_gaps(rules, band)

    # Consecutive option rows form one question block; whitespace ends a block.
    groups: list[list[tuple[int, int, float]]] = []
    current: list[tuple[int, int, float]] = []
    for lo, hi, val, is_row in spans:
        if is_row:
            current.append((lo, hi, val))
        elif current:
            groups.append(current)
            current = []
    if current:
        groups.append(current)

    out_groups = []
    for rows in groups:
        rows = list(reversed(rows))  # top-to-bottom == descending x_orig
        order = sorted(range(len(rows)), key=lambda i: rows[i][2], reverse=True)
        top = rows[order[0]][2]
        runner = rows[order[1]][2] if len(rows) > 1 else 0.0
        margin = (top - runner) / top if top else 0.0
        out_groups.append(
            {
                "rows": [round(r[2], 1) for r in rows],
                "marked_index": order[0],
                "margin": round(margin, 3),
                "confident": margin >= MIN_MARGIN and len(rows) > 1,
            }
        )

    out_groups.reverse()  # top-to-bottom on the upright page
    return {
        "file": pdf.name,
        "page": page,
        "band": [band_y0, band_y1],
        "groups": out_groups,
    }


def main() -> None:
    root = Path(__file__).resolve().parents[2]
    assets = root / "assets"
    work = root / ".extract-cache"
    work.mkdir(exist_ok=True)
    out_dir = root / "content" / "extraction"
    out_dir.mkdir(parents=True, exist_ok=True)

    # Testbogen -> source file. "Unbenannt 3.pdf" is a byte-identical duplicate
    # of Testbogen 2 and is deliberately not listed.
    sheets = {
        1: "Unbenannt3.pdf",
        2: "1638810214253_Unbenannt2.pdf",
        3: "1638810215616_Unbenannt.pdf",
    }

    for bogen, name in sorted(sheets.items()):
        pdf = assets / name
        pages = []
        # pages are stored in reverse order: page 5 holds question 1
        for page in range(5, 0, -1):
            result = measure(pdf, page, work)
            pages.append(result)
            groups = result["groups"]
            shaky = sum(1 for g in groups if not g["confident"])
            shape = "/".join(str(len(g["rows"])) for g in groups)
            print(
                f"Testbogen {bogen} p{page}: {len(groups):2d} blocks "
                f"({sum(len(g['rows']) for g in groups):2d} rows) "
                f"shape={shape} low-conf={shaky}"
            )
        out = out_dir / f"markers-testbogen-{bogen}.json"
        out.write_text(
            json.dumps({"testbogen": bogen, "source": name, "pages": pages}, indent=2)
        )
        print(f"  -> {out.relative_to(root)}")


if __name__ == "__main__":
    sys.exit(main())
