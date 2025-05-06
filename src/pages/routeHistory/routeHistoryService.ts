import { createServerSupabaseClient } from "../../services/supabase";
import { PathResult } from "../graph/utils/interface";

// Guardar una nueva ruta en el historial
const mockRouteHistory: any[] = [
    {
      id: 1,
      start_node: "1",
      end_node: "3",
      path: JSON.stringify(["1", "6", "3"]),
      distance: 12,
      estimated_time: 38,
      algorithm: "astar",
      created_at: new Date().toISOString(),
<<<<<<< HEAD
      vehicles: { name: "Camión 1" },
    },
=======
   },
>>>>>>> 6e4952964f5dc2b5258f39d3a5ac438a483f2925
    {
      id: 2,
      start_node: "2",
      end_node: "1",
      path: JSON.stringify(["2", "5", "3", "1"]),
      distance: 25,
      estimated_time: 73,
      algorithm: "astar",
      created_at: new Date(Date.now() - 86400000).toISOString(), // Ayer
<<<<<<< HEAD
      vehicles: { name: "Furgoneta 1" },
    },
=======
},
>>>>>>> 6e4952964f5dc2b5258f39d3a5ac438a483f2925
  ];
const isDevelopment = import.meta.env.DEV;
export async function saveRoute(route: PathResult): Promise<boolean> {
  if (isDevelopment) {
    console.log("Saving route (mock):", route);
    return true;
  }

  try {
    const supabase = createServerSupabaseClient();
    const { error } = await supabase.from("routes").insert({
      start_node: route.path[0],
      end_node: route.path[route.path.length - 1],
      path: JSON.stringify(route.path),
      distance: route.distance,
      estimated_time: route.estimatedTime,
<<<<<<< HEAD
      vehicle_id: route.vehicleId,
=======
>>>>>>> 6e4952964f5dc2b5258f39d3a5ac438a483f2925
      algorithm: "custom",
    });

    if (error) {
      console.error("Error saving route:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in saveRoute:", error);
    return false;
  }
}

export async function getRouteHistory(limit = 10): Promise<any[]> {
  if (isDevelopment) {
    return mockRouteHistory;
  }

  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("routes")
      .select(`
        id, 
        start_node, 
        end_node, 
        path, 
        distance, 
        estimated_time, 
        algorithm, 
        created_at,
<<<<<<< HEAD
        vehicles(name)
      `)
=======
        `)
>>>>>>> 6e4952964f5dc2b5258f39d3a5ac438a483f2925
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching route history:", error);
      return [];
    }

    return data;
  } catch (error) {
    console.error("Error in getRouteHistory:", error);
    return [];
  }
}
