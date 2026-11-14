"""Builds docs/pitch/gap-radar-deck-mockup.pdf: a 12-slide 16:9 startup-style deck with matplotlib (no extra installs).

Run: python docs/pitch/make_deck.py   (DECK_PREVIEW=<dir> also writes PNG previews)
One idea per slide, under ~30 words. Every figure is one the app shows (Sotkanet, Cancer Registry, Statistics
Finland, Pohde price list); check the numbers against the live app before presenting. Screens are drawn, not
screenshots. Uses Segoe UI where installed (Windows), else DejaVu Sans.
"""
import os
from pathlib import Path

import matplotlib
import numpy as np

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import font_manager
from matplotlib.backends.backend_pdf import PdfPages
from matplotlib.colors import LinearSegmentedColormap, to_rgb
from matplotlib.patches import Circle, FancyBboxPatch, Wedge

BG, BG2, FG, DIM, LINE = "#0b1316", "#121d21", "#f2f4f1", "#8a979c", "#25333a"
RED, BLUE, PAPER, INK = "#e05a43", "#5b9cc6", "#eef0ec", "#172226"
W, H = 16, 9
OUT = Path(os.environ.get("DECK_OUT") or Path(__file__).with_name("gap-radar-deck-mockup.pdf"))
TOTAL = 12

FONT = {}
for key, file in {"black": "seguibl.ttf", "bold": "segoeuib.ttf", "light": "segoeuil.ttf", "regular": "segoeui.ttf"}.items():
    path = Path("C:/Windows/Fonts") / file
    FONT[key] = (font_manager.FontProperties(fname=str(path)) if path.exists()
                 else font_manager.FontProperties(family="DejaVu Sans", weight="bold" if key in ("black", "bold") else "normal"))


def t(ax, x, y, s, size, weight="regular", color=FG, **kw):
    """Text in one of the four faces (Segoe UI Black, Bold, Light, Regular; DejaVu Sans as fallback)."""
    fp = FONT[weight].copy()
    fp.set_size(size)
    return ax.text(x, y, s, fontproperties=fp, color=color, **kw)


def glow(ax, cx, cy, r, color, strength=0.35):
    """A soft radial light behind the content."""
    n = 400
    xs, ys = np.meshgrid(np.linspace(0, W, n), np.linspace(0, H, int(n * H / W)))
    d = np.clip(1 - np.hypot(xs - cx, ys - cy) / r, 0, 1) ** 2 * strength
    rgba = np.zeros((*d.shape, 4))
    rgba[..., :3] = to_rgb(color)
    rgba[..., 3] = d
    ax.imshow(rgba, extent=(0, W, 0, H), origin="lower", zorder=0, interpolation="bilinear")


def radar(ax, cx, cy, r, sweep=58, blips=((0.62, 70, RED), (0.35, 140, BLUE)), alpha=1.0):
    """The brand motif: rings, a fading sweep and blips."""
    for k in (0.25, 0.5, 0.75, 1.0):
        ax.add_patch(Circle((cx, cy), r * k, fill=False, ec=LINE, lw=1.1, alpha=alpha, zorder=1))
    ax.plot([cx - r, cx + r], [cy, cy], color=LINE, lw=0.8, alpha=alpha, zorder=1)
    ax.plot([cx, cx], [cy - r, cy + r], color=LINE, lw=0.8, alpha=alpha, zorder=1)
    for i in range(24):
        ax.add_patch(Wedge((cx, cy), r, sweep + i * 2.2, sweep + (i + 1) * 2.2, color=BLUE,
                           alpha=alpha * 0.22 * (i + 1) / 24, lw=0, zorder=1))
    ax.plot([cx, cx + r * np.cos(np.radians(sweep + 52.8))], [cy, cy + r * np.sin(np.radians(sweep + 52.8))],
            color=BLUE, lw=1.6, alpha=alpha, zorder=2)
    for rr, ang, col in blips:
        bx, by = cx + r * rr * np.cos(np.radians(ang)), cy + r * rr * np.sin(np.radians(ang))
        ax.add_patch(Circle((bx, by), 0.22 * r / 3, color=col, alpha=0.25 * alpha, zorder=2))
        ax.add_patch(Circle((bx, by), 0.08 * r / 3, color=col, alpha=alpha, zorder=3))


def card(ax, x, y, w, h, fc=BG2, ec=LINE):
    ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0,rounding_size=0.18", fc=fc, ec=ec, lw=1.2, zorder=2))


def pill(ax, x, y, s, color=BLUE):
    t(ax, x, y, f"  {s.upper()}  ", 9.5, "bold", color, va="center", zorder=4,
      bbox=dict(boxstyle="round,pad=0.35,rounding_size=0.6", fc="none", ec=color, lw=1.2))


def slide(pdf, n, draw, bg=BG, source=None):
    fig = plt.figure(figsize=(W, H))
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_xlim(0, W)
    ax.set_ylim(0, H)
    ax.axis("off")
    fig.patch.set_facecolor(bg)
    draw(ax)
    fg_dim = DIM if bg == BG else "#56636a"
    t(ax, 0.8, 8.3, "GAP RADAR", 11, "black", fg_dim, va="center")
    t(ax, 15.2, 8.3, f"{n:02d} / {TOTAL}", 10, "regular", fg_dim, va="center", ha="right")
    if source:
        t(ax, 0.8, 0.5, source, 9, "regular", fg_dim)
    pdf.savefig(fig, facecolor=bg)
    if os.environ.get("DECK_PREVIEW"):
        fig.savefig(Path(os.environ["DECK_PREVIEW"]) / f"slide{n:02d}.png", facecolor=bg, dpi=60)
    plt.close(fig)


with PdfPages(OUT) as pdf:
    # 1 Title
    def s1(ax):
        glow(ax, 12.2, 4.2, 7, BLUE, 0.28)
        radar(ax, 12.2, 4.2, 3.4)
        t(ax, 0.8, 5.6, "Gap Radar", 80, "black", va="center")
        t(ax, 0.85, 4.15, "Your postcode shouldn't decide\nwhen your cancer is found.", 26, "light", FG, va="top", linespacing=1.3)
        t(ax, 0.85, 1.4, "Team [names]   ·   Junction 2026   ·   AstraZeneca: Equal Care Across Finland", 12, "regular", DIM)
    slide(pdf, 1, s1)

    # 2 Hook: one in five
    def s2(ax):
        glow(ax, 3.5, 5.0, 7, RED, 0.22)
        t(ax, 0.8, 6.9, "1 in 5", 150, "black", RED, va="top")
        t(ax, 0.9, 3.0, "people with a positive bowel-screening test\nnever get the colonoscopy.", 30, "light", va="top", linespacing=1.25)
        # funnel: 16,501 positives -> 3,536 lost
        x0, wbar = 10.6, 4.6
        for i, (lab, val, col) in enumerate([("Positive test", 16501, FG), ("Colonoscopy", 12965, BLUE), ("Lost", 3536, RED)]):
            y = 6.3 - i * 1.15
            ax.add_patch(FancyBboxPatch((x0, y), wbar * val / 16501, 0.42, boxstyle="round,pad=0,rounding_size=0.1", fc=col, lw=0, zorder=3))
            t(ax, x0, y + 0.62, f"{lab}  {val:,}", 12, "bold", DIM)
    slide(pdf, 2, s2, source="Finnish Cancer Registry, bowel screening 2023: 3,536 of 16,501 positives (21.4%) had no colonoscopy in the programme.")

    # 3 Who is lost
    def s3(ax):
        glow(ax, 4.0, 4.5, 7, RED, 0.18)
        t(ax, 0.8, 6.9, "28%", 150, "black", FG, va="top")
        t(ax, 0.9, 3.0, "of one cohort's bowel cancers were in\npeople the programme had already lost.", 30, "light", va="top", linespacing=1.25)
        t(ax, 10.6, 6.2, "53–61%", 54, "black", RED, va="top")
        t(ax, 10.65, 4.85, "screening participation for\nother mother tongues", 15, "regular", FG, va="top", linespacing=1.3)
        t(ax, 10.6, 3.6, "75–83%", 54, "black", DIM, va="top")
        t(ax, 10.65, 2.25, "for everyone else", 15, "regular", DIM, va="top")
    slide(pdf, 3, s3, source="Finnish Cancer Registry: 2022 cohort; participation by mother tongue, all three programmes, 2024.")

    # 4 Why it persists
    def s4(ax):
        t(ax, 0.8, 7.3, "21 COUNTIES. NO SHARED VIEW OF WHERE PEOPLE FALL OFF.", 14, "bold", BLUE)
        t(ax, 0.75, 6.4, "“", 160, "black", LINE, va="top")
        t(ax, 2.0, 5.9, "Regional comparison is done\nonly occasionally, with crude\nand fragmented measures.", 46, "bold", INK, va="top", linespacing=1.15)
        t(ax, 2.05, 1.9, "National Cancer Strategy 2026–2035, p. 35", 15, "regular", "#56636a")
    slide(pdf, 4, s4, bg=PAPER)

    # 5 Solution: the loop
    def s5(ax):
        glow(ax, 8, 4.0, 7.5, BLUE, 0.2)
        t(ax, 8, 7.7, "A learning loop, not another dashboard.", 34, "black", ha="center", va="center")
        steps = ["Detect", "Understand", "Simulate", "Implement", "Learn"]
        cx, cy, R = 8, 3.5, 2.45
        ax.add_patch(Circle((cx, cy), R, fill=False, ec=LINE, lw=2, zorder=1))
        for i, s in enumerate(steps):
            a = np.radians(90 - i * 72)
            x, y = cx + R * np.cos(a), cy + R * np.sin(a)
            ax.add_patch(Circle((x, y), 0.62, fc=BG2, ec=BLUE if i else RED, lw=2.2, zorder=3))
            t(ax, x, y, str(i + 1), 22, "black", BLUE if i else RED, ha="center", va="center", zorder=4)
            dx = 1.0 if np.cos(a) > 0.2 else (-1.0 if np.cos(a) < -0.2 else 0)
            t(ax, x + dx, y + (0.95 if i == 0 else 0), s, 19, "bold", ha="left" if dx > 0 else ("right" if dx < 0 else "center"),
              va="center", zorder=4)
        t(ax, cx, cy, "every\ncounty", 16, "light", DIM, ha="center", va="center", linespacing=1.2)
    slide(pdf, 5, s5)

    # 6 Detect
    def s6(ax):
        glow(ax, 11.5, 4.3, 6, BLUE, 0.2)
        pill(ax, 0.85, 7.3, "1 · Detect")
        t(ax, 0.8, 6.6, "See where Finland\nloses people.", 46, "black", va="top", linespacing=1.1)
        t(ax, 0.85, 3.6, "Then flag the counties getting\nworse, before the gap is big.", 20, "light", DIM, va="top", linespacing=1.35)
        card(ax, 8.6, 1.4, 6.6, 5.6)
        t(ax, 9.0, 6.45, "Finland · bowel screening", 12, "bold", DIM)
        bars = [(0.83, BLUE), (0.80, BLUE), (0.78, BLUE), (0.74, DIM), (0.70, DIM), (0.66, RED), (0.61, RED)]
        for i, (v, col) in enumerate(bars):
            y = 5.7 - i * 0.6
            ax.add_patch(FancyBboxPatch((9.0, y), 5.6 * v, 0.3, boxstyle="round,pad=0,rounding_size=0.08", fc=col, lw=0, zorder=3, alpha=0.9))
        t(ax, 9.0, 1.7, "Illustrative shape; the app ranks all 21 counties.", 9.5, "regular", DIM)
    slide(pdf, 6, s6)

    # 7 Understand
    def s7(ax):
        pill(ax, 0.85, 7.3, "2 · Understand")
        t(ax, 0.8, 6.6, "Your county,\nin two minutes.", 46, "black", va="top", linespacing=1.1)
        rows = [("Gap", "69.6% vs 80% target"), ("Deaths", "181.6 vs 172.4 /100k"), ("Lost at", "after a positive test"),
                ("Missed", "Russian · Somali · Arabic")]
        for i, (k, v) in enumerate(rows):
            y = 6.2 - i * 1.15
            t(ax, 8.8, y, k.upper(), 11, "bold", DIM, va="top")
            t(ax, 8.8, y - 0.38, v, 22, "bold", RED if i < 2 else FG, va="top")
        t(ax, 0.85, 3.6, "The gap, the step where people\nfall off, and who is missed.", 20, "light", DIM, va="top", linespacing=1.35)
    slide(pdf, 7, s7, source="Example: Helsinki. Sotkanet, Finnish Cancer Registry (women's cancer mortality 2020–2024), Statistics Finland.")

    # 8 Simulate
    def s8(ax):
        glow(ax, 4.0, 4.6, 6.5, BLUE, 0.25)
        pill(ax, 0.85, 7.3, "3 · Simulate")
        t(ax, 0.8, 6.6, "€1,787", 120, "black", va="top")
        t(ax, 0.9, 3.75, "per cancer or advanced precursor found,\nif a nurse calls every positive.", 26, "light", va="top", linespacing=1.3)
        card(ax, 11.0, 1.6, 4.2, 4.9)
        t(ax, 11.4, 6.0, "STRESS TEST", 11, "bold", DIM)
        t(ax, 11.4, 5.5, "Capacity\n−20%", 34, "black", RED, va="top", linespacing=1.05)
        t(ax, 11.4, 3.3, "See what goes unfound\nbefore it happens.", 13, "regular", FG, va="top", linespacing=1.35)
    slide(pdf, 8, s8, source="Helsinki: 209 more colonoscopies a year for €174,026. Prices: Pohjois-Pohjanmaa service price list 2025.")

    # 9 Implement + Learn
    def s9(ax):
        pill(ax, 0.85, 7.3, "4 · Implement   5 · Learn")
        t(ax, 0.8, 6.6, "From decision\nto Monday morning.", 46, "black", va="top", linespacing=1.1)
        items = [("Board memo", "in Finnish, one click"), ("Invitations", "Somali · Arabic · Russian,\nback-translated"),
                 ("Monthly measures", "three delays nobody\npublishes yet")]
        for i, (k, v) in enumerate(items):
            x = 0.8 + i * 5.0
            card(ax, x, 1.2, 4.6, 2.6)
            t(ax, x + 0.35, 3.3, k, 21, "bold", va="top")
            t(ax, x + 0.35, 2.6, v, 13.5, "regular", DIM, va="top", linespacing=1.35)
    slide(pdf, 9, s9)

    # 10 Trust
    def s10(ax):
        glow(ax, 8, 4.5, 6, BLUE, 0.15)
        t(ax, 8, 5.7, "0", 170, "black", BLUE, ha="center", va="center")
        t(ax, 8, 3.25, "numbers made up by AI.", 34, "bold", ha="center", va="center")
        t(ax, 8, 2.25, "Tested code computes every figure. AI only writes, and a validator rejects any number not in the data.",
          15, "light", DIM, ha="center", va="center")
        for i, (lab, col) in enumerate([("Observed", FG), ("Inferred", DIM), ("Simulated", BLUE), ("Expert", DIM)]):
            pill(ax, 4.9 + i * 1.75, 1.35, lab, col)
    slide(pdf, 10, s10, source="Public aggregate data only: THL Sotkanet, Finnish Cancer Registry, Statistics Finland. No patient data.")

    # 11 Impact
    def s11(ax):
        glow(ax, 8, 4.2, 8, BLUE, 0.22)
        t(ax, 0.8, 7.3, "IF EVERY COUNTY MATCHED THE BEST QUARTER", 14, "bold", BLUE)
        for i, (big, small) in enumerate([("8,585", "more test returns\na year"), ("817", "more colonoscopies\na year"),
                                          ("~69", "cancers found,\nplus 474 precursors")]):
            x = 0.8 + i * 5.0
            t(ax, x, 6.1, big, 84, "black", va="top")
            t(ax, x + 0.05, 3.5, small, 19, "light", DIM, va="top", linespacing=1.3)
        pill(ax, 0.85, 1.4, "Simulated", BLUE)
    slide(pdf, 11, s11, source="Bowel screening, Finland. Simulated from county figures; not a forecast.")

    # 12 Close
    def s12(ax):
        glow(ax, 12.2, 4.2, 7, BLUE, 0.28)
        radar(ax, 12.2, 4.2, 3.4, sweep=150, blips=((0.62, 70, BLUE), (0.35, 200, BLUE)))
        t(ax, 0.8, 6.9, "Next: one county,\none quarter,\none gap closed.", 46, "black", va="top", linespacing=1.12)
        t(ax, 0.85, 2.6, "Try it  [demo link]", 20, "bold", BLUE)
        t(ax, 0.85, 1.85, "github.com/rromppanen/junction26", 15, "regular", DIM)
    slide(pdf, 12, s12, source="Honest limits: public aggregate data only; breast simulator stage and cost inputs are still placeholders.")

print(f"wrote {OUT}")
