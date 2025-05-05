import { Edge, PathResult, ConditionMap } from "../pages/graph/utils/interface";
import { evalCondition } from "../pages/graph/components/graph.algorimths";

// Función heurística para estimar la distancia entre dos nodos (para A*)
function heuristic(
  node: string,
  end: string,
  nodesMap: Record<string, { x: number; y: number }>
): number {
  const nodePos = nodesMap[node];
  const endPos = nodesMap[end];

  if (!nodePos || !endPos) return Infinity;

  return Math.sqrt(
    Math.pow(nodePos.x - endPos.x, 2) +
    Math.pow(nodePos.y - endPos.y, 2)
  );
}

export function findShortestPathAStar(
  start: string,
  end: string,
  edges: Edge[],
  nodesMap: Record<string, { x: number; y: number }>,
  conditions: ConditionMap,
  optimizeFor: "distance" | "time" = "distance",
  vehicleId: number // Ahora es obligatorio y debe ser un número
): PathResult | null {
  const activeEdges: Edge[] = [];

  edges.forEach(edge => {
    if (evalCondition(edge.condition, conditions)) {
      activeEdges.push(edge);
      if (edge.bidirectional) {
        const exists = activeEdges.some(e => e.from === edge.to && e.to === edge.from);
        if (!exists) {
          activeEdges.push({ ...edge, from: edge.to, to: edge.from });
        }
      }
    }
  });

  const openSet = new Set<string>([start]);
  const closedSet = new Set<string>();
  const gScore: Record<string, number> = {};
  const fScore: Record<string, number> = {};
  const previous: Record<string, string | null> = {};

  const allNodes = new Set<string>();
  activeEdges.forEach(edge => {
    allNodes.add(edge.from);
    allNodes.add(edge.to);
  });

  allNodes.forEach(node => {
    gScore[node] = node === start ? 0 : Infinity;
    fScore[node] = node === start ? heuristic(start, end, nodesMap) : Infinity;
    previous[node] = null;
  });

  while (openSet.size > 0) {
    let current: string | null = null;
    let lowestFScore = Infinity;

    openSet.forEach(node => {
      if (fScore[node] < lowestFScore) {
        lowestFScore = fScore[node];
        current = node;
      }
    });

    if (current === null) break;
    if (current === end) {
      const path: string[] = [];
      let node: string = current;
      let totalDistance = 0;
      let totalTime = 0;

      while (node) {
        path.unshift(node);
        const prev = previous[node];

        if (prev) {
          const edge = activeEdges.find(e => e.from === prev && e.to === node);
          if (edge) {
            totalDistance += edge.distance;
            totalTime += edge.estimatedTime || (edge.distance * 3);
          }
        }

        node = prev as string;
      }

      return {
        path,
        distance: totalDistance,
        estimatedTime: totalTime,
        vehicleId, // Ahora es un number, se pasa directamente
        availableEdges: activeEdges
      };
    }

    openSet.delete(current);
    closedSet.add(current);

    for (const edge of activeEdges) {
      if (edge.from === current) {
        const neighbor = edge.to;
        if (closedSet.has(neighbor)) continue;

        const costMetric = optimizeFor === "distance" ? edge.distance : (edge.estimatedTime || edge.distance * 3);
        const tentativeGScore = gScore[current] + costMetric;

        if (tentativeGScore < gScore[neighbor]) {
          previous[neighbor] = current;
          gScore[neighbor] = tentativeGScore;
          fScore[neighbor] = tentativeGScore + heuristic(neighbor, end, nodesMap);
          openSet.add(neighbor);
        }
      }
    }
  }

  return null;
}
