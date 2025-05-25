import { type NodeTypes, Handle, Position, type NodeProps } from "reactflow"
import "reactflow/dist/style.css"
import type { Edge, NodeData, RouteAlgorithm, Condition } from "../utils/interface"



// Datos de ejemplo para desarrollo local
export const mockNodes: NodeData[] = [
  { id: "1", label: "Bodega A", x: 50, y: 300, type: "bodega", latitude: 4.6097, longitude: -74.0817 },
  { id: "2", label: "Bodega B", x: 450, y: 300, type: "bodega", latitude: 4.6234, longitude: -74.0836 },
  { id: "3", label: "Bodega C", x: 250, y: 350, type: "bodega", latitude: 4.6145, longitude: -74.0648 },
  { id: "4", label: "Zona Carga 1", x: 50, y: 50, type: "zonaCarga", latitude: 4.6189, longitude: -74.0756 },
  { id: "5", label: "Zona Carga 2", x: 450, y: 50, type: "zonaCarga", latitude: 4.6278, longitude: -74.0723 },
  { id: "6", label: "Distribución Central", x: 250, y: 150, type: "distribucion", latitude: 4.6201, longitude: -74.0701 },
]

export const mockEdges = [
  // Zonas de carga -> Distribución central (2)
  { from: "4", to: "6", condition: "permisoCarga", distance: 5, estimatedTime: 15, trafficFactor: 1.0, bidirectional: false },
  { from: "5", to: "6", condition: "permisoCarga", distance: 8, estimatedTime: 20, trafficFactor: 1.1, bidirectional: false },

  // Distribución central -> Zonas de carga (2)
  { from: "6", to: "4", condition: "permisoCarga", distance: 5, estimatedTime: 15, trafficFactor: 1.0, bidirectional: false },
  { from: "6", to: "5", condition: "permisoCarga", distance: 8, estimatedTime: 20, trafficFactor: 1.1, bidirectional: false },

  // Distribución central -> Bodegas (3)
  { from: "6", to: "1", condition: "permisoCarga && !(lluvia && horasPico)", distance: 3, estimatedTime: 10, trafficFactor: 1.0, bidirectional: false },
  { from: "6", to: "2", condition: "permisoCarga && !mantenimiento", distance: 8, estimatedTime: 25, trafficFactor: 1.2, bidirectional: false },
  { from: "6", to: "3", condition: "permisoCarga && !(lluvia || horasPico)", distance: 8, estimatedTime: 25, trafficFactor: 1.2, bidirectional: false },

  // Bodegas -> Distribución central (3)
  { from: "1", to: "6", condition: "permisoCarga", distance: 3, estimatedTime: 10, trafficFactor: 1.0, bidirectional: false },
  { from: "2", to: "6", condition: "permisoCarga", distance: 8, estimatedTime: 25, trafficFactor: 1.2, bidirectional: false },
  { from: "3", to: "6", condition: "permisoCarga && !mantenimiento", distance: 8, estimatedTime: 25, trafficFactor: 1.1, bidirectional: false },

  // Entre bodegas (6)
  { from: "1", to: "2", condition: "permisoCarga && !(lluvia && mantenimiento)", distance: 8, estimatedTime: 25, trafficFactor: 1.2, bidirectional: false },
  { from: "1", to: "3", condition: "permisoCarga", distance: 8, estimatedTime: 25, trafficFactor: 1.2, bidirectional: false },
  { from: "2", to: "1", condition: "permisoCarga", distance: 8, estimatedTime: 25, trafficFactor: 1.2, bidirectional: false },
  { from: "2", to: "3", condition: "permisoCarga && !(lluvia && mantenimiento)", distance: 8, estimatedTime: 25, trafficFactor: 1.2, bidirectional: false },
  { from: "3", to: "1", condition: "permisoCarga", distance: 8, estimatedTime: 25, trafficFactor: 1.2, bidirectional: false },
  { from: "3", to: "2", condition: "permisoCarga", distance: 8, estimatedTime: 25, trafficFactor: 1.2, bidirectional: false },
]

export const mockConditions: Condition[] = [
  { key: "lluvia", label: "Lluvia", description: "Condiciones climáticas desfavorables", icon: "🌧️", active: true },
  { key: "permisoCarga", label: "Permiso de Carga", description: "Autorización para transportar mercancía", icon: "📝", active: true, },
  { key: "mantenimiento", label: "Mantenimiento", description: "Vías en reparación", icon: "🔧", active: false },
  { key: "horasPico", label: "Horas Pico", description: "Horarios de alta congestión", icon: "⏰", active: false },
]

// Algoritmos de ruta disponibles
export const mockAlgorithms: RouteAlgorithm[] = [
  { name: "astar", description: "Algoritmo A* (optimiza distancia o tiempo)" },
]

export const BodegaNode = ({ data }: NodeProps) => (
  <div className="node bodega-node">
    {/* Punto único para entrada y salida en la parte derecha */}
    <Handle type="source" position={Position.Top} id="bodega-source" />
    <div>{data.label}</div>
    <Handle type="target" position={Position.Top} id="bodega-target" />
  </div>
)

const ZonaCargaNode = ({ data }: NodeProps) => (
  <div className="node zona-carga-node">
    <Handle type="target" position={Position.Bottom} />
    <div>{data.label}</div>
    <Handle type="source" position={Position.Bottom} />
  </div>
)

const DistribucionNode = ({ data }: NodeProps) => (
  <div className="node distribucion-node">
    <Handle type="target" position={Position.Bottom} />
    <div>{data.label}</div>
    <Handle type="source" position={Position.Bottom} />
  </div>
)

export const nodeTypes: NodeTypes = {
  bodega: BodegaNode,
  zonaCarga: ZonaCargaNode,
  distribucion: DistribucionNode,
}
