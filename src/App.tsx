import { useEffect, useState } from "react"
import Graph from "./pages/graph/Graph"
import ControlPanel from "./pages/controlPanel/ControlPanel"
import PathFinder from "./pages/pathFinder/PathFinder"
import RouteHistory from "./pages/routeHistory/RouteHistory"
import { 
  getNodes, 
  getEdges, 
  getConditions, 
<<<<<<< HEAD
  getVehicles, 
=======
>>>>>>> 6e4952964f5dc2b5258f39d3a5ac438a483f2925
  getRouteAlgorithms,
  evalCondition 
} from "./pages/graph/components/graph.algorimths"
import { GraphProvider, useGraph } from "./context/GraphContext"
import type {
  NodeData,
  Edge,
  ConditionMap,
  PathResult,
  Condition,
<<<<<<< HEAD
  Vehicle,
=======
>>>>>>> 6e4952964f5dc2b5258f39d3a5ac438a483f2925
  RouteAlgorithm,
  ConditionKey,
} from "./pages/graph/utils/interface"
import "./App.css"

function AppContent() {
  const { 
    nodes, 
    edges, 
    conditions, 
<<<<<<< HEAD
    vehicles, 
=======
>>>>>>> 6e4952964f5dc2b5258f39d3a5ac438a483f2925
    algorithms, 
    activeConditions,
    setNodes, 
    setEdges, 
    setConditions, 
<<<<<<< HEAD
    setVehicles, 
=======
>>>>>>> 6e4952964f5dc2b5258f39d3a5ac438a483f2925
    setAlgorithms, 
    setActiveConditions 
  } = useGraph()

  const [selectedPath, setSelectedPath] = useState<string[] | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [activeTab, setActiveTab] = useState<"pathfinder" | "history">("pathfinder")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const nodesData = await getNodes()
        const edgesData = await getEdges()
        const conditionsData = await getConditions()
<<<<<<< HEAD
        const vehiclesData = await getVehicles()
=======
>>>>>>> 6e4952964f5dc2b5258f39d3a5ac438a483f2925
        const algorithmsData = await getRouteAlgorithms()

        setNodes(nodesData)
        setEdges(edgesData)
        setConditions(conditionsData)
<<<<<<< HEAD
        setVehicles(vehiclesData)
=======
>>>>>>> 6e4952964f5dc2b5258f39d3a5ac438a483f2925
        setAlgorithms(algorithmsData)
  
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

  const handleConditionChange = (key: ConditionKey) => {
    setActiveConditions((prev: ConditionMap) => ({
      ...prev,
      [key]: !prev[key],
    }))
    setSelectedPath(null)
  }

  const handlePathResult = (result: PathResult | null) => {
    setSelectedPath(result ? result.path : null)
  }

  if (loading) {
    return <div className="loading-app">Cargando aplicación...</div>
  }

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
          <ControlPanel 
            conditions={conditions} 
            activeConditions={activeConditions} 
            toggle={handleConditionChange} 
          />

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
              onPathResult={handlePathResult} 
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
          />
        </main>
      </div>
    </div>
  )
}

function App() {
  return (
    <GraphProvider>
      <AppContent />
    </GraphProvider>
  )
}

export default App
