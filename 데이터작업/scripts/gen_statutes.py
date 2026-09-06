# -*- coding: utf-8 -*-
"""096_seed_statutes.sql 생성 — 통신사기피해환급법 + 시행령 조문 전문.

법과 시행령을 모두 넣는다. 법 제7조 제3항이 이의제기 방법과 절차를 대통령령에
위임하고 있어서, 법만 있으면 실제 절차를 답할 수 없기 때문이다.

국가법령정보센터 Open API 응답을 그대로 옮긴다. 법조문은 한 글자도 지어내면
안 되는 자료라 손으로 옮겨 적지 않는다. 개정되면 이 스크립트를 다시 돌리면 된다.

인증키(OC)는 크롤러 .env 의 LAW_OC 를 쓴다.
open.law.go.kr 에서 이메일로 무료 신청하면 즉시 발급되고, 값은 이메일의 @ 앞부분이다.

실행 — 데이터작업 폴더에서
    python scripts/gen_statutes.py
"""
import io
import json
import os
import sys
import urllib.parse
import urllib.request

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

ENV = "../기획자료/5. 3자 사기 자료/crawler/.env"
OUT = "sql/096_seed_statutes.sql"
LAWS = [
    ("전기통신금융사기 피해 방지 및 피해금 환급에 관한 특별법",
     "https://www.law.go.kr/법령/전기통신금융사기피해방지및피해금환급에관한특별법"),
    ("전기통신금융사기 피해 방지 및 피해금 환급에 관한 특별법 시행령",
     "https://www.law.go.kr/법령/전기통신금융사기피해방지및피해금환급에관한특별법시행령"),
]


def oc():
    if os.path.exists(ENV):
        for line in io.open(ENV, encoding="utf-8"):
            if line.strip().startswith("LAW_OC="):
                return line.split("=", 1)[1].strip()
    return os.getenv("LAW_OC", "").strip()


def article_key(a):
    no = str(a.get("조문번호", "")).strip()
    ga = str(a.get("조문가지번호", "")).strip()
    return "제%s조%s" % (no, ("의%s" % ga) if ga else "")


def article_text(a):
    """조문 전체를 조·항·호·목 순서로 이어 붙인다."""
    parts = [(a.get("조문내용") or "").strip()]
    subs = a.get("항") or []
    if isinstance(subs, dict):
        subs = [subs]
    for s in subs:
        t = (s.get("항내용") or "").strip()
        if t:
            parts.append(t)
        hos = s.get("호") or []
        if isinstance(hos, dict):
            hos = [hos]
        for h in hos:
            t = (h.get("호내용") or "").strip()
            if t:
                parts.append("  " + t)
            mok = h.get("목") or []
            if isinstance(mok, dict):
                mok = [mok]
            for m in mok:
                t = (m.get("목내용") or "").strip()
                if t:
                    parts.append("    " + t)
    return "\n".join(p for p in parts if p)


def dollar(t):
    if "$doc$" in t:
        raise SystemExit("본문에 $doc$ 가 있다")
    return "$doc$" + t + "$doc$"


def fetch(name):
    url = "https://www.law.go.kr/DRF/lawService.do?" + urllib.parse.urlencode(
        {"OC": oc(), "target": "law", "type": "JSON", "LM": name})
    with urllib.request.urlopen(url, timeout=60) as r:
        return json.loads(r.read().decode("utf-8", "replace"))["법령"]


HEAD = [
    "-- 096_seed_statutes.sql · 통신사기피해환급법 + 시행령 조문 전문",
    "-- scripts/gen_statutes.py 로 생성됨. 직접 고치지 말고 스크립트를 다시 돌릴 것.",
    "--",
    "-- 국가법령정보센터 Open API 응답을 그대로 옮겼다. 법조문은 한 글자도",
    "-- 지어내면 안 되는 자료라 손으로 옮겨 적지 않는다.",
    "-- 개정되면 스크립트를 다시 돌리면 갱신된다 (ON CONFLICT DO UPDATE).",
    "",
]

TAIL = ("ON CONFLICT (law_name, article) DO UPDATE\n"
        "  SET body = EXCLUDED.body,\n"
        "      effective_on = EXCLUDED.effective_on,\n"
        "      source_url = EXCLUDED.source_url,\n"
        "      checked_on = CURRENT_DATE;\n")


def main():
    if not oc():
        print("LAW_OC 가 없다. 크롤러 .env 를 확인할 것")
        return 1

    blocks = []
    total = 0
    for name, base_url in LAWS:
        law = fetch(name)
        basic = law["기본정보"]
        eff = str(basic.get("시행일자", ""))
        eff = "%s-%s-%s" % (eff[:4], eff[4:6], eff[6:8]) if len(eff) == 8 else None
        real = basic.get("법령명_한글", name)
        arts = law["조문"]["조문단위"]
        if isinstance(arts, dict):
            arts = [arts]

        rows = []
        seen = set()
        for a in arts:
            # 편·장·절 제목만 있는 단위는 조문이 아니다
            if str(a.get("조문여부", "조문")).strip() == "전문":
                continue
            if not str(a.get("조문번호", "")).strip():
                continue
            key = article_key(a)
            if key in seen:
                continue
            body = article_text(a)
            if not body:
                continue
            seen.add(key)
            rows.append("  (%s, %s, %s, %s, %s, CURRENT_DATE)" % (
                dollar(real), dollar(key), dollar(body),
                ("'%s'" % eff) if eff else "NULL",
                dollar(base_url + "/" + key)))

        total += len(rows)
        print("%s" % real)
        print("   시행 %s · 조문 %d개" % (eff, len(rows)))

        header = "-- %s (시행 %s) · 조문 %d개" % (real, eff, len(rows))
        blocks.append(header + "\n"
                      + "INSERT INTO statutes (law_name, article, body, effective_on, source_url, checked_on)\n"
                      + "VALUES\n"
                      + ",\n".join(rows) + "\n"
                      + TAIL)

    io.open(OUT, "w", encoding="utf-8", newline="\n").write(
        "\n".join(HEAD) + "\n" + "\n".join(blocks))
    print("\n%s 생성 — 조문 %d개" % (OUT, total))
    return 0


if __name__ == "__main__":
    sys.exit(main())
