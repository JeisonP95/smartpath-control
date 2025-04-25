"use client"

import { useCallback, useState } from "react"
import ReactFlow, {
  Background,
  Controls,
  type Edge as ReactFlowEdge,
  type Node as ReactFlowNode,
  type NodeTypes,
  Handle,
  Position,
  type NodeProps,
} from "reactflow"
import "reactflow/dist/style.css"
import type { NodeData, Edge } from "../data/index"
import GoogleMapView from "./GoogleMapView"

// Componentes personalizados para los nodos
const BodegaNode = ({ data }: NodeProps) => (
  <div className="node bodega-node">
    <Handle type="target" position={Position.Top} />
    <div>{data.label}</div>
    <Handle type="source" position={Position.Bottom} />
  </div>
)

const ZonaCargaNode = ({ data }: NodeProps) => (
  <div className="node zona-carga-node">
    <Handle type="target" position={Position.Top} />
    <div>{data.label}</div>
    <Handle type="source" position={Position.Bottom} />
  </div>
)

const DistribucionNode = ({ data }: NodeProps) => (
  <div className="node distribucion-node">
    <Handle type="target" position={Position.Top} />
    <div>{data.label}</div>
    <Handle type="source" position={Position.Bottom} />
  </div>
)

// Definición de tipos de nodos personalizados
const nodeTypes: NodeTypes = {
  bodega: BodegaNode,
  zonaCarga: ZonaCargaNode,
  distribucion: DistribucionNode,
}

interface Props {
  nodes: NodeData[]
  edges: Edge[]
  highlightedPath?: string[] | null
  title?: string
}

const Graph = ({ nodes, edges, highlightedPath, title = "Visualización de Rutas" }: Props) => {
  const [viewMode, setViewMode] = useState<"graph" | "map">("graph")

  // Crear nodos para reactflow
  const reactFlowNodes: ReactFlowNode[] = nodes.map((node) => ({
    id: node.id,
    data: { label: node.label },
    position: { x: node.x, y: node.y },
    type: node.type,
  }))

  // Determinar si una arista está en la ruta resaltada
  const isEdgeInPath = useCallback(
    (from: string, to: string): boolean => {
      if (!highlightedPath || highlightedPath.length < 2) return false

      for (let i = 0; i < highlightedPath.length - 1; i++) {
        if (highlightedPath[i] === from && highlightedPath[i + 1] === to) {
          return true
        }
      }
      return false
    },
    [highlightedPath],
  )

  // Crear aristas para reactflow
  const reactFlowEdges: ReactFlowEdge[] = edges.map((edge, index) => {
    const isInPath = isEdgeInPath(edge.from, edge.to)

    return {
      id: `e${index}`,
      source: edge.from,
      target: edge.to,
      animated: isInPath,
      label: `${edge.distance} km${edge.estimatedTime ? ` / ${Math.floor(edge.estimatedTime)} min` : ""}`,
      style: {
        stroke: isInPath ? "#ffcc00" : "#00cc44",
        strokeWidth: isInPath ? 3 : 1.5,
      },
    }
  })

  const toggleViewMode = () => {
    setViewMode(viewMode === "graph" ? "map" : "graph")
  }

  return (
    <div className="graph-container">
      <div className="graph-header">
        <h2>{title}</h2>
        <button className="view-toggle-button" onClick={toggleViewMode}>
          {viewMode === "graph" ? "Ver en Mapa Real" : "Ver en Grafo"}
        </button>
      </div>

      {viewMode === "graph" ? (
        <div className="graph-view">
          <ReactFlow nodes={reactFlowNodes} edges={reactFlowEdges} nodeTypes={nodeTypes} fitView>
            <Background />
            <Controls />
          </ReactFlow>
        </div>
      ) : (
        <div className="map-view">
          <GoogleMapView nodes={nodes} edges={edges} highlightedPath={highlightedPath} />
        </div>
      )}

      <div className="graph-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: "#00cc44" }}></div>
          <span>Ruta Disponible</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: "#ffcc00" }}></div>
          <span>Ruta Óptima</span>
        </div>
      </div>
    </div>
  )
}

export default Graph
