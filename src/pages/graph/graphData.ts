import { createServerSupabaseClient } from "../../services/supabase"
import { calculateDistance } from "../../utils/distancia"
import { Edge, NodeData, Vehicle, RouteAlgorithm, Condition} from "./interface"
import { mockNodes, mockEdges, mockConditions, mockVehicles, mockAlgorithms } from "../../pages/graph/graph.data"


// Función para recalcular las distancias y tiempos de las aristas
function updateEdgesWithNewDistances(edges: Edge[], nodes: { id: string, x: number, y: number }[]): Edge[] {
  // Crear un mapa de nodos para acceso rápido
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));

  return edges.map((edge) => {
    const sourceNode = nodeMap.get(edge.from);
    const targetNode = nodeMap.get(edge.to);

    if (!sourceNode || !targetNode) return edge; // Si alguno de los nodos no existe, no hacer nada

    // Calcular la distancia entre los nodos utilizando calculateDistance
    const distance = calculateDistance(
      sourceNode.x,
      sourceNode.y,
      targetNode.x,
      targetNode.y,
    );

    // Recalcular el tiempo estimado en función de la distancia calculada
    let estimatedTime = edge.estimatedTime;
    if (edge.estimatedTime && edge.distance) {
      const speedFactor = edge.estimatedTime / edge.distance;  // Factor de velocidad
      estimatedTime = distance * speedFactor;
    }

    // Retornar la arista actualizada con la nueva distancia y tiempo estimado
    return {
      ...edge,
      distance,
      estimatedTime,
    };
  });
}
// Llamada a la función para actualizar las aristas
const updatedEdges = updateEdgesWithNewDistances(mockEdges, mockNodes);

// Mostrar las aristas actualizadas
console.log(updatedEdges);

// Verificar si estamos en modo de desarrollo
const isDevelopment = import.meta.env.DEV;

// Función para evaluar condiciones booleanas
export function evalCondition(expression: string, values: ConditionMap): boolean {
  // Si la expresión es "true", siempre devolver true
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

// Obtener todos los vehículos
export async function getVehicles(): Promise<Vehicle[]> {
  if (isDevelopment) {
    return mockVehicles;
  }

  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase.from("vehicles").select("*");

    if (error) {
      console.error("Error fetching vehicles:", error);
      return [];
    }

    return data.map((vehicle) => ({
      id: vehicle.id,
      name: vehicle.name,
      type: vehicle.type,
      capacity: vehicle.capacity,
      speedFactor: vehicle.speed_factor,
      available: vehicle.available,
    }));
  } catch (error) {
    console.error("Error in getVehicles:", error);
    return [];
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
