import { COLORS } from "@/styles/colors"

export function SlideIllustration1() {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 420 280"
      fill="none"
      className="block"
    >
      {/* Before card */}
      <rect
        x="28"
        y="48"
        width="158"
        height="188"
        rx="14"
        fill={COLORS.card}
        stroke="rgba(16,35,63,0.1)"
        strokeWidth="1"
      />
      {/* Clock - before (messy, lots of hours) */}
      <circle
        cx="107"
        cy="82"
        r="22"
        fill="rgba(16,35,63,0.06)"
        stroke="rgba(16,35,63,0.18)"
        strokeWidth="1"
      />
      <line
        x1="107"
        y1="82"
        x2="107"
        y2="65"
        stroke="rgba(16,35,63,0.35)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="107"
        y1="82"
        x2="118"
        y2="78"
        stroke="rgba(16,35,63,0.35)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Scribbled lines - manual writing */}
      <rect
        x="44"
        y="124"
        width="126"
        height="8"
        rx="2"
        fill="rgba(16,35,63,0.1)"
      />
      <rect
        x="44"
        y="140"
        width="96"
        height="8"
        rx="2"
        fill="rgba(16,35,63,0.1)"
      />
      <rect
        x="44"
        y="156"
        width="112"
        height="8"
        rx="2"
        fill="rgba(16,35,63,0.1)"
      />
      <rect
        x="44"
        y="172"
        width="80"
        height="8"
        rx="2"
        fill="rgba(16,35,63,0.1)"
      />
      {/* Pencil icon */}
      <g transform="translate(88,108) rotate(-30)">
        <rect
          x="0"
          y="0"
          width="8"
          height="22"
          rx="1.5"
          fill={COLORS.warm}
          opacity="0.7"
        />
        <polygon points="0,22 8,22 4,28" fill="rgba(16,35,63,0.35)" />
        <rect
          x="0"
          y="0"
          width="8"
          height="5"
          rx="1.5"
          fill="rgba(16,35,63,0.2)"
        />
      </g>
      {/* Time label */}
      <rect
        x="60"
        y="202"
        width="94"
        height="22"
        rx="11"
        fill="rgba(16,35,63,0.07)"
      />
      <text
        x="107"
        y="218"
        textAnchor="middle"
        fontSize="11"
        fontFamily="'Pretendard', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif"
        fill="rgba(16,35,63,0.55)"
        fontWeight="500"
      >
        수 시간 소요
      </text>

      {/* Arrow */}
      <path
        d="M196 144 L224 144"
        stroke="rgba(61,111,166,0.4)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M218 138 L224 144 L218 150"
        stroke="rgba(61,111,166,0.4)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* After card */}
      <rect
        x="234"
        y="48"
        width="158"
        height="188"
        rx="14"
        fill={COLORS.card}
        stroke="rgba(61,111,166,0.2)"
        strokeWidth="1"
      />
      {/* Clock - after (fast) */}
      <circle
        cx="313"
        cy="82"
        r="22"
        fill="rgba(61,111,166,0.08)"
        stroke="rgba(61,111,166,0.3)"
        strokeWidth="1"
      />
      <line
        x1="313"
        y1="82"
        x2="313"
        y2="66"
        stroke={COLORS.blue}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="313"
        y1="82"
        x2="322"
        y2="86"
        stroke={COLORS.blue}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Clean document lines */}
      <rect
        x="250"
        y="124"
        width="126"
        height="8"
        rx="2"
        fill="rgba(61,111,166,0.2)"
      />
      <rect
        x="250"
        y="140"
        width="100"
        height="8"
        rx="2"
        fill="rgba(61,111,166,0.15)"
      />
      <rect
        x="250"
        y="156"
        width="118"
        height="8"
        rx="2"
        fill="rgba(61,111,166,0.2)"
      />
      <rect
        x="250"
        y="172"
        width="88"
        height="8"
        rx="2"
        fill="rgba(61,111,166,0.12)"
      />
      {/* Check badge */}
      <circle cx="349" cy="116" r="10" fill={COLORS.blue} />
      <path
        d="M344.5 116.5L347.5 119.5L353.5 113"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Time label */}
      <rect
        x="268"
        y="202"
        width="90"
        height="22"
        rx="11"
        fill="rgba(61,111,166,0.1)"
      />
      <text
        x="313"
        y="218"
        textAnchor="middle"
        fontSize="11"
        fontFamily="'Pretendard', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif"
        fill={COLORS.blue}
        fontWeight="600"
      >
        약 15분
      </text>

      {/* Labels */}
      <text
        x="107"
        y="250"
        textAnchor="middle"
        fontSize="11"
        fontFamily="'Pretendard', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif"
        fill="rgba(16,35,63,0.45)"
      >
        직접 작성할 때
      </text>
      <text
        x="313"
        y="250"
        textAnchor="middle"
        fontSize="11"
        fontFamily="'Pretendard', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif"
        fill={COLORS.blue}
      >
        풀림 사용 시
      </text>
    </svg>
  )
}

export function SlideIllustration2() {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 420 280"
      fill="none"
      className="block"
    >
      {/* Step 1 - Document */}
      <rect
        x="28"
        y="70"
        width="90"
        height="110"
        rx="10"
        fill={COLORS.card}
        stroke="rgba(16,35,63,0.12)"
        strokeWidth="1"
      />
      <rect
        x="42"
        y="90"
        width="62"
        height="7"
        rx="2"
        fill="rgba(16,35,63,0.12)"
      />
      <rect
        x="42"
        y="105"
        width="50"
        height="7"
        rx="2"
        fill="rgba(16,35,63,0.08)"
      />
      <rect
        x="42"
        y="120"
        width="58"
        height="7"
        rx="2"
        fill="rgba(16,35,63,0.1)"
      />
      <rect
        x="42"
        y="135"
        width="44"
        height="7"
        rx="2"
        fill="rgba(16,35,63,0.08)"
      />
      <text
        x="73"
        y="200"
        textAnchor="middle"
        fontSize="10.5"
        fontFamily="'Pretendard', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif"
        fill="rgba(16,35,63,0.5)"
      >
        거래 내역
      </text>
      <circle
        cx="16"
        cy="118"
        r="10"
        fill="rgba(16,35,63,0.08)"
        stroke="rgba(16,35,63,0.15)"
        strokeWidth="0.5"
      />
      <text
        x="16"
        y="122"
        textAnchor="middle"
        fontSize="9"
        fontFamily="'Pretendard', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif"
        fill="rgba(16,35,63,0.55)"
        fontWeight="600"
      >
        1
      </text>

      {/* Arrow 1 */}
      <path
        d="M124 125 L156 125"
        stroke="rgba(61,111,166,0.35)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M150 119 L156 125 L150 131"
        stroke="rgba(61,111,166,0.35)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Step 2 - Upload/AI */}
      <circle
        cx="185"
        cy="125"
        r="42"
        fill="rgba(61,111,166,0.08)"
        stroke="rgba(61,111,166,0.2)"
        strokeWidth="1"
      />
      <path
        d="M185 115 L185 138M178 122 L185 115 L192 122"
        stroke={COLORS.blue}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="176"
        y="138"
        width="18"
        height="3"
        rx="1.5"
        fill={COLORS.blue}
        opacity="0.5"
      />
      <text
        x="185"
        y="200"
        textAnchor="middle"
        fontSize="10.5"
        fontFamily="'Pretendard', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif"
        fill={COLORS.blue}
      >
        AI 분석
      </text>
      <circle cx="237" cy="90" r="10" fill={COLORS.blue} />
      <text
        x="237"
        y="94"
        textAnchor="middle"
        fontSize="9"
        fontFamily="'Pretendard', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif"
        fill="white"
        fontWeight="600"
      >
        2
      </text>

      {/* Arrow 2 */}
      <path
        d="M232 125 L264 125"
        stroke="rgba(61,111,166,0.35)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M258 119 L264 125 L258 131"
        stroke="rgba(61,111,166,0.35)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Step 3 - Output doc */}
      <rect
        x="270"
        y="60"
        width="122"
        height="130"
        rx="10"
        fill={COLORS.card}
        stroke="rgba(61,111,166,0.25)"
        strokeWidth="1"
      />
      <rect
        x="284"
        y="82"
        width="94"
        height="8"
        rx="2"
        fill="rgba(61,111,166,0.3)"
      />
      <rect
        x="284"
        y="98"
        width="78"
        height="7"
        rx="2"
        fill="rgba(61,111,166,0.18)"
      />
      <rect
        x="284"
        y="112"
        width="88"
        height="7"
        rx="2"
        fill="rgba(61,111,166,0.22)"
      />
      <rect
        x="284"
        y="126"
        width="64"
        height="7"
        rx="2"
        fill="rgba(61,111,166,0.15)"
      />
      <rect
        x="284"
        y="140"
        width="82"
        height="7"
        rx="2"
        fill="rgba(61,111,166,0.18)"
      />
      <rect
        x="284"
        y="154"
        width="70"
        height="7"
        rx="2"
        fill="rgba(61,111,166,0.12)"
      />
      {/* Bullet dots */}
      <circle cx="276" cy="86" r="3" fill={COLORS.blue} opacity="0.5" />
      <circle cx="276" cy="102" r="3" fill={COLORS.blue} opacity="0.4" />
      <circle cx="276" cy="116" r="3" fill={COLORS.blue} opacity="0.5" />
      <circle cx="276" cy="130" r="3" fill={COLORS.blue} opacity="0.35" />
      <text
        x="331"
        y="215"
        textAnchor="middle"
        fontSize="10.5"
        fontFamily="'Pretendard', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif"
        fill={COLORS.blue}
      >
        소명서 완성
      </text>
      <circle cx="258" cy="90" r="10" fill={COLORS.blue} />
      <text
        x="258"
        y="94"
        textAnchor="middle"
        fontSize="9"
        fontFamily="'Pretendard', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif"
        fill="white"
        fontWeight="600"
      >
        3
      </text>
    </svg>
  )
}

export function SlideIllustration3() {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 420 280"
      fill="none"
      className="block"
    >
      {/* Back folder */}
      <rect
        x="90"
        y="130"
        width="240"
        height="120"
        rx="12"
        fill="rgba(61,111,166,0.18)"
      />
      <rect
        x="90"
        y="118"
        width="90"
        height="18"
        rx="6"
        fill="rgba(61,111,166,0.18)"
      />
      {/* Document 1 */}
      <rect
        x="80"
        y="68"
        width="110"
        height="140"
        rx="10"
        fill={COLORS.card}
        stroke="rgba(16,35,63,0.1)"
        strokeWidth="1"
      />
      <rect
        x="94"
        y="88"
        width="82"
        height="7"
        rx="2"
        fill="rgba(16,35,63,0.1)"
      />
      <rect
        x="94"
        y="102"
        width="66"
        height="7"
        rx="2"
        fill="rgba(16,35,63,0.07)"
      />
      <rect
        x="94"
        y="116"
        width="76"
        height="7"
        rx="2"
        fill="rgba(16,35,63,0.09)"
      />
      <circle cx="162" cy="76" r="14" fill="rgba(61,111,166,0.15)" />
      <path
        d="M156 76L160 80L168 72"
        stroke={COLORS.blue}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Document 2 */}
      <rect
        x="198"
        y="56"
        width="110"
        height="140"
        rx="10"
        fill={COLORS.card}
        stroke="rgba(61,111,166,0.2)"
        strokeWidth="1"
      />
      <rect
        x="212"
        y="76"
        width="82"
        height="7"
        rx="2"
        fill="rgba(61,111,166,0.2)"
      />
      <rect
        x="212"
        y="90"
        width="66"
        height="7"
        rx="2"
        fill="rgba(61,111,166,0.14)"
      />
      <rect
        x="212"
        y="104"
        width="76"
        height="7"
        rx="2"
        fill="rgba(61,111,166,0.18)"
      />
      <rect
        x="212"
        y="118"
        width="60"
        height="7"
        rx="2"
        fill="rgba(61,111,166,0.12)"
      />
      <rect
        x="212"
        y="132"
        width="72"
        height="7"
        rx="2"
        fill="rgba(61,111,166,0.16)"
      />
      <circle cx="280" cy="64" r="14" fill={COLORS.blue} />
      <path
        d="M274 64L278 68L286 60"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* AI badge */}
      <rect
        x="134"
        y="214"
        width="152"
        height="28"
        rx="14"
        fill={COLORS.card}
        stroke="rgba(61,111,166,0.3)"
        strokeWidth="0.5"
      />
      <circle cx="151" cy="228" r="8" fill={COLORS.blue} />
      <text
        x="151"
        y="232"
        textAnchor="middle"
        fontSize="8"
        fontFamily="'Pretendard', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif"
        fill="white"
        fontWeight="700"
      >
        AI
      </text>
      <text
        x="220"
        y="232"
        textAnchor="middle"
        fontSize="11"
        fontFamily="'Pretendard', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif"
        fill={COLORS.navy}
        fontWeight="500"
      >
        분석 근거 포함 완료
      </text>
    </svg>
  )
}
