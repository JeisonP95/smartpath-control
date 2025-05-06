import { createServerSupabaseClient } from "../../../services/supabase"
import { calculateDistance } from "../../../utils/distancia"
import { Edge, NodeData, RouteAlgorithm, Condition, ConditionMap, ConditionKey} from "../utils/interface"
import { mockNodes, mockEdges, mockConditions, mockAlgorithms } from "./graph.data"

// Verificar si estamos en modo de desarrollo
const isDevelopment = import.meta.env.DEV;

// Función para evaluar condiciones booleanas
export function evalCondition(expression: string, values: ConditionMap): boolean {
  if (expression === "true") {
    return true;
  }
  
  try {
    const keys = Object.keys(values) as (keyof ConditionMap)[];
    const args = keys.map(k => values[k]);
    const fn = new Function(...keys, `return ${expression}`);
    return fn(...args);
  } catch {
    return false;
  }
}

// Función para recalcular las distancias y tiempos de las aristas
export function updateEdgesWithNewDistances(edges: Edge[], nodes: NodeData[]): Edge[] {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));

  return edges.map((edge) => {
    const sourceNode = nodeMap.get(edge.from);
    const targetNode = nodeMap.get(edge.to);

    if (!sourceNode || !targetNode) return edge;

    const distance = calculateDistance(
      sourceNode.x,
      sourceNode.y,
      targetNode.x,
      targetNode.y,
    );

    let estimatedTime = edge.estimatedTime;
    if (edge.estimatedTime && edge.distance) {
      const speedFactor = edge.estimatedTime / edge.distance;
      estimatedTime = distance * speedFactor;
    }

    return {
      ...edge,
      distance,
      estimatedTime,
    };
  });
}

// Obtener todos los nodos
export async function getNodes(): Promise<NodeData[]> {
  if (isDevelopment) {
    return mockNodes;
  }

  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase.from("nodes").select("*");

    if (error) {
      console.error("Error fetching nodes:", error);
      return [];
    }

    return data.map((node) => ({
      id: node.node_id,
      label: node.label,
      x: node.x,
      y: node.y,
      type: node.type as "bodega" | "zonaCarga" | "distribucion",
      latitude: node.latitude,
      longitude: node.longitude,
    }));
  } catch (error) {
    console.error("Error in getNodes:", error);
    return [];
  }
}

// Obtener todas las aristas
export async function getEdges(): Promise<Edge[]> {
  if (isDevelopment) {
    return mockEdges;
  }

  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase.from("edges").select("*");

    if (error) {
      console.error("Error fetching edges:", error);
      return [];
    }

    return data.map((edge) => ({
      id: edge.id,
      from: edge.from_node,
      to: edge.to_node,
      condition: edge.condition,
      bidirectional: edge.bidirectional,
      distance: edge.distance,
      estimatedTime: edge.estimated_time,
      trafficFactor: edge.traffic_factor,
    }));
  } catch (error) {
    console.error("Error in getEdges:", error);
    return [];
  }
}

// Obtener todas las condiciones
export async function getConditions(): Promise<Condition[]> {
  if (isDevelopment) {
    return mockConditions;
  }

  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase.from("conditions").select("*");

    if (error) {
      console.error("Error fetching conditions:", error);
      return [];
    }

    return data.map((condition) => ({
      key: condition.key as ConditionKey,
      label: condition.label,
      description: condition.description || "",
      icon: condition.icon || "❓",
      active: condition.active,
    }));
  } catch (error) {
    console.error("Error in getConditions:", error);
    return [];
  }
}

// Actualizar una condición
export async function updateCondition(key: string, active: boolean): Promise<boolean> {
  if (isDevelopment) {
    const index = mockConditions.findIndex((c) => c.key === key);
    if (index !== -1) {
      mockConditions[index].active = active;
      return true;
    }
    return false;
  }

  try {
    const supabase = createServerSupabaseClient();
    const { error } = await supabase.from("conditions").update({ active }).eq("key", key);

    if (error) {
      console.error("Error updating condition:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in updateCondition:", error);
    return false;
  }
}

// Obtener algoritmos de ruta disponibles
export async function getRouteAlgorithms(): Promise<RouteAlgorithm[]> {
  if (isDevelopment) {
    return mockAlgorithms;
  }

  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase.from("algorithms").select("*");

    if (error) {
      console.error("Error fetching algorithms:", error);
      return [];
    }

    return data.map((algorithm) => ({
      name: algorithm.name,
      description: algorithm.description || "",
    }));
  } catch (error) {
    console.error("Error in getRouteAlgorithms:", error);
    return [];
  }
}
