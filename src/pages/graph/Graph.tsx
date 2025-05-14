"use client"

import { useCallback, useState, useEffect } from "react"
import ReactFlow, {
  Background,
  Controls,
  type Edge as ReactFlowEdge,
  type Node as ReactFlowNode,
  type NodeChange,
  applyNodeChanges,
  type NodePositionChange,
} from "reactflow"
import "reactflow/dist/style.css"
import type { Props } from "./utils/interface"
import { nodeTypes } from "./components/graph.data"
import { calculateDistance } from "../../utils/distancia"
import { useGraph } from "../../context/GraphContext"

const Graph = ({ nodes, edges, highlightedPath, title = "Visualización de Rutas" }: Props) => {
  const { updateNodePosition } = useGraph()

  // Convertir nodos a formato ReactFlow
  const initialNodes: ReactFlowNode[] = nodes.map((node) => ({
    id: node.id,
    data: { label: node.label },
    position: { x: node.x, y: node.y },
    type: node.type,
    // permitir arrastrar nodos
    draggable: node.type === "distribucion" || node.type === "bodega" || node.type === "zonaCarga",
  }))

  // Estado para nodos y aristas
  const [reactFlowNodes, setReactFlowNodes] = useState<ReactFlowNode[]>(initialNodes)
  const [reactFlowEdges, setReactFlowEdges] = useState<ReactFlowEdge[]>([])

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

  // Función para calcular las aristas actualizadas
  const calculateUpdatedEdges = useCallback(
    (currentNodes: ReactFlowNode[]) => {
      const nodeMap = new Map(currentNodes.map((node) => [node.id, node]))

      return edges.map((edge, index) => {
        const isInPath = isEdgeInPath(edge.from, edge.to)
        const sourceNode = nodeMap.get(edge.from)
        const targetNode = nodeMap.get(edge.to)

        let distance = edge.distance
        let estimatedTime = edge.estimatedTime

        if (sourceNode && targetNode) {
          const sourceType = nodes.find((n) => n.id === edge.from)?.type
          const targetType = nodes.find((n) => n.id === edge.to)?.type

          if (
            ["bodega", "zonaCarga", "distribucion"].includes(sourceType || "") ||
            ["bodega", "zonaCarga", "distribucion"].includes(targetType || "")
          ) {
            distance = calculateDistance(
              sourceNode.position.x,
              sourceNode.position.y,
              targetNode.position.x,
              targetNode.position.y,
            )

            if (edge.estimatedTime) {
              const speedFactor = edge.estimatedTime / edge.distance
              estimatedTime = distance * speedFactor
            }
          }
        }

        return {
          id: `e${index}`,
          source: edge.from,
          target: edge.to,
          animated: isInPath,
          label: `${distance.toFixed(1)} km${estimatedTime ? ` / ${Math.floor(estimatedTime)} min` : ""}`,
          style: {
            stroke: isInPath ? "#ffcc00" : "#00cc44",
            strokeWidth: isInPath ? 3 : 1.5,
          },
        }
      })
    },
    [edges, isEdgeInPath, nodes],
  )

  // Actualizar aristas cuando cambian los nodos o las aristas originales
  useEffect(() => {
    const updatedEdges = calculateUpdatedEdges(reactFlowNodes)
    setReactFlowEdges(updatedEdges)
  }, [reactFlowNodes, calculateUpdatedEdges])

  // Manejar cambios en los nodos (drag and drop)
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setReactFlowNodes((nds) => {
        const newNodes = applyNodeChanges(changes, nds)
        const positionChanges = changes.filter(
          (change): change is NodePositionChange => change.type === "position" && change.dragging === false,
        )

        if (positionChanges.length > 0) {
          positionChanges.forEach((change) => {
            const node = newNodes.find((n) => n.id === change.id)
            if (node) {
              updateNodePosition(change.id, node.position.x, node.position.y)
            }
          })
          const updatedEdges = calculateUpdatedEdges(newNodes)
          setReactFlowEdges(updatedEdges)
        }

        return newNodes
      })
    },
    [calculateUpdatedEdges, updateNodePosition],
  )

  return (
    <div className="graph-container">
      <div className="graph-header">
        <h2>{title}</h2>
        <div className="drag-info"></div>
      </div>

      <div className="graph-view">
        <ReactFlow
          nodes={reactFlowNodes}
          edges={reactFlowEdges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>

      <div className="graph-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: "#00cc44" }}></div>
          <span>Ruta Disponible</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: "#ffcc00" }}></div>
          <span>Ruta Óptima</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: "#3498db" }}></div>
          <span>distribucion,zona-carga,bodega (Arrastrable)</span>
        </div>
      </div>
    </div>
  )
}

export default Graph
