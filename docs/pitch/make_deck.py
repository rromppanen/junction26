"""Builds docs/pitch/lapi-deck-mockup.pdf: a 12-slide 16:9 deck for the home-test and nurse-board flow, with matplotlib.

Run: python docs/pitch/make_deck.py   (DECK_PREVIEW=<dir> also writes PNG previews)
One idea per slide, under ~30 words. Every figure is one the app shows (Finnish Cancer Registry, HUS screening page);
check the numbers against the live app before presenting. Screens are drawn, not
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
RED, BLUE, PAPER, INK = "#e39a4a", "#5b9cc6", "#f5f8f7", "#12272e"  # RED is the amber "behind" colour, matching the app
W, H = 16, 9
OUT = Path(os.environ.get("DECK_OUT") or Path(__file__).with_name("lapi-deck-mockup.pdf"))
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
    t(ax, 0.8, 8.3, "LÄPI", 11, "black", fg_dim, va="center")
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
        t(ax, 0.8, 5.6, "Läpi", 80, "black", va="center")
        t(ax, 0.85, 4.15, "Found once.\nNever lost on the way to care.", 26, "light", FG, va="top", linespacing=1.3)
        t(ax, 0.85, 1.4, "Team [names]   ·   Junction 2026   ·   AstraZeneca: Equal Care Across Finland", 12, "regular", DIM)
    slide(pdf, 1, s1)

    # 2 Hook: one in five
    def s2(ax):
        glow(ax, 3.5, 5.0, 7, RED, 0.22)
        t(ax, 0.8, 6.9, "1 in 5", 150, "black", RED, va="top")
        t(ax, 0.9, 3.0, "people with a positive bowel-screening test\nhad no colonoscopy in the programme.", 30, "light", va="top", linespacing=1.25)
        x0, wbar = 10.6, 4.6
        for i, (lab, val, col) in enumerate([("Positive test", 16501, FG), ("Colonoscopy", 12965, BLUE), ("No colonoscopy", 3536, RED)]):
            y = 6.3 - i * 1.15
            ax.add_patch(FancyBboxPatch((x0, y), wbar * val / 16501, 0.42, boxstyle="round,pad=0,rounding_size=0.1", fc=col, lw=0, zorder=3))
            t(ax, x0, y + 0.62, f"{lab}  {val:,}", 12, "bold", DIM)
    slide(pdf, 2, s2, source="Finnish Cancer Registry, bowel screening 2023: 3,536 of 16,501 positives (21.4%). Some were examined outside the programme.")

    # 3 Already found, then lost
    def s3(ax):
        glow(ax, 4.0, 4.5, 7, RED, 0.18)
        t(ax, 0.8, 7.3, "ALREADY FOUND. THEN LOST.", 14, "bold", RED)
        t(ax, 0.8, 6.6, "87", 150, "black", FG, va="top")
        t(ax, 0.9, 3.0, "bowel cancers in one round were in people\nwith a positive test and no colonoscopy.", 30, "light", va="top", linespacing=1.25)
        t(ax, 10.6, 6.2, "3.7 mo", 54, "black", RED, va="top")
        t(ax, 10.65, 4.85, "median wait, positive test to\ncolonoscopy, Päijät-Häme", 15, "regular", FG, va="top", linespacing=1.3)
        t(ax, 10.6, 3.6, "1.9 mo", 54, "black", DIM, va="top")
        t(ax, 10.65, 2.25, "Finland", 15, "regular", DIM, va="top")
    slide(pdf, 3, s3, source="Finnish Cancer Registry: 2022 screening round linked to the Cancer Registry; waits 2024, read from the Registry's chart.")

    # 4 Today
    def s4(ax):
        t(ax, 0.8, 7.3, "TODAY", 14, "bold", BLUE)
        t(ax, 0.8, 6.6, "A letter, an envelope,\na wait, a letter.", 46, "bold", INK, va="top", linespacing=1.15)
        steps = ["Invitation\nby post", "Sample\nby post", "Result\nby letter", "Booking\n?"]
        for i, s_ in enumerate(steps):
            x = 0.8 + i * 3.7
            card(ax, x, 1.4, 3.3, 2.0, fc="white", ec="#cdd3d0")
            t(ax, x + 0.3, 2.95, s_, 18, "bold", RED if i == 3 else INK, va="top", linespacing=1.2)
        t(ax, 0.8, 0.9, "Nobody sees the whole journey of one sample, so nobody sees who is stuck.", 15, "regular", "#56636a")
    slide(pdf, 4, s4, bg=PAPER)

    # 5 Solution: two people, one journey
    def s5(ax):
        glow(ax, 8, 4.0, 7.5, BLUE, 0.2)
        t(ax, 8, 7.4, "One journey, two screens.", 38, "black", ha="center", va="center")
        for i, (who, what) in enumerate([("The person", "takes the test at home,\nbooks a pickup, sees the result\nand books the colonoscopy"),
                                        ("The screening nurse", "sees every sample on one board,\nwith the stuck ones flagged,\nand acts on them")]):
            x = 1.4 + i * 7.0
            card(ax, x, 1.6, 6.2, 4.6)
            t(ax, x + 0.4, 5.6, who, 26, "bold", BLUE if i else FG, va="top")
            t(ax, x + 0.4, 4.4, what, 17, "light", FG, va="top", linespacing=1.4)
        t(ax, 8, 1.0, "Live: what happens on the phone moves the card on the board.", 14, "regular", DIM, ha="center")
    slide(pdf, 5, s5)

    # 6 Phone
    def s6(ax):
        glow(ax, 11.5, 4.3, 6, BLUE, 0.2)
        pill(ax, 0.85, 7.3, "The person")
        t(ax, 0.8, 6.6, "From home\nto the lab.", 46, "black", va="top", linespacing=1.1)
        t(ax, 0.85, 3.6, "Finnish, Swedish or English.\nA pickup from the door.\nThe result, and a colonoscopy\ntime, on the same phone.", 20, "light", DIM, va="top", linespacing=1.35)
        card(ax, 10.2, 0.9, 3.6, 6.6, fc=BG2)
        for i, (s_, col) in enumerate([("Kit", BLUE), ("Sample", BLUE), ("Pickup", BLUE), ("Lab", BLUE), ("Result: book", RED)]):
            y = 6.5 - i * 1.1
            ax.add_patch(Circle((10.75, y), 0.16, color=col, zorder=3))
            t(ax, 11.1, y, s_, 15, "bold", FG, va="center")
    slide(pdf, 6, s6, source="Real facts only from the HUS screening page: ages 56–74 every two years, no preparation, results in about a month.")

    # 7 Nurse board
    def s7(ax):
        pill(ax, 0.85, 7.3, "The screening nurse")
        t(ax, 0.8, 6.6, "Nobody waits\nunseen.", 46, "black", va="top", linespacing=1.1)
        rows = [("Positive, no colonoscopy", "flag after 7 days"), ("No sample", "flag after 14 days"),
                ("Act", "remind · call note · book")]
        for i, (k, v) in enumerate(rows):
            y = 6.2 - i * 1.5
            t(ax, 8.8, y, k.upper(), 11, "bold", DIM, va="top")
            t(ax, 8.8, y - 0.42, v, 24, "bold", RED if i < 2 else FG, va="top")
        t(ax, 0.85, 3.6, "Every sample on one board,\nin pathway order, live.", 20, "light", DIM, va="top", linespacing=1.35)
    slide(pdf, 7, s7, source="Flag limits are demo settings, not official target times.")

    # 8 Owner until done
    def s8(ax):
        glow(ax, 4.0, 4.6, 6.5, BLUE, 0.25)
        t(ax, 0.8, 6.9, "Booked\n≠ done.", 90, "black", va="top", linespacing=1.0)
        t(ax, 0.9, 2.6, "Every positive has an owner and a next step\nuntil the colonoscopy has happened.", 24, "light", va="top", linespacing=1.3)
    slide(pdf, 8, s8)

    # 9 Fits what exists
    def s9(ax):
        pill(ax, 0.85, 7.3, "Implementable")
        t(ax, 0.8, 6.6, "Fits the screening\nthat already runs.", 46, "black", va="top", linespacing=1.1)
        items = [("Existing role", "the county's screening\nnurse, not a new team"), ("Existing programme", "HUS and the counties\nalready invite and test"),
                 ("Goal 3.1 · action 3.1.2", "owners and access times\nfor each pathway step")]
        for i, (k, v) in enumerate(items):
            x = 0.8 + i * 5.0
            card(ax, x, 1.2, 4.6, 2.6)
            t(ax, x + 0.35, 3.3, k, 19, "bold", va="top")
            t(ax, x + 0.35, 2.6, v, 13.5, "regular", DIM, va="top", linespacing=1.35)
    slide(pdf, 9, s9, source="National Cancer Strategy 2026–2035 Goal 3.1, pp. 33–34; Implementation roadmap 2026–2031 action 3.1.2, pp. 56–57.")

    # 10 Honest
    def s10(ax):
        glow(ax, 8, 4.5, 6, BLUE, 0.15)
        t(ax, 8, 6.4, "What is real, what is simulated.", 34, "bold", ha="center", va="center")
        for i, (lab, items_, col) in enumerate([("Real", "Registry figures\nHUS screening facts\nThe working app", FG),
                                                 ("Simulated", "People\nRobot pickup\nLab and bookings", BLUE)]):
            x = 3.2 + i * 5.2
            pill(ax, x, 5.0, lab, col)
            t(ax, x, 4.3, items_, 20, "light", FG, va="top", linespacing=1.5)
    slide(pdf, 10, s10, source="No patient data. Public aggregate data only.")

    # 11 Pilot
    def s11(ax):
        glow(ax, 8, 4.2, 8, BLUE, 0.22)
        t(ax, 0.8, 7.3, "PILOT: ONE COUNTY, ONE QUARTER", 14, "bold", BLUE)
        for i, (big, small) in enumerate([("21.4%", "positives without a\ncolonoscopy: the baseline"), ("Days", "from positive test\nto colonoscopy"),
                                          ("Why", "the reason each stuck\nsample stayed stuck")]):
            x = 0.8 + i * 5.0
            t(ax, x, 6.1, big, 72, "black", va="top")
            t(ax, x + 0.05, 3.7, small, 19, "light", DIM, va="top", linespacing=1.3)
        t(ax, 0.85, 1.5, "We measure against the Registry baseline before claiming any effect.", 15, "regular", DIM)
    slide(pdf, 11, s11, source="Baseline: Finnish Cancer Registry, Finland 2023.")

    # 12 Close
    def s12(ax):
        glow(ax, 12.2, 4.2, 7, BLUE, 0.28)
        radar(ax, 12.2, 4.2, 3.4, sweep=150, blips=((0.62, 70, BLUE), (0.35, 200, BLUE)))
        t(ax, 0.8, 6.9, "Found once.\nNever lost.", 52, "black", va="top", linespacing=1.12)
        t(ax, 0.85, 2.6, "Try it  [demo link]", 20, "bold", BLUE)
        t(ax, 0.85, 1.85, "github.com/rromppanen/junction26", 15, "regular", DIM)
    slide(pdf, 12, s12, source="Demo: invented people; the robot, lab and bookings are simulated.")

print(f"wrote {OUT}")
