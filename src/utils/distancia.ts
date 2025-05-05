/* Calcula la distancia entre dos puntos en el plano y la convierte a una distancia en kilómetros */
export function calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
    // Calcular distancia 
    const pixelDistance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
  
    // Factor de conversión de píxeles a kilómetros 
    const scaleFactor = 0.05
  
    // Convertir a kilómetros y redondear a 1 decimal
    return Math.round(pixelDistance * scaleFactor * 10) / 10
  }
  