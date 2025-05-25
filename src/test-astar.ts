import { findShortestPathAStar } from './utils/astar'
import { mockNodes, mockEdges } from './pages/graph/components/graph.data'
import type { ConditionMap } from './pages/graph/utils/interface'

// Crear mapa de nodos
const nodesMap = mockNodes.reduce((acc, node) => {
  acc[node.id] = { x: node.x, y: node.y }
  return acc
}, {} as Record<string, { x: number; y: number }>)

// Condiciones de prueba
const conditions: ConditionMap = {
  lluvia: true,
  permisoCarga: true,
  mantenimiento: false,
  horasPico: false
}

console.log("Condiciones actuales:", conditions)

// Probar ruta de Bodega A a Bodega B
const result = findShortestPathAStar("1", "2", mockEdges, nodesMap, conditions, "distance")
console.log("\nRuta encontrada:", result)

// Test 1: Ruta más corta por distancia (Bodega A -> Bodega B)
console.log("Test 1: Ruta más corta por distancia (Bodega A -> Bodega B)")
const result1 = findShortestPathAStar("1", "2", mockEdges, nodesMap, conditions, "distance")
console.log("Ruta:", result1?.path)
console.log("Distancia total:", result1?.distance)
console.log("Tiempo estimado:", result1?.estimatedTime)

// Test 2: Ruta más corta por tiempo (Bodega A -> Bodega B)
console.log("\nTest 2: Ruta más corta por tiempo (Bodega A -> Bodega B)")
const result2 = findShortestPathAStar("1", "2", mockEdges, nodesMap, conditions, "time")
console.log("Ruta:", result2?.path)
console.log("Distancia total:", result2?.distance)
console.log("Tiempo estimado:", result2?.estimatedTime)

// Test 3: Ruta con condiciones adversas (lluvia activa)
console.log("\nTest 3: Ruta con lluvia activa (Bodega A -> Bodega B)")
const conditionsWithRain = { ...conditions, lluvia: true }
const result3 = findShortestPathAStar("1", "2", mockEdges, nodesMap, conditionsWithRain, "distance")
console.log("Ruta:", result3?.path)
console.log("Distancia total:", result3?.distance)
console.log("Tiempo estimado:", result3?.estimatedTime)

// Test 4: Ruta más larga (Bodega A -> Zona Carga 2)
console.log("\nTest 4: Ruta más larga (Bodega A -> Zona Carga 2)")
const result4 = findShortestPathAStar("1", "5", mockEdges, nodesMap, conditions, "distance")
console.log("Ruta:", result4?.path)
console.log("Distancia total:", result4?.distance)
console.log("Tiempo estimado:", result4?.estimatedTime) 