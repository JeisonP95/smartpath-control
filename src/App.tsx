"use client"

import { useState, useEffect, useCallback } from "react"
import Graph from "./pages/graph/Graph"
import ControlPanel from "./pages/controlPanel/ControlPanel"
import PathFinder from "./pages/pathFinder/PathFinder"
import RouteHistory from "./pages/routeHistory/RouteHistory"
import { getNodes, getEdges, getConditions, getVehicles, getAvailableAlgorithms } from "./services/api"
import type {
  NodeData,
  Edge,
  ConditionMap,
  PathResult,
  Condition,
  Vehicle,
  RouteAlgorithm,
  ConditionKey,
} from "./services"
import { evalCondition } from "./services/algorithms"
import { calculateRoute } from "./services/api"
import "./App.css"

function App() {
  const [nodes, setNodes] = useState<NodeData[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [conditions, setConditions] = useState<Condition[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [algorithms, setAlgorithms] = useState<RouteAlgorithm[]>([])
  const [activeConditions, setActiveConditions] = useState<ConditionMap>({} as ConditionMap)
  const [selectedPath, setSelectedPath] = useState<string[] | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [activeTab, setActiveTab] = useState<"pathfinder" | "history">("pathfinder")
  const [currentPathConfig, setCurrentPathConfig] = useState<{
    startNode: string
    endNode: string
    algorithm: string
    optimizeFor: "distance" | "time"
    vehicleId?: number
  } | null>(null)
  const [currentPathResult, setCurrentPathResult] = useState<PathResult | null>(null)
  const [bidirectionalPaths, setBidirectionalPaths] = useState<Map<string, string[]>>(new Map())

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Cargar datos
        const nodesData = await getNodes()
        const edgesData = await getEdges()
        const conditionsData = await getConditions()
        const vehiclesData = await getVehicles()
        const algorithmsData = getAvailableAlgorithms()

        setNodes(nodesData)
        setEdges(edgesData)
        setConditions(conditionsData)
        setVehicles(vehiclesData)
        setAlgorithms(algorithmsData)

        // Inicializar condiciones activas
        const condMap: ConditionMap = {} as ConditionMap
        conditionsData.forEach((cond) => {
          condMap[cond.key] = cond.active
        })
        setActiveConditions(condMap)
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Corregido: Especificamos el tipo correcto para key
  const handleConditionChange = (key: ConditionKey) => {
    setActiveConditions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
    // Reset path when conditions change
    setSelectedPath(null)
    setCurrentPathResult(null)
  }

  const handlePathResult = (result: PathResult | null, config: any) => {
    if (result && result.path) {
      setSelectedPath(result.path)
      setCurrentPathResult(result)
      setCurrentPathConfig(config)

      // Guardar la ruta para uso bidireccional
      const pathKey = `${config.startNode}-${config.endNode}`
      const reversedPathKey = `${config.endNode}-${config.startNode}`

      // Almacenar la ruta en ambas direcciones
      const newBidirectionalPaths = new Map(bidirectionalPaths)
      newBidirectionalPaths.set(pathKey, result.path)
      // También almacenar la ruta inversa
      newBidirectionalPaths.set(reversedPathKey, [...result.path].reverse())
      setBidirectionalPaths(newBidirectionalPaths)
    } else {
      setSelectedPath(null)
      setCurrentPathResult(null)
      setCurrentPathConfig(config)
    }
  }

  // Manejar cambios en las distancias
  const handleDistancesChange = useCallback(
    async (distances: Map<string, number>) => {
      // Si no hay una ruta activa, no hacer nada
      if (!currentPathConfig || !currentPathResult) return

      try {
        // Crear una copia de las aristas con las distancias actualizadas
        const updatedEdges = edges.map((edge) => {
          const key = `${edge.from}-${edge.to}`
          const newDistance = distances.get(key)
          if (newDistance !== undefined) {
            // Actualizar también el tiempo estimado si existe
            let newEstimatedTime = edge.estimatedTime
            if (edge.estimatedTime) {
              const speedFactor = edge.estimatedTime / edge.distance
              newEstimatedTime = newDistance * speedFactor
            }
            return { ...edge, distance: newDistance, estimatedTime: newEstimatedTime }
          }
          return edge
        })

        // Actualizar el estado de edges con las nuevas distancias
        setEdges(updatedEdges)

        // Verificar si hay una ruta bidireccional guardada
        const { startNode, endNode, algorithm, optimizeFor, vehicleId } = currentPathConfig
        const pathKey = `${startNode}-${endNode}`

        // Recalcular la ruta con las nuevas distancias
        const result = await calculateRoute(startNode, endNode, algorithm, optimizeFor, vehicleId)

        // Actualizar la ruta si ha cambiado
        if (
          result &&
          (result.distance !== currentPathResult.distance || !arraysEqual(result.path, currentPathResult.path))
        ) {
          setSelectedPath(result.path)
          setCurrentPathResult(result)

          // Actualizar las rutas bidireccionales
          const newBidirectionalPaths = new Map(bidirectionalPaths)
          newBidirectionalPaths.set(pathKey, result.path)
          // También actualizar la ruta inversa
          const reversedPathKey = `${endNode}-${startNode}`
          newBidirectionalPaths.set(reversedPathKey, [...result.path].reverse())
          setBidirectionalPaths(newBidirectionalPaths)
        }
      } catch (error) {
        console.error("Error recalculating route:", error)
      }
    },
    [edges, currentPathConfig, currentPathResult, bidirectionalPaths],
  )

  // Función auxiliar para comparar arrays
  const arraysEqual = (a: any[], b: any[]) => {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false
    }
    return true
  }

  if (loading) {
    return <div className="loading-app">Cargando aplicación...</div>
  }

  // Filtrar aristas activas basadas en condiciones actuales
  const activeEdges = edges.filter((edge) => evalCondition(edge.condition, activeConditions))

  return (
    <div className="app">
      <header className="app-header">
        <h1>SmartPath Control - Logística</h1>
        <p className="app-description">
          Sistema avanzado de visualización y cálculo de rutas basado en condiciones lógicas
        </p>
      </header>

      <div className="app-content">
        <aside className="app-sidebar">
          <ControlPanel conditions={conditions} activeConditions={activeConditions} toggle={handleConditionChange} />

          <div className="tab-navigation">
            <button
              className={`tab-button ${activeTab === "pathfinder" ? "active" : ""}`}
              onClick={() => setActiveTab("pathfinder")}
            >
              Calculador de Rutas
            </button>
            <button
              className={`tab-button ${activeTab === "history" ? "active" : ""}`}
              onClick={() => setActiveTab("history")}
            >
              Historial
            </button>
          </div>

          {activeTab === "pathfinder" ? (
            <PathFinder
              nodes={nodes}
              vehicles={vehicles}
              algorithms={algorithms}
              onPathResult={handlePathResult}
              currentResult={currentPathResult}
              bidirectionalPaths={bidirectionalPaths}
            />
          ) : (
            <RouteHistory />
          )}
        </aside>

        <main className="app-main">
          <Graph
            nodes={nodes}
            edges={activeEdges}
            highlightedPath={selectedPath}
            onDistancesChange={handleDistancesChange}
          />
        </main>
      </div>
    </div>
  )
}

export default App
