"""Compose a per-page "answer sheet" image for reliable human verification.

The answer key on these scans lives in a covering band at the far right of each
row, while the question number and option letter live at the far left. Reading a
whole page at once puts those 1500 px apart and invites off-by-one-row errors --
which is exactly the mistake that a low-resolution pass produced on Testbogen 1
question 16.

This tool cuts the two ends out of each page and butts them together, so the
question number, the option letter and the marker cell for the same row sit side
by side. Alignment then needs no counting: the row that is filled in is the row
whose number you can read in the same strip.

Output is upright (the source pages are stored rotated 90 deg) and written as
PNG next to the extraction data.
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

from read_markers import (
    DPI,
    find_marker_band,
    load_pgm,
    paper_bounds,
    render_page,
)

# How much of the left edge of the table to keep: enough for the question
# number column plus the a/b/c option letter column.
LEFT_SLICE_PX = 400

# Gutter drawn between the two slices so they read as separate columns.
GUTTER_PX = 14


def find_table_left(px: memoryview, w: int, x0: int, x1: int, y0: int, limit: int) -> int:
    """Find the left edge of the table (a y_orig, since the page is rotated).

    The border is a thin skewed line rather than a sharp spike, so we take the
    first column carrying real ink and let the slice width absorb the slack.
    """
    xs = range(x0, x1, 8)
    n = len(xs)
    for y in range(y0, max(y0 + 1, limit)):
        if sum(1 for x in xs if px[y * w + x] < 160) / n > 0.15:
            return y
    return y0


def write_pgm(path: Path, width: int, height: int, rows: list[bytearray]) -> None:
    with path.open("wb") as fh:
        fh.write(f"P5\n{width} {height}\n255\n".encode())
        for row in rows:
            fh.write(bytes(row))


def compose(pdf: Path, page: int, work: Path, out: Path) -> None:
    pgm = render_page(pdf, page, work)
    w, h, px = load_pgm(pgm)

    # Band detection needs the eroded bounds (the sheet edge can outrank the
    # band); the strip itself must use the full extent so that a question split
    # across a page break does not lose its first option.
    x0, x1, y0, y1 = paper_bounds(px, w, h)
    band_y0, band_y1 = find_marker_band(px, w, x0, x1, y0, y1)
    table_left = find_table_left(px, w, x0, x1, y0, band_y0 - 500)
    x0, x1, _, _ = paper_bounds(px, w, h, margin=0)

    left_a = max(0, table_left - 35)
    left_b = min(band_y0, left_a + LEFT_SLICE_PX)
    right_a = max(left_b, band_y0 - 45)
    right_b = min(h - 1, band_y1 + 25)

    left_cols = list(range(left_a, left_b))
    right_cols = list(range(right_a, right_b))
    width = len(left_cols) + GUTTER_PX + len(right_cols)

    # Upright view: descending x_orig runs top-to-bottom down the page.
    rows: list[bytearray] = []
    for x in range(x1, x0 - 1, -1):
        row = bytearray(width)
        i = 0
        for y in left_cols:
            row[i] = px[y * w + x]
            i += 1
        for _ in range(GUTTER_PX):
            row[i] = 255
            i += 1
        for y in right_cols:
            row[i] = px[y * w + x]
            i += 1
        rows.append(row)

    def emit(target: Path, chunk: list[bytearray]) -> None:
        tmp = work / f"{target.stem}.pgm"
        write_pgm(tmp, width, len(chunk), chunk)
        subprocess.run(
            ["sips", "-s", "format", "png", str(tmp), "--out", str(target)],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        tmp.unlink()

    emit(out, rows)

    # Half-height copies. The viewer scales a full strip down far enough that
    # adjacent cells blur together; halves double the effective magnification
    # for verifying a specific disputed question.
    half = len(rows) // 2
    overlap = 120
    emit(out.with_name(f"{out.stem}-top.png"), rows[: half + overlap])
    emit(out.with_name(f"{out.stem}-bottom.png"), rows[max(0, half - overlap) :])

    print(f"{out.name}: {width}x{len(rows)}  band={band_y0}-{band_y1} left={table_left}")


def main() -> None:
    root = Path(__file__).resolve().parents[2]
    work = root / ".extract-cache"
    work.mkdir(exist_ok=True)
    out_dir = work / "answer-sheets"
    out_dir.mkdir(exist_ok=True)

    sheets = {
        1: "Unbenannt3.pdf",
        2: "1638810214253_Unbenannt2.pdf",
        3: "1638810215616_Unbenannt.pdf",
    }
    for bogen, name in sorted(sheets.items()):
        pdf = root / "assets" / name
        for page in range(5, 0, -1):
            compose(pdf, page, work, out_dir / f"t{bogen}-p{page}.png")


if __name__ == "__main__":
    sys.exit(main())
