const { findShortestPathAStar } = require('./utils/astar')
const { mockNodes, mockEdges } = require('./pages/graph/components/graph.data')

// Crear mapa de nodos
const nodesMap = mockNodes.reduce((acc, node) => {
  acc[node.id] = { x: node.x, y: node.y }
  return acc
}, {})

// Condiciones de prueba
const conditions = {
  lluvia: true,
  permisoCarga: true,
  mantenimiento: false,
  horasPico: false
}

console.log("Condiciones actuales:", conditions)

// Probar ruta de Bodega A a Bodega B
const result = findShortestPathAStar("1", "2", mockEdges, nodesMap, conditions, "distance")
console.log("\nRuta encontrada:", result) 