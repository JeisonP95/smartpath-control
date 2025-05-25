import type { Edge, PathResult, ConditionMap } from "../pages/graph/utils/interface"

// Función para verificar si alguna condición está activa
function isAnyConditionActive(conditions: ConditionMap): boolean {
  const activeConditions = Object.entries(conditions)
    .filter(([_, value]) => value === true)
    .map(([key]) => key)
  
  console.log("Condiciones activas:", activeConditions)
  return activeConditions.length > 0
}

// Función heurística para estimar la distancia entre dos nodos (para A*)
function heuristic(node: string, end: string, nodesMap: Record<string, { x: number; y: number }>, activeEdges: Edge[]): number {
  // Buscar la arista directa entre node y end
  const directEdge = activeEdges.find(e => e.from === node && e.to === end)
  if (directEdge) {
    return directEdge.distance
  }

  // Si no hay arista directa, buscar la ruta más corta a través de un nodo intermedio
  const intermediateEdges = activeEdges.filter(e => e.from === node || e.to === end)
  if (intermediateEdges.length > 0) {
    const minDistance = Math.min(...intermediateEdges.map(e => e.distance))
    return minDistance
  }

  // Si no hay rutas intermedias, usar la distancia euclidiana como aproximación
  const nodePos = nodesMap[node]
  const endPos = nodesMap[end]

  if (!nodePos || !endPos) return Number.POSITIVE_INFINITY

  return Math.sqrt(Math.pow(nodePos.x - endPos.x, 2) + Math.pow(nodePos.y - endPos.y, 2))
}

// Función para evaluar condiciones booleanas
function evalCondition(expression: string, values: ConditionMap): boolean {
  if (expression === "true") return true

  try {
    const keys = Object.keys(values) as (keyof ConditionMap)[]
    const args = keys.map(k => values[k])
    const fn = new Function(...keys, `return ${expression}`)
    return fn(...args)
  } catch {
    return false
  }
}

// Función para calcular el costo de una arista
function getEdgeCost(edge: Edge, optimizeFor: "distance" | "time"): number {
  if (optimizeFor === "distance") {
    return edge.distance
  } else {
    // Calcular tiempo considerando el factor de tráfico
    const baseTime = edge.estimatedTime || edge.distance * 3
    const trafficFactor = edge.trafficFactor || 1.0
    console.log(`Arista ${edge.from}->${edge.to}: tiempo base=${baseTime}, factor tráfico=${trafficFactor}`)
    return baseTime * trafficFactor
  }
}

// Función para verificar si hay condiciones activas (excepto permisoCarga)
function hasActiveConditions(conditions: ConditionMap): boolean {
  // Si solo permisoCarga está activo, no hay condiciones activas
  const activeConditions = Object.entries(conditions)
    .filter(([_, value]) => value === true)
    .map(([key]) => key)
  
  return activeConditions.length > 1 || (activeConditions.length === 1 && activeConditions[0] !== "permisoCarga")
}

// Función principal que decide qué algoritmo usar según las condiciones
export function findShortestPathAStar(
  start: string,
  end: string,
  edges: Edge[],
  nodesMap: Record<string, { x: number; y: number }>,
  conditions: ConditionMap,
  optimizeFor: "distance" | "time" = "distance",
): PathResult | null {
  console.log("Buscando ruta de", start, "a", end)
  console.log("Condiciones:", conditions)

  // Si no hay condiciones activas o solo permisoCarga está activo, usar ruta directa
  if (!hasActiveConditions(conditions)) {
    const directEdge = edges.find(e => e.from === start && e.to === end)
    if (directEdge) {
      console.log("Usando ruta directa")
      console.log("Arista directa:", {
        from: directEdge.from,
        to: directEdge.to,
        distance: directEdge.distance,
        estimatedTime: directEdge.estimatedTime
      })
      return {
        path: [start, end],
        distance: directEdge.distance,
        estimatedTime: directEdge.estimatedTime,
        availableEdges: edges
      }
    }
  }

  // Filtrar aristas activas según las condiciones
  const activeEdges = edges.filter(edge => evalCondition(edge.condition, conditions))
  console.log("Aristas activas:", activeEdges.length)
  console.log("Aristas activas detalle:", activeEdges.map(e => ({
    from: e.from,
    to: e.to,
    distance: e.distance,
    estimatedTime: e.estimatedTime,
    condition: e.condition
  })))

  if (activeEdges.length === 0) {
    console.log("No hay rutas válidas")
    return null
  }

  // Inicializar estructuras para A*
  const openSet = new Set<string>([start])
  const closedSet = new Set<string>()
  const cameFrom = new Map<string, string>()
  const gScore = new Map<string, number>()
  const fScore = new Map<string, number>()

  // Inicializar puntuaciones
  gScore.set(start, 0)
  fScore.set(start, 0)

  while (openSet.size > 0) {
    // Encontrar el nodo con menor fScore
    let current = Array.from(openSet).reduce((a, b) => 
      (fScore.get(a) || Infinity) < (fScore.get(b) || Infinity) ? a : b
    )

    if (current === end) {
      return reconstructPath(cameFrom, current, activeEdges, optimizeFor)
    }

    openSet.delete(current)
    closedSet.add(current)

    // Obtener vecinos válidos
    const neighbors = activeEdges
      .filter(edge => edge.from === current)
      .map(edge => edge.to)

    for (const neighbor of neighbors) {
      if (closedSet.has(neighbor)) continue

      const edge = activeEdges.find(e => e.from === current && e.to === neighbor)
      if (!edge) continue

      // Calcular el costo de la arista
      const cost = optimizeFor === "distance" ? edge.distance : edge.estimatedTime
      const tentativeGScore = (gScore.get(current) || 0) + cost

      if (!openSet.has(neighbor)) {
        openSet.add(neighbor)
      } else if (tentativeGScore >= (gScore.get(neighbor) || Infinity)) {
        continue
      }

      cameFrom.set(neighbor, current)
      gScore.set(neighbor, tentativeGScore)
      fScore.set(neighbor, tentativeGScore)
    }
  }

  return null
}

// Función para reconstruir la ruta
function reconstructPath(
  cameFrom: Map<string, string>,
  current: string,
  edges: Edge[],
  optimizeFor: "distance" | "time"
): PathResult {
  const path: string[] = [current]
  let totalDistance = 0
  let totalTime = 0

  while (cameFrom.has(current)) {
    const previous = cameFrom.get(current)!
    const edge = edges.find(e => e.from === previous && e.to === current)
    
    if (edge) {
      totalDistance += edge.distance
      totalTime += edge.estimatedTime
      console.log(`Arista ${previous}->${current}:`, {
        distance: edge.distance,
        estimatedTime: edge.estimatedTime,
        totalDistance,
        totalTime
      })
    }
    
    current = previous
    path.unshift(current)
  }

  console.log("Ruta encontrada:", path)
  console.log("Distancia total:", totalDistance)
  console.log("Tiempo total:", totalTime)

  return {
    path,
    distance: totalDistance,
    estimatedTime: totalTime,
    availableEdges: edges
  }
}

// Algoritmo para encontrar la ruta más larga (versión 2 - más eficiente)
function findLongestPath(
  start: string,
  end: string,
  activeEdges: Edge[],
  nodesMap: Record<string, { x: number; y: number }>,
  optimizeFor: "distance" | "time",
): PathResult | null {
  // Crear un grafo para facilitar la navegación
  const graph: Record<string, Edge[]> = {}

  // Inicializar el grafo
  activeEdges.forEach((edge) => {
    if (!graph[edge.from]) {
      graph[edge.from] = []
    }
    graph[edge.from].push(edge)
  })

  // Usar un enfoque de búsqueda en profundidad limitada para encontrar caminos
  const paths: { path: string[]; distance: number; time: number }[] = []
  const maxDepth = 15 // Limitar la profundidad para evitar problemas de rendimiento

  // Función de búsqueda en profundidad
  function dfs(current: string, path: string[], visited: Set<string>, depth: number, distance: number, time: number) {
    // Si llegamos al destino, registrar el camino
    if (current === end) {
      paths.push({
        path: [...path, current],
        distance,
        time,
      })
      return
    }

    // Si alcanzamos la profundidad máxima o no hay vecinos, detener la búsqueda
    if (depth >= maxDepth || !graph[current]) {
      return
    }

    // Marcar como visitado para evitar ciclos
    visited.add(current)

    // Explorar vecinos
    for (const edge of graph[current] || []) {
      const neighbor = edge.to

      // Evitar ciclos
      if (visited.has(neighbor)) continue

      // Calcular métricas acumuladas
      const newDistance = distance + edge.distance
      const newTime = time + (edge.estimatedTime || edge.distance * 3)

      // Continuar la búsqueda
      dfs(neighbor, [...path, current], new Set(visited), depth + 1, newDistance, newTime)
    }
  }

  // Iniciar la búsqueda
  dfs(start, [], new Set<string>(), 0, 0, 0)

  // Si no encontramos caminos, intentar con un enfoque alternativo
  if (paths.length === 0) {
    // Intentar con un enfoque de Bellman-Ford modificado para encontrar el camino más largo
    return findLongestPathBellmanFord(start, end, activeEdges, optimizeFor)
  }

  // Ordenar los caminos según la métrica de optimización
  paths.sort((a, b) => {
    const valueA = optimizeFor === "distance" ? a.distance : a.time
    const valueB = optimizeFor === "distance" ? b.distance : b.time
    return valueB - valueA // Ordenar de mayor a menor
  })

  // Tomar el camino más largo
  const longestPath = paths[0]

  return {
    path: longestPath.path,
    distance: longestPath.distance,
    estimatedTime: longestPath.time,
    availableEdges: activeEdges,
  }
}

// Algoritmo de Bellman-Ford modificado para encontrar el camino más largo
function findLongestPathBellmanFord(
  start: string,
  end: string,
  edges: Edge[],
  optimizeFor: "distance" | "time",
): PathResult | null {
  // Obtener todos los nodos únicos
  const allNodes = new Set<string>()
  edges.forEach((edge) => {
    allNodes.add(edge.from)
    allNodes.add(edge.to)
  })

  const nodes = Array.from(allNodes)

  // Inicializar distancias
  const distances: Record<string, number> = {}
  const previous: Record<string, string | null> = {}

  nodes.forEach((node) => {
    distances[node] = node === start ? 0 : Number.NEGATIVE_INFINITY
    previous[node] = null
  })

  // Invertir los pesos para encontrar el camino más largo
  const invertedEdges = edges.map((edge) => {
    const cost = optimizeFor === "distance" ? edge.distance : edge.estimatedTime || edge.distance * 3
    return { ...edge, weight: -cost }
  })

  // Algoritmo de Bellman-Ford modificado
  // Repetir |V|-1 veces
  for (let i = 0; i < nodes.length - 1; i++) {
    let updated = false

    // Para cada arista
    for (const edge of invertedEdges) {
      const from = edge.from
      const to = edge.to
      const weight = edge.weight

      // Relajación
      if (distances[from] !== Number.NEGATIVE_INFINITY && distances[from] + weight > distances[to]) {
        distances[to] = distances[from] + weight
        previous[to] = from
        updated = true
      }
    }

    // Si no hubo actualizaciones, terminar
    if (!updated) break
  }

  // Verificar si hay un camino al destino
  if (distances[end] === Number.NEGATIVE_INFINITY) {
    return null
  }

  // Reconstruir el camino
  const path: string[] = []
  let current = end

  while (current) {
    path.unshift(current)
    current = previous[current] as string
  }

  // Calcular métricas reales (positivas)
  let totalDistance = 0
  let totalTime = 0

  for (let i = 0; i < path.length - 1; i++) {
    const from = path[i]
    const to = path[i + 1]

    const edge = edges.find((e) => e.from === from && e.to === to)
    if (edge) {
      totalDistance += edge.distance
      totalTime += edge.estimatedTime || edge.distance * 3
    }
  }

  return {
    path,
    distance: totalDistance,
    estimatedTime: totalTime,
    availableEdges: edges,
  }
}
