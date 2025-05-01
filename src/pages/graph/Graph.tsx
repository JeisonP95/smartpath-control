"use client"

import { useCallback, useState } from "react"
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
import type { Props } from "./interface"
import { nodeTypes } from "./graph.data"
import { calculateDistance } from "../../services/distancia"

const Graph = ({ nodes, edges, highlightedPath, title = "Visualización de Rutas" }: Props) => {
  // Convertir nodos a formato ReactFlow
  const initialNodes: ReactFlowNode[] = nodes.map((node) => ({
    id: node.id,
    data: { label: node.label },
    position: { x: node.x, y: node.y },
    type: node.type,
    // permitir arrastrar nodos
    draggable: node.type === "distribucion" || node.type === "bodega"|| node.type === "zonaCarga",
   
    
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

  // Actualizar aristas cuando cambian los nodos o las aristas originales
  useCallback(() => {
    // Crear un mapa de nodos para acceso rápido
    const nodeMap = new Map(reactFlowNodes.map((node) => [node.id, node]))

    // Crear aristas para reactflow con distancias recalculadas
    const updatedEdges: ReactFlowEdge[] = edges.map((edge, index) => {
      const isInPath = isEdgeInPath(edge.from, edge.to)

      // Obtener posiciones actuales de los nodos
      const sourceNode = nodeMap.get(edge.from)
      const targetNode = nodeMap.get(edge.to)

      let distance = edge.distance
      let estimatedTime = edge.estimatedTime

      // Recalcular distancia si ambos nodos existen y al menos uno es una bodega
      if (sourceNode && targetNode) {
        const sourceType = nodes.find((n) => n.id === edge.from)?.type
        const targetType = nodes.find((n) => n.id === edge.to)?.type

        if (sourceType === "bodega" || targetType === "bodega") {
          // Calcular nueva distancia basada en las posiciones actuales
          distance = calculateDistance(
            sourceNode.position.x,
            sourceNode.position.y,
            targetNode.position.x,
            targetNode.position.y,
          )

          // Actualizar tiempo estimado basado en la nueva distancia
          // Asumiendo que la velocidad es constante
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

    setReactFlowEdges(updatedEdges)
  }, [reactFlowNodes, edges, isEdgeInPath, nodes])

  // Manejar cambios en los nodos (drag and drop)
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setReactFlowNodes((nds) => {
        const newNodes = applyNodeChanges(changes, nds)

        // Si el cambio es de posición, actualizar las aristas
        const positionChanges = changes.filter(
          (change): change is NodePositionChange => change.type === "position" && change.dragging === false,
        )

        if (positionChanges.length > 0) {
          // Crear un mapa de nodos para acceso rápido
          const nodeMap = new Map(newNodes.map((node) => [node.id, node]))

          // Actualizar aristas con nuevas distancias
          const updatedEdges = edges.map((edge, index) => {
            const isInPath = isEdgeInPath(edge.from, edge.to)

            // Obtener posiciones actuales de los nodos
            const sourceNode = nodeMap.get(edge.from)
            const targetNode = nodeMap.get(edge.to)

            let distance = edge.distance
            let estimatedTime = edge.estimatedTime

            // Recalcular distancia si ambos nodos existen y al menos uno es una bodega
            if (sourceNode && targetNode) {
              const sourceType = nodes.find((n) => n.id === edge.from)?.type
              const targetType = nodes.find((n) => n.id === edge.to)?.type

              if (sourceType === "bodega" || targetType === "bodega") {
                // Calcular nueva distancia basada en las posiciones actuales
                distance = calculateDistance(
                  sourceNode.position.x,
                  sourceNode.position.y,
                  targetNode.position.x,
                  targetNode.position.y,
                )

                // Actualizar tiempo estimado basado en la nueva distancia
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

          setReactFlowEdges(updatedEdges)
        }

        return newNodes
      })
    },
    [edges, isEdgeInPath, nodes],
  )

  // Actualizar aristas iniciales
  useCallback(() => {
    const initialEdges = edges.map((edge, index) => {
      const isInPath = isEdgeInPath(edge.from, edge.to)

      return {
        id: `e${index}`,
        source: edge.from,
        target: edge.to,
        animated: isInPath,
        label: `${edge.distance.toFixed(1)} km${edge.estimatedTime ? ` / ${Math.floor(edge.estimatedTime)} min` : ""}`,
        style: {
          stroke: isInPath ? "#ffcc00" : "#00cc44",
          strokeWidth: isInPath ? 3 : 1.5,
        },
      }
    })

    setReactFlowEdges(initialEdges)
  }, [edges, isEdgeInPath])

  return (
    <div className="graph-container">
      <div className="graph-header">
        <h2>{title}</h2>
        <div className="drag-info">
          <span>Arrastra las bodegas para recalcular distancias</span>
        </div>
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
