import type { NodeData, Vehicle, RouteAlgorithm, PathResult } from "../../services"

export interface Props {
  nodes: NodeData[]
  vehicles: Vehicle[]
  algorithms: RouteAlgorithm[]
  onPathResult: (result: PathResult | null, config: any) => void
  currentResult?: PathResult | null
}
