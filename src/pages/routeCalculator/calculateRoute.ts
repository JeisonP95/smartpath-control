import { getConditions, getEdges, getNodes, getVehicles } from "../graph/graphData";
import { calculateDistance } from "../../utils/distancia";
import { evalCondition } from "../graph/graphData";
import { findShortestPathAStar } from "../../utils/astar";  // Función para calcular ruta usando A*
import { PathResult } from "../graph/interface";
import { createServerSupabaseClient } from "../../services/supabase";
import { ConditionMap } from "../graph/interface";



const isDevelopment = import.meta.env.DEV;


// Calcular ruta
export async function calculateRoute(
  start: string,
  end: string,
  optimizeFor: "distance" | "time" = "distance",
  vehicleId?: number,
): Promise<PathResult | null> {
  // Obtener condiciones actuales
  const conditionsData = await getConditions();
  const conditions: ConditionMap = {} as any;
  conditionsData.forEach((c) => {
    conditions[c.key] = c.active;
  });

  // Obtener aristas y nodos
  const edges = await getEdges();
  const nodes = await getNodes();

  // Crear un mapa de nodos para acceso rápido
  const nodesMap: Record<string, { x: number; y: number }> = {};
  nodes.forEach((node) => {
    nodesMap[node.id] = { x: node.x, y: node.y };
  });

  // Recalcular distancias de aristas basadas en las posiciones de los nodos
  const edgesWithUpdatedDistances = edges.map(edge => {
    const sourceNode = nodes.find(n => n.id === edge.from);
    const targetNode = nodes.find(n => n.id === edge.to);
    
    if (sourceNode && targetNode) {
      // Usar la función calculateDistance para calcular la distancia real
      const calculatedDistance = calculateDistance(
        sourceNode.x,
        sourceNode.y,
        targetNode.x,
        targetNode.y
      );
      
      // Actualizar el tiempo estimado basado en la nueva distancia
      const estimatedTime = edge.estimatedTime ? 
        (calculatedDistance / edge.distance) * edge.estimatedTime : 
        calculatedDistance * 3; // Default: 3 minutos por kilómetro
      
      return {
        ...edge,
        distance: calculatedDistance,
        estimatedTime: estimatedTime
      };
    }
    
    return edge;
  });

  // Filtrar aristas activas según condiciones
  const activeEdges = edgesWithUpdatedDistances.filter((edge) => evalCondition(edge.condition, conditions));

  // Obtener vehículo si se especificó
  let vehicleSpeedFactor = 1.0;
  if (vehicleId) {
    const vehicles = await getVehicles();
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (vehicle) {
      vehicleSpeedFactor = vehicle.speedFactor;
    }
  }

  // Ajustar tiempos estimados según el vehículo
  const adjustedEdges = activeEdges.map((edge) => ({
    ...edge,
    estimatedTime: (edge.estimatedTime || edge.distance * 3) / vehicleSpeedFactor,
  }));



  // Calcular ruta usando A*
  const result: PathResult | null = findShortestPathAStar(
    start,
    end,
    adjustedEdges,
    nodesMap,
    conditions,       // <== Faltaba
    optimizeFor,      // <== Ya lo tenías
    vehicleId ?? 0    // <== Faltaba. Asegúrate de pasar un número (puedes usar 0 como valor por defecto si no se define)
  );
  

  // Si se encontró una ruta y no estamos en desarrollo, guardarla en el historial
  if (result && !isDevelopment) {
    try {
      const supabase = createServerSupabaseClient();
      await supabase.from("routes").insert({
        start_node: start,
        end_node: end,
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