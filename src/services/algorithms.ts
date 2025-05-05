import type { Edge } from "."

// Define el tipo ConditionMap para uso interno
export type ConditionMap = Record<string, boolean>

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
// Función para evaluar condiciones booleanas
/**
 * Evaluates a string expression using provided variable values
 * @param expression - The string expression to evaluate
 * @param values - Map of variable names to their values
 * @returns The boolean result of the evaluated expression
 */
export function evalCondition(expression: string, values: Record<string, any>): boolean {
  try {
    // Extract keys and values from the condition map
    const keys = Object.keys(values);
    const args = Object.values(values);
    
    // Create a function that evaluates the expression with the provided values
    const fn = new Function(...keys, `return ${expression}`);
    return Boolean(fn(...args));
  } catch (error) {
    console.error("Error evaluating condition:", error);
    return false;
  }

}
