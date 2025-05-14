export interface Props {
  nodes: NodeData[]
  vehicles: Vehicle[]
  algorithms: RouteAlgorithm[]
  onPathResult: (result: PathResult | null) => void
}
