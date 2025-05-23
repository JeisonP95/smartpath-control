"use client"

import { useState } from "react"
import { calculateRoute } from "../routeCalculator/calculateRoute"
import type { PathResult } from "../graph/utils/interface"
import { useGraph } from "../../context/GraphContext"

const PathFinder = ({ onPathResult }: { onPathResult: (result: PathResult | null) => void }) => {
  const { nodes, algorithms, edges } = useGraph()
  const [startNode, setStartNode] = useState<string>("1")
  const [endNode, setEndNode] = useState<string>("3")
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>("A*")
  const [optimizeFor, setOptimizeFor] = useState<"distance" | "time">("distance")
  const [pathResult, setPathResult] = useState<PathResult | null>(null)
  const [isCalculating, setIsCalculating] = useState<boolean>(false)

  const handleCalculate = async () => {
    setIsCalculating(true)
    try {
      const result = await calculateRoute(startNode, endNode, optimizeFor, undefined, nodes, edges)
      if (result) {
        setPathResult(result)
        onPathResult(result)
      } else {
        setPathResult(null)
        onPathResult(null)
        console.error("No se encontró una ruta válida")
      }
    } catch (error) {
      console.error("Error calculating route:", error)
      setPathResult(null)
      onPathResult(null)
    } finally {
      setIsCalculating(false)
    }
  }

  // Función para obtener el nombre del nodo a partir de su ID
  const getNodeNameById = (id: string): string => {
    const node = nodes.find((n) => n.id === id)
    return node ? node.label : id
  }

  return (
    <div className="path-finder">
      <h2>Calculador de Rutas</h2>
      <p className="path-description">Encuentre la ruta más corta disponible entre dos ubicaciones</p>

      <div className="path-selectors">
        <div className="selector-group">
          <label htmlFor="start-node">Origen:</label>
          <select id="start-node" value={startNode} onChange={(e) => setStartNode(e.target.value)}>
            {nodes.map((node) => (
              <option key={`start-${node.id}`} value={node.id}>
                {node.label}
              </option>
            ))}
          </select>
        </div>

        <button
          className="swap-button"
          onClick={() => {
            const temp = startNode
            setStartNode(endNode)
            setEndNode(temp)
            setPathResult(null)
            onPathResult(null)
          }}
          title="Intercambiar origen y destino"
        >
          ↔️
        </button>

        <div className="selector-group">
          <label htmlFor="end-node">Destino:</label>
          <select id="end-node" value={endNode} onChange={(e) => setEndNode(e.target.value)}>
            {nodes.map((node) => (
              <option key={`end-${node.id}`} value={node.id}>
                {node.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="advanced-options">
        <div className="selector-group">
          <label htmlFor="algorithm">Algoritmo:</label>
          <select id="algorithm" value={selectedAlgorithm} onChange={(e) => setSelectedAlgorithm(e.target.value)}>
            {algorithms.map((algo) => (
              <option key={algo.name} value={algo.name}>
                {algo.name.charAt(0).toUpperCase() + algo.name.slice(1)}
              </option>
            ))}
          </select>
          <small className="algorithm-description">
            {algorithms.find((a) => a.name === selectedAlgorithm)?.description}
          </small>
        </div>

        <div className="optimize-options">
          <label>Optimizar por:</label>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                name="optimize"
                value="distance"
                checked={optimizeFor === "distance"}
                onChange={() => setOptimizeFor("distance")}
              />
              Distancia
            </label>
            <label>
              <input
                type="radio"
                name="optimize"
                value="time"
                checked={optimizeFor === "time"}
                onChange={() => setOptimizeFor("time")}
              />
              Tiempo
            </label>
          </div>
        </div>
      </div>

      <button className="calculate-button" onClick={handleCalculate} disabled={isCalculating}>
        {isCalculating ? "Calculando..." : "Calcular Ruta"}
      </button>

      {pathResult && (
        <div className="path-result">
          <h3>Resultado</h3>
          <div className="result-distance">
            <strong>Distancia Total:</strong> {pathResult.distance.toFixed(2)} km
          </div>
          {pathResult.estimatedTime && (
            <div className="result-time">
              <strong>Tiempo Estimado:</strong> {Math.floor(pathResult.estimatedTime)} min
            </div>
          )}
          <div className="result-path">
            <strong>Ruta:</strong>
            <div className="path-nodes">
              {pathResult.path.map((nodeId, index) => (
                <span key={`path-${nodeId}-${index}`}>
                  <span className="path-node">{getNodeNameById(nodeId)}</span>
                  {index < pathResult.path.length - 1 && <span className="path-arrow">→</span>}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PathFinder
