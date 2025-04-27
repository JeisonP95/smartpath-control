"use client"

import { useState, useEffect } from "react"
import Graph from "./pages/graph/Graph"
import ControlPanel from "./pages/controlPanel/ControlPanel"
import PathFinder from "./pages/pathFinder/PathFinder"
import RouteHistory from "./pages/RouteHistory"
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
  }

  const handlePathResult = (result: PathResult | null) => {
    setSelectedPath(result ? result.path : null)
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
            <PathFinder nodes={nodes} vehicles={vehicles} algorithms={algorithms} onPathResult={handlePathResult} />
          ) : (
            <RouteHistory />
          )}
        </aside>

        <main className="app-main">
          <Graph nodes={nodes} edges={activeEdges} highlightedPath={selectedPath} />
        </main>
      </div>
    </div>
  )
}

export default App
