import { COLORS } from "@/styles/colors"
import type { GraphEdge, GraphNodeType, TransactionGraphData } from "@/api"

interface PositionedNode {
  id: string
  x: number
  y: number
  type: GraphNodeType
  label: string
}

interface DrawEdge {
  f: string
  t: string
  s: boolean
}

const COLUMN_X: Record<GraphNodeType, number> = {
  origin: 48,
  suspect: 158,
  self: 268,
  normal: 386,
  other: 80,
}

const COLUMN_BAND: Record<GraphNodeType, [number, number]> = {
  origin: [60, 60],
  suspect: [38, 172],
  self: [88, 88],
  normal: [44, 196],
  other: [214, 236],
}

const DEMO_NODES: PositionedNode[] = [
  { id: "orig", x: 48, y: 68, type: "origin", label: "최초 계좌" },
  { id: "mid1", x: 148, y: 38, type: "suspect", label: "경유 A" },
  { id: "mid2", x: 148, y: 148, type: "suspect", label: "경유 B" },
  { id: "self", x: 268, y: 88, type: "self", label: "내 계좌" },
  { id: "out1", x: 390, y: 48, type: "normal", label: "수신 계좌 1" },
  { id: "out2", x: 390, y: 148, type: "normal", label: "수신 계좌 2" },
  { id: "out3", x: 470, y: 210, type: "normal", label: "수신 계좌 3" },
  { id: "sub1", x: 80, y: 210, type: "other", label: "연관 계좌" },
]

const DEMO_EDGES: DrawEdge[] = [
  { f: "orig", t: "mid1", s: true },
  { f: "orig", t: "mid2", s: true },
  { f: "mid1", t: "self", s: true },
  { f: "mid2", t: "self", s: true },
  { f: "self", t: "out1", s: false },
  { f: "self", t: "out2", s: false },
  { f: "out2", t: "out3", s: false },
  { f: "mid2", t: "sub1", s: true },
]

function layout(data: TransactionGraphData): PositionedNode[] {
  const byType = new Map<GraphNodeType, typeof data.nodes>()
  for (const node of data.nodes) {
    const bucket = byType.get(node.type) ?? []
    bucket.push(node)
    byType.set(node.type, bucket)
  }

  const placed: PositionedNode[] = []
  for (const [type, nodes] of byType) {
    const [top, bottom] = COLUMN_BAND[type]
    const step = nodes.length > 1 ? (bottom - top) / (nodes.length - 1) : 0
    const center = (top + bottom) / 2
    nodes.forEach((node, i) => {
      placed.push({
        id: node.id,
        label: node.label,
        type: node.type,
        x: COLUMN_X[type],
        y: nodes.length > 1 ? top + step * i : center,
      })
    })
  }
  return placed
}

function toDrawEdges(edges: GraphEdge[]): DrawEdge[] {
  return edges.map((e) => ({
    f: e.source,
    t: e.target,
    s: e.suspicious || e.highlighted,
  }))
}

function nodeColor(type: string) {
  if (type === "self") return COLORS.blue
  if (type === "suspect" || type === "origin") return COLORS.warm
  return COLORS.sky
}

export function TransactionGraph({
  width = 520,
  height = 260,
  detailed = false,
  animated = true,
  data,
}: {
  width?: number
  height?: number
  detailed?: boolean
  animated?: boolean
  data?: TransactionGraphData | null
}) {
  const nodes = data && data.nodes.length > 0 ? layout(data) : DEMO_NODES
  const edges =
    data && data.nodes.length > 0 ? toDrawEdges(data.edges) : DEMO_EDGES
  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]))

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 520 260"
      className="overflow-visible max-w-full h-auto"
    >
      <defs>
        <marker
          id="arrow"
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L0,6 L6,3 z" fill="rgba(16,35,63,0.2)" />
        </marker>
        <marker
          id="arrow-s"
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L0,6 L6,3 z" fill="rgba(199,123,78,0.35)" />
        </marker>
      </defs>

      {edges.map((e, i) => {
        const f = nodeMap[e.f]
        const t = nodeMap[e.t]
        if (!f || !t) return null
        const dx = t.x - f.x
        const dy = t.y - f.y
        const len = Math.sqrt(dx * dx + dy * dy) || 1
        const r = t.type === "self" ? 9 : 5
        const ex = t.x - (dx / len) * r
        const ey = t.y - (dy / len) * r
        return (
          <line
            key={i}
            x1={f.x}
            y1={f.y}
            x2={ex}
            y2={ey}
            stroke={e.s ? "rgba(199,123,78,0.3)" : "rgba(16,35,63,0.15)"}
            strokeWidth={1}
            strokeDasharray={e.s ? "4 3" : "none"}
            markerEnd={`url(#${e.s ? "arrow-s" : "arrow"})`}
            className={animated && e.s ? "animate-dash" : ""}
          />
        )
      })}

      {nodes.map((n) => {
        const isSelf = n.type === "self"
        const c = nodeColor(n.type)
        const r = isSelf ? 9 : 5
        return (
          <g key={n.id}>
            {isSelf && (
              <circle
                cx={n.x}
                cy={n.y}
                r={22}
                fill={COLORS.blue}
                fillOpacity={0.08}
                className="animate-pulse-ring"
              />
            )}
            <circle
              cx={n.x}
              cy={n.y}
              r={r}
              fill={
                isSelf
                  ? COLORS.blue
                  : n.type === "suspect" || n.type === "origin"
                    ? "rgba(199,123,78,0.12)"
                    : "rgba(127,168,201,0.15)"
              }
              stroke={c}
              strokeWidth={isSelf ? 0 : 1}
              strokeOpacity={0.5}
            />
            {detailed && (
              <text
                x={n.x}
                y={n.y + (n.y < 120 ? -14 : 18)}
                textAnchor="middle"
                fontSize={9.5}
                fontFamily="'Pretendard', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif"
                fill={isSelf ? COLORS.blue : "rgba(16,35,63,0.5)"}
                fontWeight={isSelf ? "600" : "400"}
              >
                {n.label}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
