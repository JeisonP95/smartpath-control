import type { Edge } from "../data"

// Define el tipo ConditionMap para uso interno
export type ConditionMap = Record<string, boolean>

// Implementación del algoritmo de Dijkstra para encontrar la ruta más corta
export function findShortestPathDijkstra(
  start: string,
  end: string,
  activeEdges: Edge[],
  optimizeFor: "distance" | "time" = "distance",
): { path: string[]; distance: number; estimatedTime: number } | null {
  const distances: Record<string, number> = {}
  const times: Record<string, number> = {}
  const previous: Record<string, string | null> = {}
  const unvisited = new Set<string>()

  // Obtener todos los nodos únicos
  const allNodes = new Set<string>()
  activeEdges.forEach((edge) => {
    allNodes.add(edge.from)
    allNodes.add(edge.to)
  })

  // Inicializar distancias y tiempos
  allNodes.forEach((node) => {
    distances[node] = node === start ? 0 : Number.POSITIVE_INFINITY
    times[node] = node === start ? 0 : Number.POSITIVE_INFINITY
    previous[node] = null
    unvisited.add(node)
  })

  while (unvisited.size > 0) {
    // Encontrar el nodo no visitado con la menor distancia/tiempo
    let current: string | null = null
    let minValue = Number.POSITIVE_INFINITY

    unvisited.forEach((node) => {
      const value = optimizeFor === "distance" ? distances[node] : times[node]
      if (value < minValue) {
        minValue = value
        current = node
      }
    })

    // Si no hay camino o llegamos al destino
    if (current === null || current === end || minValue === Number.POSITIVE_INFINITY) {
      break
    }

    unvisited.delete(current)

    // Buscar vecinos del nodo actual
    for (const edge of activeEdges) {
      if (edge.from === current) {
        const neighbor = edge.to
        const newDistance = distances[current] + edge.distance
        const newTime = times[current] + (edge.estimatedTime || edge.distance * 3) // Tiempo estimado o aproximado

        if (optimizeFor === "distance" && newDistance < distances[neighbor]) {
          distances[neighbor] = newDistance
          times[neighbor] = newTime
          previous[neighbor] = current
        } else if (optimizeFor === "time" && newTime < times[neighbor]) {
          distances[neighbor] = newDistance
          times[neighbor] = newTime
          previous[neighbor] = current
        }
      }
    }
  }

  // Construir el camino
  if (
    (optimizeFor === "distance" && distances[end] === Number.POSITIVE_INFINITY) ||
    (optimizeFor === "time" && times[end] === Number.POSITIVE_INFINITY)
  ) {
    return null // No hay camino
  }

  const path: string[] = []
  let current = end

  while (current) {
    path.unshift(current)
    current = previous[current] || ""
    if (current === start) {
      path.unshift(start)
      break
    }
    if (!current) break
  }

  return {
    path,
    distance: distances[end],
    estimatedTime: times[end],
  }
}

// Implementación del algoritmo A* para encontrar la ruta más corta
export function findShortestPathAStar(
  start: string,
  end: string,
  activeEdges: Edge[],
  nodes: Record<string, { x: number; y: number }>,
  optimizeFor: "distance" | "time" = "distance",
): { path: string[]; distance: number; estimatedTime: number } | null {
  // Función heurística: distancia euclidiana
  const heuristic = (nodeId: string): number => {
    if (!nodes[nodeId] || !nodes[end]) return 0

    const dx = nodes[nodeId].x - nodes[end].x
    const dy = nodes[nodeId].y - nodes[end].y
    return Math.sqrt(dx * dx + dy * dy)
  }

  const openSet = new Set<string>([start])
  const closedSet = new Set<string>()

  const gScore: Record<string, number> = {} // Costo desde el inicio
  const fScore: Record<string, number> = {} // Costo estimado total
  const tScore: Record<string, number> = {} // Tiempo acumulado
  const previous: Record<string, string | null> = {}

  // Obtener todos los nodos únicos
  const allNodes = new Set<string>()
  activeEdges.forEach((edge) => {
    allNodes.add(edge.from)
    allNodes.add(edge.to)
  })

  // Inicializar scores
  allNodes.forEach((node) => {
    gScore[node] = node === start ? 0 : Number.POSITIVE_INFINITY
    fScore[node] = node === start ? heuristic(node) : Number.POSITIVE_INFINITY
    tScore[node] = node === start ? 0 : Number.POSITIVE_INFINITY
    previous[node] = null
  })

  while (openSet.size > 0) {
    // Encontrar el nodo con menor fScore en openSet
    let current: string | null = null
    let lowestFScore = Number.POSITIVE_INFINITY

    openSet.forEach((node) => {
      if (fScore[node] < lowestFScore) {
        lowestFScore = fScore[node]
        current = node
      }
    })

    if (current === null) break

    // Si llegamos al destino
    if (current === end) {
      // Construir el camino
      const path: string[] = []
      let currentNode: string | null = end

      // Reconstruir el camino hasta llegar al inicio o encontrar un null
      while (currentNode !== null) {
        path.unshift(currentNode)
        if (currentNode === start) break // Si llegamos al inicio, terminamos
        currentNode = previous[currentNode] // Movernos al nodo anterior
      }

      return {
        path,
        distance: gScore[end],
        estimatedTime: tScore[end],
      }
    }

    openSet.delete(current)
    closedSet.add(current)

    // Buscar vecinos
    for (const edge of activeEdges) {
      if (edge.from === current) {
        const neighbor = edge.to

        if (closedSet.has(neighbor)) continue

        const tentativeGScore = gScore[current] + edge.distance
        const tentativeTScore = tScore[current] + (edge.estimatedTime || edge.distance * 3)

        if (!openSet.has(neighbor)) {
          openSet.add(neighbor)
        } else if (tentativeGScore >= gScore[neighbor] && optimizeFor === "distance") {
          continue
        } else if (tentativeTScore >= tScore[neighbor] && optimizeFor === "time") {
          continue
        }

        previous[neighbor] = current
        gScore[neighbor] = tentativeGScore
        tScore[neighbor] = tentativeTScore

        if (optimizeFor === "distance") {
          fScore[neighbor] = gScore[neighbor] + heuristic(neighbor)
        } else {
          fScore[neighbor] = tScore[neighbor] + heuristic(neighbor) / 3 // Ajuste para tiempo
        }
      }
    }
  }

  return null // No hay camino

}
// Implementación del algoritmo Floyd-Warshall para encontrar todas las rutas más cortas
export function findAllShortestPathsFloydWarshall(
  activeEdges: Edge[],
  optimizeFor: "distance" | "time" = "distance",
): Record<string, Record<string, { distance: number; path: string[]; estimatedTime: number }>> {
  // Obtener todos los nodos únicos
  const allNodes = new Set<string>()
  activeEdges.forEach((edge) => {
    allNodes.add(edge.from)
    allNodes.add(edge.to)
  })

  const nodes = Array.from(allNodes)
  const n = nodes.length

  // Inicializar matrices de distancia, tiempo y camino
  const dist: number[][] = Array(n)
    .fill(0)
    .map(() => Array(n).fill(Number.POSITIVE_INFINITY))
  const time: number[][] = Array(n)
    .fill(0)
    .map(() => Array(n).fill(Number.POSITIVE_INFINITY))
  const next: (string | null)[][] = Array(n)
    .fill(0)
    .map(() => Array(n).fill(null))

  // Mapeo de nodos a índices
  const nodeToIndex: Record<string, number> = {}
  nodes.forEach((node, index) => {
    nodeToIndex[node] = index
    dist[index][index] = 0
    time[index][index] = 0
  })

  // Llenar matrices con aristas directas
  activeEdges.forEach((edge) => {
    const u = nodeToIndex[edge.from]
    const v = nodeToIndex[edge.to]

    dist[u][v] = edge.distance
    time[u][v] = edge.estimatedTime || edge.distance * 3
    next[u][v] = edge.to
  })

  // Algoritmo Floyd-Warshall
  for (let k = 0; k < n; k++) {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const throughK = optimizeFor === "distance" ? dist[i][k] + dist[k][j] : time[i][k] + time[k][j]

        const direct = optimizeFor === "distance" ? dist[i][j] : time[i][j]

        if (throughK < direct) {
          if (optimizeFor === "distance") {
            dist[i][j] = throughK
            time[i][j] = time[i][k] + time[k][j] // Actualizar tiempo también
          } else {
            time[i][j] = throughK
            dist[i][j] = dist[i][k] + dist[k][j] // Actualizar distancia también
          }

          next[i][j] = next[i][k]
        }
      }
    }
  }

  // Construir resultado
  const result: Record<string, Record<string, { distance: number; path: string[]; estimatedTime: number }>> = {}

  nodes.forEach((from) => {
    result[from] = {}

    nodes.forEach((to) => {
      if (from === to) return

      const i = nodeToIndex[from]
      const j = nodeToIndex[to]

      if (dist[i][j] === Number.POSITIVE_INFINITY) return

      // Reconstruir camino
      const path: string[] = [from]
      let current = from

      while (current !== to) {
        const nextNode = next[nodeToIndex[current]][j]
        if (nextNode === null) break

        path.push(nextNode)
        current = nextNode
      }

      result[from][to] = {
        distance: dist[i][j],
        estimatedTime: time[i][j],
        path,
      }
    })
  })

  return result
}

// Función para evaluar condiciones booleanas
export function evalCondition(expression: string, values: ConditionMap): boolean {
  try {
    // Asegurarse de que todos los valores necesarios estén presentes
    const keys = Object.keys(values)
    const args = keys.map((k) => values[k])

    // Crear una función segura para evaluar la expresión
    const fn = new Function(...keys, `return ${expression}`)
    return fn(...args)
  } catch (error) {
    console.error("Error evaluating condition:", error)
    return false
  }
}
