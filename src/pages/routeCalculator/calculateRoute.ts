import { getConditions, getVehicles } from "../graph/components/graph.algorimths";
import { calculateDistance } from "../../utils/distancia";
import { evalCondition } from "../graph/components/graph.algorimths";
import { findShortestPathAStar } from "../../utils/astar";  // Función para calcular ruta usando A*
import { PathResult, NodeData, Edge } from "../graph/utils/interface";
import { createServerSupabaseClient } from "../../services/supabase";
import { ConditionMap } from "../graph/utils/interface";
import { updateEdgesWithNewDistances } from "../graph/components/graph.algorimths";

const isDevelopment = import.meta.env.DEV;

// Calcular ruta
export async function calculateRoute(
  startNode: string,
  endNode: string,
  optimizeFor: "distance" | "time",
  vehicleId: number | undefined,
  nodes: NodeData[],
  edges: Edge[]
): Promise<PathResult | null> {
  // Actualizar las aristas con las nuevas posiciones de los nodos
  const updatedEdges = updateEdgesWithNewDistances(edges, nodes);
  
  // Obtener condiciones actuales
  const conditionsData = await getConditions();
  const conditions: ConditionMap = {} as any;
  conditionsData.forEach((c) => {
    conditions[c.key] = c.active;
  });

  // Crear un mapa de nodos para acceso rápido
  const nodesMap: Record<string, { x: number; y: number }> = {};
  nodes.forEach((node) => {
    nodesMap[node.id] = { x: node.x, y: node.y };
  });

  // Obtener vehículo si se especificó
  let vehicleSpeedFactor = 1.0;
  if (vehicleId) {
    const vehicles = await getVehicles();
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (vehicle) {
      vehicleSpeedFactor = vehicle.speedFactor;
    }
  }

  // Calcular ruta usando A*
  const result: PathResult | null = findShortestPathAStar(
    startNode,
    endNode,
    updatedEdges,
    nodesMap,
    conditions,
    optimizeFor,
    vehicleId ?? 0
  );
  
  if (result && !isDevelopment) {
    try {
      const supabase = createServerSupabaseClient();
      await supabase.from("routes").insert({
        start_node: startNode,
        end_node: endNode,
        path: JSON.stringify(result.path),
        distance: result.distance,
        estimated_time: result.estimatedTime,
        vehicle_id: vehicleId,
        conditions_snapshot: JSON.stringify(conditions),
        algorithm: "astar",
      });
    } catch (error) {
      console.error("Error saving route to history:", error);
    }
  }

  if (result && vehicleId) {
    result.vehicleId = vehicleId;
  }

  return result;
}

// Función auxiliar para encontrar la ruta (implementación simplificada de A*)
function findPath(
  start: string,
  end: string,
  edges: any[],
  optimizeFor: "distance" | "time"
): string[] {
  // Implementación básica de búsqueda de ruta
  // Aquí deberías implementar tu algoritmo de ruta preferido (A*, Dijkstra, etc.)
  const visited = new Set<string>();
  const queue: { node: string; path: string[] }[] = [{ node: start, path: [start] }];
  
  while (queue.length > 0) {
    const { node, path } = queue.shift()!;
    
    if (node === end) {
      return path;
    }
    
    if (visited.has(node)) continue;
    visited.add(node);
    
    const neighbors = edges
      .filter(e => e.from === node)
      .map(e => e.to);
      
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        queue.push({ node: neighbor, path: [...path, neighbor] });
      }
    }
  }
  
  return [];
}