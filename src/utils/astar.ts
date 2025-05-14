import type { Edge, PathResult, ConditionMap } from "../pages/graph/utils/interface"
import { evalCondition } from "../pages/graph/components/graph.algorimths"

// Función para verificar si alguna condición está activa
function isAnyConditionActive(conditions: ConditionMap): boolean {
  return Object.values(conditions).some((value) => value === true)
}

// Función heurística para estimar la distancia entre dos nodos (para A*)
function heuristic(node: string, end: string, nodesMap: Record<string, { x: number; y: number }>): number {
  const nodePos = nodesMap[node]
  const endPos = nodesMap[end]

  if (!nodePos || !endPos) return Number.POSITIVE_INFINITY

  return Math.sqrt(Math.pow(nodePos.x - endPos.x, 2) + Math.pow(nodePos.y - endPos.y, 2))
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
  // Verificar si hay alguna condición activa
  const shouldFindLongestPath = isAnyConditionActive(conditions)

  // Filtrar aristas activas según las condiciones y manejar bidireccionalidad
  const activeEdges: Edge[] = []

  edges.forEach((edge) => {
    if (evalCondition(edge.condition, conditions)) {
      activeEdges.push(edge)
      if (edge.bidirectional) {
        const exists = activeEdges.some((e) => e.from === edge.to && e.to === edge.from)
        if (!exists) {
          activeEdges.push({ ...edge, from: edge.to, to: edge.from })
        }
      }
    }
  })

  if (activeEdges.length === 0) {
    return null // No hay rutas válidas
  }

  // Elegir el algoritmo apropiado
  if (shouldFindLongestPath) {
    return findLongestPath(start, end, activeEdges, nodesMap, optimizeFor)
  } else {
    return findOriginalShortestPath(start, end, activeEdges, nodesMap, optimizeFor)
  }
}

// Algoritmo original para la ruta más corta
function findOriginalShortestPath(
  start: string,
  end: string,
  activeEdges: Edge[],
  nodesMap: Record<string, { x: number; y: number }>,
  optimizeFor: "distance" | "time",
): PathResult | null {
  const openSet = new Set<string>([start])
  const closedSet = new Set<string>()
  const gScore: Record<string, number> = {}
  const fScore: Record<string, number> = {}
  const previous: Record<string, string | null> = {}

  const allNodes = new Set<string>()
  activeEdges.forEach((edge) => {
    allNodes.add(edge.from)
    allNodes.add(edge.to)
  })

  allNodes.forEach((node) => {
    gScore[node] = node === start ? 0 : Number.POSITIVE_INFINITY
    fScore[node] = node === start ? heuristic(start, end, nodesMap) : Number.POSITIVE_INFINITY
    previous[node] = null
  })

  while (openSet.size > 0) {
    let current: string | null = null
    let lowestFScore = Number.POSITIVE_INFINITY

    openSet.forEach((node) => {
      if (fScore[node] < lowestFScore) {
        lowestFScore = fScore[node]
        current = node
      }
    })

    if (current === null) break
    if (current === end) {
      return reconstructPath(current, previous, activeEdges)
    }

    openSet.delete(current)
    closedSet.add(current)

    for (const edge of activeEdges) {
      if (edge.from === current) {
        const neighbor = edge.to
        if (closedSet.has(neighbor)) continue

        const costMetric = optimizeFor === "distance" ? edge.distance : edge.estimatedTime || edge.distance * 3
        const tentativeGScore = gScore[current] + costMetric

        if (tentativeGScore < gScore[neighbor]) {
          previous[neighbor] = current
          gScore[neighbor] = tentativeGScore
          fScore[neighbor] = tentativeGScore + heuristic(neighbor, end, nodesMap)
          openSet.add(neighbor)
        }
      }
    }
  }

  return null
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

// Función para reconstruir el camino y calcular métricas
function reconstructPath(current: string, previous: Record<string, string | null>, edges: Edge[]): PathResult {
  const path: string[] = []
  let node: string = current
  let totalDistance = 0
  let totalTime = 0

  while (node) {
    path.unshift(node)
    const prev = previous[node]

    if (prev) {
      const edge = edges.find((e) => e.from === prev && e.to === node)
      if (edge) {
        totalDistance += edge.distance
        totalTime += edge.estimatedTime || edge.distance * 3
      }
    }

    node = prev as string
  }

  return {
    path,
    distance: totalDistance,
    estimatedTime: totalTime,
    availableEdges: edges,
  }
}
