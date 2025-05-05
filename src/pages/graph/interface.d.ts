import { FunctionComponent } from "react"
import { NodeProps } from "reactflow"


interface PathResult {
  path: string[]
  distance: number
  estimatedTime: number
  vehicleId: number
  availableEdges: Edge[]
}

// Tipos para los nodos del grafo
export type NodeType = "bodega" | "zonaCarga" | "distribucion"

export interface NodeData {
  id: string
  label: string
  x: number
  y: number
  type: NodeType
  latitude?: number
  longitude?: number
}

// Interfaz para las aristas
export interface Edge {
  id?: string
  from: string
  to: string
  condition: string
  bidirectional: boolean
  distance: number
  estimatedTime: number
  trafficFactor: number
}

// Interfaz para las condiciones
export type ConditionKey = "lluvia" | "permisoCarga" | "mantenimiento" | "horasPico"

export interface Condition {
  key: ConditionKey
  label: string
  description: string
  icon: string
  active: boolean
}

export interface ConditionMap {
  lluvia: boolean
  permisoCarga: boolean
  mantenimiento: boolean
  horasPico: boolean
}

// Interfaz para los vehículos
export interface Vehicle {
  id: number
  name: string
  type: string
  capacity: number
  speedFactor: number
  available: boolean
}

// Interfaz para los algoritmos de ruta
export interface RouteAlgorithm {
  name: string
  description: string
}

// Props para el componente Graph
export interface Props {
  nodes: NodeData[]
  edges: Edge[]
  highlightedPath?: string[] | null
  title?: string
}

// Componente de nodo personalizado
export const CustomNode: FunctionComponent<NodeProps> = (props) => {
  const { data, type } = props

  let backgroundColor = "#3498db"
  let borderColor = "#2980b9"
  let icon = "🏢"

  // Determinar el color y el icono según el tipo de nodo
  if (type === "bodega") {
    backgroundColor = "#3498db"
    borderColor = "#2980b9"
    icon = "🏢"
  } else if (type === "zonaCarga") {
    backgroundColor = "#2ecc71"
    borderColor = "#27ae60"
    icon = "🚚"
  } else if (type === "distribucion") {
    backgroundColor = "#e74c3c"
    borderColor = "#c0392b"
    icon = "📦"
  }

}