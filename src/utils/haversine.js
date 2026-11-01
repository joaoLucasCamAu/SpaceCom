/**
 * Constantes e funções para cálculos geodésicos utilizando a Fórmula de Haversine.
 * Raio da Terra fixado em 6.371.000 metros conforme especificação do desafio.
 */

export const EARTH_RADIUS_METERS = 6371000;

/**
 * Converte graus decimais para radianos.
 * @param {number} deg
 * @returns {number}
 */
export function toRadians(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * Converte radianos para graus decimais.
 * @param {number} rad
 * @returns {number}
 */
export function toDegrees(rad) {
  return (rad * 180) / Math.PI;
}

/**
 * Calcula a distância do grande círculo entre dois pontos geográficos
 * na superfície da Terra utilizando a Fórmula de Haversine.
 *
 * @param {number} lat1 Latitude do primeiro ponto em graus decimais
 * @param {number} lon1 Longitude do primeiro ponto em graus decimais
 * @param {number} lat2 Latitude do segundo ponto em graus decimais
 * @param {number} lon2 Longitude do segundo ponto em graus decimais
 * @returns {number} Distância em metros
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const phi1 = toRadians(lat1);
  const phi2 = toRadians(lat2);
  const deltaPhi = toRadians(lat2 - lat1);
  const deltaLambda = toRadians(lon2 - lon1);

  const sinDeltaPhiHalf = Math.sin(deltaPhi / 2);
  const sinDeltaLambdaHalf = Math.sin(deltaLambda / 2);

  const a =
    sinDeltaPhiHalf * sinDeltaPhiHalf +
    Math.cos(phi1) * Math.cos(phi2) * sinDeltaLambdaHalf * sinDeltaLambdaHalf;

  // Garantir limites numéricos para evitar erros por imprecisão de ponto flutuante
  const clampedA = Math.min(1, Math.max(0, a));
  const c = 2 * Math.atan2(Math.sqrt(clampedA), Math.sqrt(1 - clampedA));

  return EARTH_RADIUS_METERS * c;
}

/**
 * Calcula a variação angular máxima em latitude (graus) correspondente a uma distância em metros.
 * Útil para filtragem prévia (bounding box) antes do cálculo completo de Haversine.
 *
 * @param {number} distanceMeters
 * @param {number} [safetyMargin=1.0001] Fator de segurança multiplicador
 * @returns {number} Variação máxima em graus de latitude
 */
export function getMaxDeltaLat(distanceMeters, safetyMargin = 1.0001) {
  return toDegrees(distanceMeters / EARTH_RADIUS_METERS) * safetyMargin;
}

