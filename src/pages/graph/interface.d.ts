export interface Props {
  nodes: NodeData[]
  edges: Edge[]
  highlightedPath?: string[] | null
  title?: string
  onDistancesChange?: (distances: Map<string, number>) => void
}
