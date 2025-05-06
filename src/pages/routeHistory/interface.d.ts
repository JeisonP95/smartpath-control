export interface RouteHistoryItem {
    id: number
    start_node: string
    end_node: string
    path: string
    distance: number
    estimated_time: number | null
    algorithm: string
    created_at: string
    vehicles: { name: string } | null
  }