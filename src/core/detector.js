/**
 * Módulo de detecção de encontros físicos em um determinado timestamp.
 * Utiliza o algoritmo espacial Sweep-Line por latitude para otimizar o tempo de busca
 * de O(K^2) para praticamente O(K log K) por batch.
 */

import { calculateHaversineDistance, getMaxDeltaLat } from "../utils/haversine.js";
import { classifyEncounter } from "./classifier.js";

export const ENCOUNTER_DISTANCE_THRESHOLD_METERS = 20.0;
const MAX_DELTA_LAT = getMaxDeltaLat(ENCOUNTER_DISTANCE_THRESHOLD_METERS);

/**
 * Detecta todos os encontros entre entidades dentro do mesmo timestamp.
 *
 * @param {string} timestamp Timestamp do lote de medições
 * @param {Array<object>} points Array de entidades com posições no mesmo timestamp
 * @returns {Array<object>} Lista de encontros detectados no formato especificado
 */
export function detectEncountersInTimestamp(timestamp, points) {
  if (!points || points.length < 2) {
    return [];
  }

  // Ordena por latitude para permitir poda antecipada por Sweep-Line
  points.sort((a, b) => a.lat - b.lat);

  const encounters = [];
  const registeredPairs = new Set();
  const n = points.length;

  for (let i = 0; i < n; i++) {
    const p1 = points[i];

    for (let j = i + 1; j < n; j++) {
      const p2 = points[j];

      // Como o array está ordenado por latitude, se o delta de latitude
      // ultrapassar a distância máxima linear, nenhum ponto subsequente poderá estar a < 20m.
      if (p2.lat - p1.lat > MAX_DELTA_LAT) {
        break;
      }

      // Evita duplicidade se porventura houver múltiplos registros idênticos
      const minId = Math.min(p1.id, p2.id);
      const maxId = Math.max(p1.id, p2.id);
      const pairKey = `${minId}-${maxId}`;

      if (registeredPairs.has(pairKey)) {
        continue;
      }

      // Se passou na poda espacial, calcula a distância geodésica exata via Haversine
      const distance = calculateHaversineDistance(p1.lat, p1.lon, p2.lat, p2.lon);

      if (distance < ENCOUNTER_DISTANCE_THRESHOLD_METERS) {
        registeredPairs.add(pairKey);

        const tipo = classifyEncounter(p1, p2);

        // Organiza as posições mapeadas pelo ID do monitorado
        const posicoes = {};
        posicoes[p1.id] = { lat: p1.lat, lon: p1.lon };
        posicoes[p2.id] = { lat: p2.lat, lon: p2.lon };

        encounters.push({
          tipo,
          monitoradosEncontro: [minId, maxId],
          timestamp,
          posicoes,
          distanciaMetros: distance
        });
      }
    }
  }

  return encounters;
}

