import { getConditions } from "../graph/components/graph.algorimths";
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

  return result;
}

