"use client"

import { useState, useEffect } from "react"
import type { PathResult } from "../../services"
import { calculateRoute } from "../../services/api"
import type { Props } from "./interface"

const PathFinder = ({ nodes, vehicles, algorithms, onPathResult, currentResult }: Props) => {
  const [startNode, setStartNode] = useState<string>("1")
  const [endNode, setEndNode] = useState<string>("3")
  const [selectedVehicle, setSelectedVehicle] = useState<number | undefined>(undefined)
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>("A*")
  const [optimizeFor, setOptimizeFor] = useState<"distance" | "time">("distance")
  const [pathResult, setPathResult] = useState<PathResult | null>(null)
  const [isCalculating, setIsCalculating] = useState<boolean>(false)

  // Actualizar el resultado local cuando cambia el resultado actual
  useEffect(() => {
    if (currentResult) {
      setPathResult(currentResult)
    }
  }, [currentResult])

  const handleCalculate = async () => {
    setIsCalculating(true)
    try {
      // Calcular una única ruta
      const result = await calculateRoute(startNode, endNode, selectedAlgorithm, optimizeFor, selectedVehicle)

      if (!result) {
        console.error("No se pudo calcular la ruta")
        setPathResult(null)
        onPathResult(null, null)
        return
      }

      // Asegurarse de que distance siempre sea un número
      const safeResult: PathResult = {
        path: result.path || [],
        distance: typeof result.distance === "number" ? result.distance : 0,
        estimatedTime: result.estimatedTime,
        vehicleId: result.vehicleId,
      }

      setPathResult(safeResult)
      onPathResult(safeResult, {
        startNode,
        endNode,
        algorithm: selectedAlgorithm,
        optimizeFor,
        vehicleId: selectedVehicle,
      })
    } catch (error) {
      console.error("Error calculating route:", error)
      setPathResult(null)
      onPathResult(null, null)
    } finally {
      setIsCalculating(false)
    }
  }

  // Función para obtener el nombre del nodo a partir de su ID
  const getNodeNameById = (id: string): string => {
    const node = nodes.find((n) => n.id === id)
    return node ? node.label : id
  }

  // Función para obtener el nombre del vehículo a partir de su ID
  const getVehicleNameById = (id: number | undefined): string => {
    if (!id) return "Sin vehículo"
    const vehicle = vehicles.find((v) => v.id === id)
    return vehicle ? vehicle.name : `Vehículo ${id}`
  }

  // Función para intercambiar origen y destino
  const swapStartAndEnd = () => {
    const temp = startNode
    setStartNode(endNode)
    setEndNode(temp)
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

        <div className="selector-swap">
          <button className="swap-button" onClick={swapStartAndEnd} title="Intercambiar origen y destino">
            ↔️
          </button>
        </div>

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

        <div className="selector-group">
          <label htmlFor="vehicle">Vehículo:</label>
          <select
            id="vehicle"
            value={selectedVehicle || ""}
            onChange={(e) => setSelectedVehicle(e.target.value ? Number.parseInt(e.target.value) : undefined)}
          >
            <option value="">Sin vehículo</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.name} ({vehicle.type})
              </option>
            ))}
          </select>
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

      <div className="route-buttons">
        <button className="calculate-button" onClick={handleCalculate} disabled={isCalculating}>
          {isCalculating ? "Calculando..." : "Calcular Ruta"}
        </button>
      </div>

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
          {pathResult.vehicleId && (
            <div className="result-vehicle">
              <strong>Vehículo:</strong> {getVehicleNameById(pathResult.vehicleId)}
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
