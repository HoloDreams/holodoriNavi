from pathlib import Path
import re
import shutil

ROOT = Path(r"G:\holodoriNavi")
SOURCE_IMAGE = Path(r"G:\Download\view.png")
DEST_IMAGE = ROOT / "code" / "img" / "view.png"

BASE_URL = "https://holodreams.github.io/holodoriNavi/"
OG_TITLE = "holodoriNavi"
OG_DESCRIPTION = "ホロライブドリームスを更に知るならここ！"
OG_IMAGE = BASE_URL + "code/img/view.png"


def public_html_files():
    files = [
        ROOT / "index.html",
        ROOT / "404.html",
        ROOT / "code" / "about.html",
        ROOT / "code" / "character_card.html",
        ROOT / "code" / "dream_park.html",
        ROOT / "code" / "home.html",
        ROOT / "code" / "item_search.html",
        ROOT / "code" / "rhythm_game.html",
        ROOT / "code" / "song.html",
        ROOT / "code" / "unit.html",
        ROOT / "code" / "update_history.html",
    ]
    song_dir = ROOT / "code" / "収録楽曲一覧"
    if song_dir.exists():
        files.extend(sorted(song_dir.glob("*.html")))
    return [path for path in files if path.exists()]


def page_url(path):
    rel = path.relative_to(ROOT).as_posix()
    if rel == "index.html":
        return BASE_URL
    return BASE_URL + rel


def build_ogp(path):
    return f"""
  <meta property="og:title" content="{OG_TITLE}">
  <meta property="og:description" content="{OG_DESCRIPTION}">
  <meta property="og:image" content="{OG_IMAGE}">
  <meta property="og:url" content="{page_url(path)}">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{OG_TITLE}">
  <meta name="twitter:description" content="{OG_DESCRIPTION}">
  <meta name="twitter:image" content="{OG_IMAGE}">
"""


def update_html(path):
    text = path.read_text(encoding="utf-8-sig")
    original = text
    text = re.sub(
        r'\s*<meta\s+property=["\']og:(?:title|description|image|url|type)["\'][^>]*>\s*',
        "\n",
        text,
        flags=re.IGNORECASE,
    )
    text = re.sub(
        r'\s*<meta\s+name=["\']twitter:(?:card|title|description|image)["\'][^>]*>\s*',
        "\n",
        text,
        flags=re.IGNORECASE,
    )
    if not re.search(r"</head>", text, flags=re.IGNORECASE):
        return False
    text = re.sub(r"\s*</head>", build_ogp(path) + "</head>", text, count=1, flags=re.IGNORECASE)
    if text != original:
        path.write_text(text, encoding="utf-8")
        return True
    return False


def main():
    if not SOURCE_IMAGE.exists():
        raise SystemExit(f"view.png not found: {SOURCE_IMAGE}")
    DEST_IMAGE.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(SOURCE_IMAGE, DEST_IMAGE)

    changed = []
    for path in public_html_files():
        if update_html(path):
            changed.append(path)

    print(f"copied={DEST_IMAGE}")
    print(f"updated={len(changed)}")
    for path in changed:
        print(path)


if __name__ == "__main__":
    main()
