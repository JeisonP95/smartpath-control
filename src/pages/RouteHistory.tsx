import { useState, useEffect } from "react"
import { getRouteHistory } from "../services/api"

interface RouteHistoryItem {
  id: number
  start_node: string
  end_node: string
  path: string
  distance: number
  estimated_time: number | null
  algorithm: string
  created_at: string
  vehicles: { name: string } | null
}

const RouteHistory = () => {
  const [history, setHistory] = useState<RouteHistoryItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await getRouteHistory()
        setHistory(data)
      } catch (error) {
        console.error("Error fetching route history:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [])

  // Función para formatear la fecha
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  // Función para formatear el camino
  const formatPath = (pathString: string): string => {
    try {
      const path = JSON.parse(pathString)
      return path.join(" → ")
    } catch {
      return pathString
    }
  }

  if (loading) {
    return <div className="route-history loading">Cargando historial...</div>
  }

  return (
    <div className="route-history">
      <h2>Historial de Rutas</h2>
      <p className="history-description">Últimas rutas calculadas en el sistema</p>

      {history.length === 0 ? (
        <div className="no-history">No hay rutas en el historial</div>
      ) : (
        <div className="history-list">
          {history.map((item) => (
            <div key={item.id} className="history-item">
              <div className="history-header">
                <div className="history-route">
                  <strong>{item.start_node}</strong> → <strong>{item.end_node}</strong>
                </div>
                <div className="history-date">{formatDate(item.created_at)}</div>
              </div>
              <div className="history-details">
                <div className="history-path">
                  <small>Ruta: {formatPath(item.path)}</small>
                </div>
                <div className="history-metrics">
                  <span className="history-distance">{item.distance.toFixed(2)} km</span>
                  {item.estimated_time && <span className="history-time">{Math.floor(item.estimated_time)} min</span>}
                </div>
                <div className="history-meta">
                  <span className="history-algorithm">
                    {item.algorithm.charAt(0).toUpperCase() + item.algorithm.slice(1)}
                  </span>
                  {item.vehicles && <span className="history-vehicle">{item.vehicles.name}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default RouteHistory
