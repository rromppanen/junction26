"""Builds docs/pitch/lapi-deck-mockup.pdf: a 12-slide 16:9 deck, Läpi's equal-access story, with matplotlib.

Run: python docs/pitch/make_deck.py   (DECK_PREVIEW=<dir> also writes PNG previews)
One idea per slide. Colours match the app (web/src/app/globals.css). Every figure comes from the Finnish Cancer
Registry or the national cancer strategy documents; the source is on the slide. Check against the app before presenting.
Uses Segoe UI where installed (Windows), else DejaVu Sans.
"""
import os
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import font_manager
from matplotlib.backends.backend_pdf import PdfPages
from matplotlib.patches import Circle, FancyBboxPatch

# The app's palette
PAPER, WHITE, INK, MUTED, RULE = "#f5f8f7", "#ffffff", "#12272e", "#56636a", "#cdd3d0"
BRAND, BRAND_DARK, BRAND_SOFT, BEHIND, BEHIND_SOFT = "#0f6e56", "#085041", "#e1f5ee", "#a34a08", "#f6e3d3"
W, H = 16, 9
OUT = Path(os.environ.get("DECK_OUT") or Path(__file__).with_name("lapi-deck-mockup.pdf"))
TOTAL = 12

FONT = {}
for key, file in {"black": "seguibl.ttf", "bold": "segoeuib.ttf", "light": "segoeuil.ttf", "regular": "segoeui.ttf"}.items():
    path = Path("C:/Windows/Fonts") / file
    FONT[key] = (font_manager.FontProperties(fname=str(path)) if path.exists()
                 else font_manager.FontProperties(family="DejaVu Sans", weight="bold" if key in ("black", "bold") else "normal"))


def t(ax, x, y, s, size, weight="regular", color=INK, **kw):
    fp = FONT[weight].copy()
    fp.set_size(size)
    return ax.text(x, y, s, fontproperties=fp, color=color, **kw)


def box(ax, x, y, w, h, fc=WHITE, ec=RULE, lw=1.2):
    ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0,rounding_size=0.2", fc=fc, ec=ec, lw=lw, zorder=2))


def bar(ax, x, y, w, h, color):
    ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0,rounding_size=0.08", fc=color, lw=0, zorder=3))


def kicker(ax, s, color=BRAND):
    t(ax, 0.9, 7.55, s.upper(), 13, "bold", color)


def slide(pdf, n, draw, bg=PAPER, source=None):
    fig = plt.figure(figsize=(W, H))
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_xlim(0, W)
    ax.set_ylim(0, H)
    ax.axis("off")
    fig.patch.set_facecolor(bg)
    draw(ax)
    dark = bg in (BRAND, BRAND_DARK, INK)
    dim = "#bfe3d6" if dark else MUTED
    t(ax, 0.9, 8.35, "Läpi", 13, "black", WHITE if dark else BRAND, va="center")
    t(ax, 15.1, 8.35, f"{n} / {TOTAL}", 10, "regular", dim, va="center", ha="right")
    if source:
        t(ax, 0.9, 0.45, source, 9.5, "regular", dim)
    pdf.savefig(fig, facecolor=bg)
    if os.environ.get("DECK_PREVIEW"):
        fig.savefig(Path(os.environ["DECK_PREVIEW"]) / f"slide{n:02d}.png", facecolor=bg, dpi=60)
    plt.close(fig)


with PdfPages(OUT) as pdf:
    # 1 Title
    def s1(ax):
        t(ax, 0.9, 5.9, "Läpi", 110, "black", WHITE, va="center")
        t(ax, 0.95, 4.0, "Cancer screening that reaches everyone.", 36, "light", WHITE, va="center")
        t(ax, 0.95, 1.3, "Team [names]   ·   Junction 2026   ·   AstraZeneca: Equal Care Across Finland", 13, "regular", "#bfe3d6")
        # the mark: found, a gap, followed through
        for x, r, fill in [(12.2, 0.55, True), (13.2, 0.14, True), (13.7, 0.14, True), (14.6, 0.45, False)]:
            ax.add_patch(Circle((x, 5.9), r, fc=WHITE if fill else "none", ec=WHITE, lw=6, zorder=3))
    slide(pdf, 1, s1, bg=BRAND)

    # 2 The promise
    def s2(ax):
        kicker(ax, "Finland's promise")
        t(ax, 0.9, 6.8, "80%", 170, "black", BRAND, va="top")
        t(ax, 0.95, 2.9, "of people taking part in every cancer screening,\nin every county, by 2035.", 32, "light", va="top", linespacing=1.3)
    slide(pdf, 2, s2, source="National Cancer Strategy 2026–2035, headline targets, p. 5.")

    # 3 Who is left out
    def s3(ax):
        kicker(ax, "Who is left out today", BEHIND)
        t(ax, 0.9, 6.9, "Bowel screening: who sends back the test", 30, "bold", va="top")
        rows = [("Everyone invited", 74, INK), ("Other mother tongues", 53, BEHIND),
                ("Women", 78, INK), ("Men", 69, BEHIND)]
        x0, span = 5.4, 9.0
        for i, (lab, v, col) in enumerate(rows):
            y = 5.3 - i * 1.05 - (0.35 if i >= 2 else 0)
            t(ax, 0.95, y + 0.22, lab, 17, "regular", MUTED, va="center")
            bar(ax, x0, y, span * v / 100, 0.45, col)
            t(ax, x0 + span * v / 100 - 0.15, y + 0.22, f"{v}%", 17, "bold", WHITE, va="center", ha="right", zorder=5)
        tx = x0 + span * 0.8
        ax.plot([tx] * 2, [0.95, 5.95], color=BRAND, lw=2, ls=(0, (4, 3)), zorder=4)
        t(ax, tx + 0.1, 6.05, "target 80%", 13, "bold", BRAND)
    slide(pdf, 3, s3, source="Finnish Cancer Registry, colorectal screening 2024: participation of all invited 73.5%, by sex, and by mother tongue.")

    # 4 And even when found
    def s4(ax):
        kicker(ax, "Even when the test finds something", BEHIND)
        t(ax, 0.9, 6.8, "1 in 5", 170, "black", BEHIND, va="top")
        t(ax, 0.95, 2.9, "people with a positive test had\nno follow-up colonoscopy.", 32, "light", va="top", linespacing=1.3)
        box(ax, 10.3, 2.6, 4.9, 3.9)
        t(ax, 10.7, 6.0, "Depends on where you live", 13, "bold", MUTED)
        t(ax, 10.7, 5.2, "31.5%", 40, "black", BEHIND, va="top")
        t(ax, 10.7, 4.25, "Helsinki", 14, "regular", MUTED, va="top")
        t(ax, 13.1, 5.2, "10.3%", 40, "black", BRAND, va="top")
        t(ax, 13.1, 4.25, "Etelä-Savo", 14, "regular", MUTED, va="top")
    slide(pdf, 4, s4, source="Finnish Cancer Registry, 2023: 3,536 of 16,501 positive tests (21.4%). Some people were examined outside the programme.")

    # 5 Why
    def s5(ax):
        kicker(ax, "Why")
        t(ax, 0.9, 6.9, "Screening is built for people\nwho already find it easy.", 50, "black", va="top", linespacing=1.1)
        items = [("A letter in Finnish", "or Swedish"), ("A post office", "for the sample"), ("Time off", "for the follow-up"),
                 ("Nobody", "noticing who is missing")]
        for i, (a, b) in enumerate(items):
            x = 0.9 + i * 3.6
            box(ax, x, 1.3, 3.3, 2.0)
            t(ax, x + 0.3, 2.85, a, 19, "bold", BEHIND if i == 3 else INK, va="top")
            t(ax, x + 0.3, 2.15, b, 14, "regular", MUTED, va="top")
    slide(pdf, 5, s5)

    # 6 The idea
    def s6(ax):
        t(ax, 0.9, 6.2, "The test comes to you.\nSomeone follows it\nall the way.", 64, "black", WHITE, va="top", linespacing=1.08)
    slide(pdf, 6, s6, bg=BRAND)

    # 7 For the person
    def s7(ax):
        kicker(ax, "For the person")
        t(ax, 0.9, 6.9, "Easy at every step.", 50, "black", va="top")
        steps = [("1", "Test at home", "in your own language"), ("2", "Pickup", "from your door"),
                 ("3", "Result", "on your phone"), ("4", "Book", "the follow-up in one tap")]
        for i, (n, a, b) in enumerate(steps):
            x = 0.9 + i * 3.6
            ax.add_patch(Circle((x + 0.45, 4.6), 0.42, fc=BRAND, lw=0, zorder=3))
            t(ax, x + 0.45, 4.6, n, 20, "black", WHITE, ha="center", va="center", zorder=4)
            t(ax, x, 3.7, a, 24, "bold", va="top")
            t(ax, x, 2.95, b, 16, "regular", MUTED, va="top")
    slide(pdf, 7, s7, source="Demo pickup is simulated. HUS: ages 56–74, every two years; no preparation; results in about a month.")

    # 8 For the nurse
    def s8(ax):
        kicker(ax, "For the screening nurse")
        t(ax, 0.9, 6.9, "Nobody waits unseen.", 50, "black", va="top")
        t(ax, 0.95, 5.6, "Every sample on one board.\nThe stuck ones rise to the top.", 22, "light", MUTED, va="top", linespacing=1.4)
        flags = [("No sample after 2 weeks", "Send a reminder"), ("Positive, no colonoscopy after 1 week", "Call, then book")]
        for i, (a, b) in enumerate(flags):
            y = 3.0 - i * 1.5
            box(ax, 0.9, y - 0.2, 14.2, 1.2, fc=BEHIND_SOFT, ec=BEHIND_SOFT)
            t(ax, 1.3, y + 0.4, a, 20, "bold", BEHIND, va="center")
            t(ax, 14.7, y + 0.4, b + "  →", 20, "bold", INK, va="center", ha="right")
    slide(pdf, 8, s8, source="Flag times are demo settings, not official target times.")

    # 9 Equal access in practice
    def s9(ax):
        kicker(ax, "Equal access, in practice")
        t(ax, 0.9, 6.9, "Each barrier, removed.", 50, "black", va="top")
        rows = [("Language", "The app and the follow-up in your language, an interpreter offered"),
                ("Distance", "The sample is collected from your door"),
                ("Work", "You choose the pickup and follow-up time"),
                ("Getting lost", "A nurse sees every sample until the colonoscopy is done")]
        for i, (a, b) in enumerate(rows):
            y = 5.3 - i * 1.15
            t(ax, 0.95, y, a, 22, "bold", BRAND, va="top")
            t(ax, 4.4, y, b, 20, "regular", INK, va="top")
            ax.plot([0.9, 15.1], [y - 0.75, y - 0.75], color=RULE, lw=1)
    slide(pdf, 9, s9, source="Some people live over 400 km from a central hospital (implementation roadmap 2026–2031, p. 13).")

    # 10 The bigger vision
    def s10(ax):
        kicker(ax, "The bigger picture", "#bfe3d6")
        t(ax, 0.9, 6.9, "Today bowel screening.\nTomorrow every screening\nthat can start at home.", 50, "black", WHITE, va="top", linespacing=1.1)
        t(ax, 0.95, 2.6, "One way for every county to see who it is not reaching,\nand to reach them.", 24, "light", WHITE, va="top", linespacing=1.35)
    slide(pdf, 10, s10, bg=BRAND_DARK)

    # 11 Pilot
    def s11(ax):
        kicker(ax, "Next: one county, one quarter")
        t(ax, 0.9, 6.9, "We measure before we claim.", 50, "black", va="top")
        cols = [("Who takes part", "by language and sex,\nagainst 80%"), ("Who is followed up", "positives without a\ncolonoscopy, today 21.4%"),
                ("How fast", "days from positive test\nto colonoscopy")]
        for i, (a, b) in enumerate(cols):
            x = 0.9 + i * 4.85
            box(ax, x, 1.5, 4.5, 3.6)
            t(ax, x + 0.4, 4.55, a, 22, "bold", BRAND, va="top")
            t(ax, x + 0.4, 3.6, b, 17, "regular", INK, va="top", linespacing=1.35)
    slide(pdf, 11, s11, source="Baselines: Finnish Cancer Registry. A working prototype today; people, pickup, lab and bookings are simulated.")

    # 12 Close
    def s12(ax):
        t(ax, 0.9, 6.6, "Your language, your job\nor your postcode\nshouldn't decide\nwhen your cancer is found.", 50, "black", WHITE, va="top", linespacing=1.1)
        t(ax, 0.95, 1.6, "Try it  [demo link]    ·    github.com/rromppanen/junction26", 17, "bold", "#bfe3d6")
    slide(pdf, 12, s12, bg=BRAND)

print(f"wrote {OUT}")
