"""Builds docs/pitch/gap-radar-deck-mockup.pdf: a 10-slide 16:9 mockup deck with matplotlib (no extra installs).

Run: python docs/pitch/make_deck.py
Every figure is one the app shows (Sotkanet, Cancer Registry, Statistics Finland, Pohde price list); check the
numbers against the live app before presenting. Screens are drawn mockups, not screenshots.
"""
import os
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages
from matplotlib.patches import FancyBboxPatch, Rectangle

PAPER, SURFACE, INK, MUTED, RULE = "#eef0ec", "#f8f9f6", "#172226", "#56636a", "#cdd3d0"
BEHIND, AHEAD, PAR, PAR_SOFT = "#b0412e", "#2a5c7d", "#7a868b", "#e1e5e3"
W, H = 16, 9
OUT = Path(__file__).with_name("gap-radar-deck-mockup.pdf")
plt.rcParams.update({"font.family": "DejaVu Sans", "text.color": INK})


def slide(pdf, n, kicker, title, body):
    fig = plt.figure(figsize=(W, H))
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_xlim(0, W)
    ax.set_ylim(0, H)
    ax.axis("off")
    fig.patch.set_facecolor(PAPER)
    # wordmark: the pathway as three stops
    ax.add_patch(plt.Circle((0.75, 8.35), 0.13, color=INK))
    ax.add_patch(plt.Circle((1.02, 8.35), 0.04, color=PAR))
    ax.add_patch(plt.Circle((1.2, 8.35), 0.04, color=PAR))
    ax.add_patch(plt.Circle((1.5, 8.35), 0.1, fill=False, ec=INK, lw=2.5))
    ax.text(1.75, 8.35, "Gap Radar", va="center", fontsize=15, weight="bold")
    ax.text(15.3, 8.35, f"{n}/10", va="center", ha="right", fontsize=11, color=MUTED)
    if kicker:
        ax.text(0.75, 7.55, kicker.upper(), fontsize=12, color=MUTED, weight="bold")
    if title:
        ax.text(0.75, 7.05, title, fontsize=30, weight="bold", va="top", wrap=True)
    body(ax)
    ax.plot([0.75, 15.25], [0.55, 0.55], color=RULE, lw=1)
    ax.text(0.75, 0.3, "Junction 2026 · AstraZeneca: Equal Care Across Finland · public aggregate data only", fontsize=9, color=MUTED)
    pdf.savefig(fig, facecolor=PAPER)
    if os.environ.get("DECK_PREVIEW"):
        fig.savefig(Path(os.environ["DECK_PREVIEW"]) / f"slide{n:02d}.png", facecolor=PAPER, dpi=60)
    plt.close(fig)


def stat(ax, x, y, big, small, color=INK, w=4.3):
    ax.text(x, y, big, fontsize=46, weight="bold", color=color, va="top")
    ax.text(x, y - 1.15, small, fontsize=13, va="top", color=INK, wrap=True)


def card(ax, x, y, w, h, fill=SURFACE, ec=RULE):
    ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0,rounding_size=0.08", fc=fill, ec=ec, lw=1.2))


def tag(ax, x, y, text, kind="observed"):
    style = {"observed": (PAPER, INK, INK), "simulated": (INK, PAPER, INK), "inferred": (PAPER, MUTED, PAR)}[kind]
    ax.text(x, y, f" {text.upper()} ", fontsize=8.5, weight="bold", color=style[1], va="center",
            bbox=dict(boxstyle="round,pad=0.25", fc=style[0], ec=style[2], lw=1))


def wrap(text, n):
    words, lines, cur = text.split(), [], ""
    for w_ in words:
        if len(cur) + len(w_) + 1 > n:
            lines.append(cur)
            cur = w_
        else:
            cur = f"{cur} {w_}".strip()
    return "\n".join(lines + [cur])


with PdfPages(OUT) as pdf:
    # 1 Title
    def s1(ax):
        ax.text(0.75, 6.2, "Find where cancer care breaks.\nFix it, county by county.", fontsize=44, weight="bold", va="top")
        ax.text(0.75, 3.45, wrap("A learning loop for Finland's 21 wellbeing services counties: detect where people fall off "
                                 "the cancer pathway, simulate the options and their cost, act with a board memo, and learn "
                                 "from what moves.", 80), fontsize=17, color=MUTED, va="top")
        ax.text(0.75, 1.3, "Team: [names]   ·   Demo: [link]   ·   github.com/rromppanen/junction26", fontsize=13, color=MUTED)
    slide(pdf, 1, "", "", s1)

    # 2 Problem
    def s2(ax):
        stat(ax, 0.75, 5.9, "21.4%", wrap("of positive bowel-screening tests had no colonoscopy in the programme: 3,536 of 16,501 (2023)", 38), BEHIND)
        stat(ax, 5.85, 5.9, "28%", wrap("of the 2022 cohort's bowel cancers were in people the programme lost", 38), BEHIND)
        stat(ax, 10.95, 5.9, "53–61%", wrap("screening participation for other mother tongues, against 75–83% for everyone else (2024)", 38), BEHIND)
        tag(ax, 0.8, 2.05, "Observed")
        ax.text(2.1, 2.05, "Finnish Cancer Registry screening statistics", fontsize=11, color=MUTED, va="center")
        ax.text(0.75, 1.3, "Regional comparison is done \"only occasionally, with crude and fragmented measures\" (National Cancer Strategy 2026–2035, p. 35).",
                fontsize=13, color=INK)
    slide(pdf, 2, "The problem", "One in five positive tests never reaches a colonoscopy", s2)

    # 3 Learning loop
    def s3(ax):
        steps = [("1  Detect", "Where gaps are,\nand which are growing"), ("2  Understand", "The step where\npeople fall off"),
                 ("3  Simulate", "Options, cost,\nstress test"), ("4  Implement", "Board memo, invitations\nin other languages"),
                 ("5  Learn", "Measure monthly,\nlearn from peers")]
        for i, (t, d) in enumerate(steps):
            x = 0.75 + i * 2.95
            card(ax, x, 3.0, 2.65, 2.6, fill=SURFACE)
            ax.text(x + 0.25, 5.1, t, fontsize=17, weight="bold", va="top")
            ax.text(x + 0.25, 4.25, d, fontsize=12.5, color=MUTED, va="top", linespacing=1.4)
            if i < 4:
                ax.annotate("", xy=(x + 2.92, 4.3), xytext=(x + 2.68, 4.3), arrowprops=dict(arrowstyle="->", color=INK, lw=1.5))
        ax.annotate("", xy=(1.4, 2.85), xytext=(13.6, 2.85),
                    arrowprops=dict(arrowstyle="->", color=PAR, lw=1.5, connectionstyle="arc3,rad=0.12"))
        ax.text(7.5, 1.55, "Each loop makes the next one better: what worked in one county becomes the playbook for the next.",
                fontsize=13.5, ha="center", color=INK)
    slide(pdf, 3, "The solution", "A learning loop, not another dashboard", s3)

    # 4 Detect: national view mockup
    def s4(ax):
        card(ax, 0.75, 1.0, 9.0, 5.6, fill="white")
        ax.text(1.05, 6.25, "Finland's cancer pathway, nationally", fontsize=14, weight="bold")
        for i, (big, small) in enumerate([("21.4%", "positives unexamined"), ("27.9%", "of a cohort's cancers lost"), ("53–61%", "other mother tongues")]):
            ax.text(1.05 + i * 2.9, 5.6, big, fontsize=22, weight="bold", va="top")
            ax.text(1.05 + i * 2.9, 4.85, small, fontsize=10, color=MUTED, va="top")
        ax.plot([1.05, 9.45], [4.3, 4.3], color=RULE)
        ax.text(1.05, 4.05, "Early warning: screening falling over three years", fontsize=11, weight="bold", va="top")
        for i, (c, d) in enumerate([("Keski-Pohjanmaa", "Cervical  −5 points"), ("County B", "Breast  −2.1 points"), ("County C", "Bowel  −1.4 points")]):
            ax.text(1.05, 3.45 - i * 0.45, c, fontsize=10.5, va="top")
            ax.text(3.6, 3.45 - i * 0.45, d, fontsize=10.5, va="top", color=BEHIND)
        ax.text(1.05, 1.75, "Mockup: county B and C are placeholders; the app lists real counties.", fontsize=9, color=MUTED, style="italic")
        ax.text(10.3, 6.4, wrap("The start page shows where Finland as a whole loses people, and flags counties that are getting worse "
                                "before the gap is large.", 30), fontsize=14, va="top", linespacing=1.45)
        ax.text(10.3, 3.4, wrap("If every county matched the best quarter: about 8,585 more test returns and 817 more colonoscopies a year, "
                                "about 69 cancers and 474 advanced precursors found.", 30), fontsize=13, va="top", color=INK, linespacing=1.45)
        tag(ax, 10.35, 1.25, "Simulated")
    slide(pdf, 4, "1  Detect", "See the whole country, then your county", s4)

    # 5 Understand: county summary mockup
    def s5(ax):
        card(ax, 0.75, 1.0, 9.6, 5.6, fill=SURFACE)
        ax.text(1.05, 6.25, "IN TWO MINUTES · HELSINKI", fontsize=11, weight="bold", color=MUTED)
        rows = [("The gap", "Bowel screening: 69.6%, 10.4 points short of the 80% target"),
                ("Goal 3: deaths", "181.6 per 100,000 women, above Finland's 172.4"),
                ("Where it starts", "After a positive test: 209 more a year would get a colonoscopy"),
                ("Who is missed", "Largest foreign languages: Russian, Somali, Arabic"),
                ("Costed option", "Nurse calls every positive: €174,026 a year"),
                ("First action", "Invitations and reminders in other languages, Q1–Q2 2027")]
        for i, (k, v) in enumerate(rows):
            y = 5.55 - i * 0.72
            ax.text(1.05, y, k, fontsize=11.5, weight="bold", va="top")
            ax.text(3.35, y, v, fontsize=11.5, va="top")
        ax.text(10.9, 6.4, wrap("Every county page opens with the gap, the Goal 3 death rate, the step where people are lost, who is "
                                "missed, a costed option and the first action.", 28), fontsize=14, va="top", linespacing=1.45)
        ax.text(10.9, 3.2, wrap("Each sentence links to the working. Read in two minutes.", 28), fontsize=13, va="top", color=MUTED)
        tag(ax, 10.95, 1.35, "Observed")
        tag(ax, 12.35, 1.35, "Simulated")
    slide(pdf, 5, "2  Understand", "Which step is ours to fix?", s5)

    # 6 Simulate: decide board + stress test
    def s6(ax):
        card(ax, 0.75, 3.7, 7.0, 2.9, fill="white")
        ax.text(1.05, 6.25, "Decide · Follow up every positive", fontsize=13, weight="bold")
        for i, (k, v) in enumerate([("Target", "82.9% examined (best quarter)"), ("Extra colonoscopies", "209 a year"),
                                     ("Cost", "€174,026 a year"), ("Per finding", "€1,787 per cancer or advanced precursor")]):
            ax.text(1.05, 5.65 - i * 0.48, k, fontsize=11, color=MUTED, va="top")
            ax.text(3.6, 5.65 - i * 0.48, v, fontsize=11, va="top")
        card(ax, 8.25, 3.7, 7.0, 2.9, fill="white")
        ax.text(8.55, 6.25, "Stress test · capacity −20%", fontsize=13, weight="bold")
        ax.add_patch(Rectangle((8.55, 5.4), 6.3, 0.12, color=PAR_SOFT))
        ax.add_patch(Rectangle((8.55, 5.4), 1.26, 0.12, color=INK))
        ax.text(8.55, 5.05, wrap("Fewer positives get a colonoscopy, and the cancers and advanced precursors they would have "
                                 "found go unfound. Plan for it before it happens.", 52), fontsize=11, va="top", linespacing=1.4)
        ax.text(0.75, 2.95, wrap("Prices from Pohjois-Pohjanmaa's 2025 service price list (€614 per colonoscopy, €100 per nurse call). "
                                 "The board compares options; the county chooses. For breast screening, a simulator adds life-years, "
                                 "deaths averted and cost per life-year, with every assumption adjustable.", 120), fontsize=13, va="top", linespacing=1.45)
        tag(ax, 0.8, 1.2, "Simulated")
    slide(pdf, 6, "3  Simulate", "Compare options and what they cost", s6)

    # 7 Implement + Learn
    def s7(ax):
        card(ax, 0.75, 1.0, 4.6, 5.6, fill="white")
        ax.text(1.0, 6.25, "Hallitusmuistio", fontsize=14, weight="bold")
        for i, line in enumerate(["Tavoite 3: syöpäkuolleisuus", "Kustannusarvioitu vaihtoehto", "Ehdotetut toimenpiteet",
                                  "Mitä se vaatii?", "Lähteet · Rajoitukset"]):
            ax.text(1.0, 5.6 - i * 0.62, line, fontsize=11.5, va="top")
            ax.add_patch(Rectangle((1.0, 5.25 - i * 0.62), 3.9, 0.06, color=PAR_SOFT))
        card(ax, 5.75, 1.0, 4.6, 5.6, fill="white")
        ax.text(6.0, 6.25, "Reach them", fontsize=14, weight="bold")
        ax.text(6.0, 5.6, wrap("Invitation and SMS drafts in the area's largest languages, with a back-translation and "
                               "automatic checks.", 34), fontsize=11.5, va="top", linespacing=1.4)
        card(ax, 10.75, 1.0, 4.5, 5.6, fill="white")
        ax.text(11.0, 6.25, "Start measuring", fontsize=14, weight="bold")
        ax.text(11.0, 5.6, wrap("Three monthly delay measures nobody publishes yet (THL guidance 21/2016), as a CSV to fill in. "
                                "Closes the loop.", 32), fontsize=11.5, va="top", linespacing=1.4)
    slide(pdf, 7, "4  Implement · 5  Learn", "From decision to Monday morning", s7)

    # 8 Trust
    def s8(ax):
        items = [("Tested code computes every number", "157 tests; nothing is predicted by AI"),
                 ("AI writes, a validator checks", "Gemini drafts briefs and invitations; any figure not in the data is rejected"),
                 ("Every figure is labelled", "Observed, inferred, simulated or expert insight, with its source"),
                 ("Strategy goals, named", "Goal 2: 80% screening in every county. Goal 3: cancer mortality and survival per county"),
                 ("Public aggregate data only", "THL Sotkanet, Finnish Cancer Registry, Statistics Finland. No patient data")]
        for i, (k, v) in enumerate(items):
            y = 6.4 - i * 1.05
            ax.add_patch(plt.Circle((0.95, y - 0.17), 0.09, color=INK))
            ax.text(1.25, y, k, fontsize=16, weight="bold", va="top")
            ax.text(1.25, y - 0.48, v, fontsize=12.5, color=MUTED, va="top")
    slide(pdf, 8, "Data and trust", "Every number has a source", s8)

    # 9 Impact and vision
    def s9(ax):
        stat(ax, 0.75, 6.4, "8,585", "more people a year returning the bowel test", AHEAD)
        stat(ax, 5.85, 6.4, "817", "more colonoscopies a year after a positive test", AHEAD)
        stat(ax, 10.95, 6.4, "~69", "cancers and 474 advanced precursors found a year", AHEAD)
        ax.text(0.75, 3.55, "If every county matched the best quarter of counties.", fontsize=12, color=MUTED)
        tag(ax, 6.3, 3.6, "Simulated")
        ax.text(0.75, 2.85, wrap("Next: a pilot with one wellbeing services county's screening team. Vision: the intelligence layer "
                                 "for Finland's cancer care, and a method other Nordic and European systems can adapt.", 105),
                fontsize=15, va="top", linespacing=1.45)
    slide(pdf, 9, "Impact", "What closing the gaps would mean", s9)

    # 10 Close
    def s10(ax):
        ax.text(0.75, 6.0, "Make where you live matter less\nfor how quickly your cancer is found.", fontsize=38, weight="bold", va="top")
        ax.text(0.75, 3.2, "Try it: [demo link]\nSource: github.com/rromppanen/junction26", fontsize=17, color=MUTED, va="top", linespacing=1.6)
        ax.text(0.75, 1.3, "Honest limits: public aggregate data only; the breast simulator still uses placeholder stage and cost assumptions.",
                fontsize=12, color=MUTED)
    slide(pdf, 10, "", "", s10)

print(f"wrote {OUT}")
