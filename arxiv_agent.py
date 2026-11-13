"""
arXiv research agent: give it a subject, it searches arXiv, reads the abstracts,
and returns the most relevant papers with a short reason for each.

run: pip install anthropic arxiv

Setup:
    pip install anthropic arxiv
    export ANTHROPIC_API_KEY="sk-ant-..."

Run:
    python arxiv_agent.py "graph neural networks for drug discovery"
"""

import json
import sys

from dotenv import load_dotenv
load_dotenv()
import anthropic
import arxiv

MODEL = "claude-sonnet-5-5"
client = anthropic.Anthropic()
arxiv_client = arxiv.Client(page_size=50, delay_seconds=3, num_retries=3)  # arXiv asks for ~3 s between calls


# ---------- Tool: the only thing the agent can "do" ----------

def search_arxiv(query: str, max_results: int = 15, sort_by: str = "relevance") -> list[dict]:
    """Search arXiv and return compact paper records."""
    sort = {
        "relevance": arxiv.SortCriterion.Relevance,
        "date": arxiv.SortCriterion.SubmittedDate,
    }.get(sort_by, arxiv.SortCriterion.Relevance)

    search = arxiv.Search(query=query, max_results=min(max_results, 30), sort_by=sort)
    papers = []
    for r in arxiv_client.results(search):
        papers.append({
            "id": r.get_short_id(),
            "title": r.title,
            "authors": [a.name for a in r.authors[:5]],
            "published": r.published.date().isoformat(),
            "categories": r.categories,
            "abstract": r.summary[:1200],
            "url": r.entry_id,
            "pdf": r.pdf_url,
        })
    return papers


TOOLS = [{
    "name": "search_arxiv",
    "description": (
        "Search arXiv for papers. Supports arXiv query syntax: ti: (title), abs: (abstract), "
        "au: (author), cat: (category, e.g. cs.LG), and AND / OR / ANDNOT. "
        'Example: \'abs:"graph neural network" AND abs:"drug discovery"\'. '
        "Returns title, authors, date, categories, abstract and URL for each paper."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "query": {"type": "string", "description": "arXiv search query"},
            "max_results": {"type": "integer", "description": "1-30, default 15"},
            "sort_by": {"type": "string", "enum": ["relevance", "date"]},
        },
        "required": ["query"],
    },
}]

SYSTEM = """You are a research assistant that finds the most relevant arXiv papers for a subject.

Process:
1. Break the subject into 2-4 focused search queries (synonyms, key methods, arXiv categories).
2. Run them with search_arxiv. Use sort_by="date" once if recent work matters.
3. Read the abstracts and judge relevance yourself - don't trust search rank alone.
4. If results are thin or off-topic, refine the queries and search again (max ~6 searches total).

Finish with a markdown list of the 5-10 best papers, most relevant first:
**Title** (year) - authors - URL
One sentence on why it's relevant to the subject.
Then a 2-3 sentence overview of what the field looks like based on these papers."""


# ---------- Agent loop ----------

def run_agent(subject: str, max_turns: int = 10) -> str:
    messages = [{"role": "user", "content": f"Find research papers on: {subject}"}]

    for _ in range(max_turns):
        response = client.messages.create(
            model=MODEL,
            max_tokens=4000,
            system=SYSTEM,
            tools=TOOLS,
            messages=messages,
        )
        messages.append({"role": "assistant", "content": response.content})

        if response.stop_reason != "tool_use":
            return "".join(b.text for b in response.content if b.type == "text")

        tool_results = []
        for block in response.content:
            if block.type == "tool_use":
                print(f"  searching: {block.input.get('query')}", file=sys.stderr)
                try:
                    result = search_arxiv(**block.input)
                    content = json.dumps(result, ensure_ascii=False)
                except Exception as e:
                    content = f"Error: {e}"
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": content,
                })
        messages.append({"role": "user", "content": tool_results})

    return "Stopped: reached the turn limit."


if __name__ == "__main__":
    subject = " ".join(sys.argv[1:]) or input("Subject: ")
    print(run_agent(subject))