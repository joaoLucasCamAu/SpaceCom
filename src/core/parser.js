/**
 * Módulo responsável pela interpretação e parsing das linhas de entrada no formato CSV (separador ';').
 */

/**
 * Remove aspas duplas ao redor ou dentro de uma string de campo CSV.
 * @param {string} str
 * @returns {string}
 */
function cleanString(str) {
  if (!str) return "";
  return str.replace(/"/g, "").trim();
}

/**
 * Realiza o parse de uma única linha do arquivo de dataset.
 *
 * Formato esperado:
 * idMonitorado;faccaoMonitorado;timestamp;latitude;longitude;medidaProtetiva;idsRestricaoMedida
 *
 * @param {string} line
 * @returns {object|null} Objeto com os dados normalizados ou null se linha inválida ou cabeçalho.
 */
export function parseLine(line) {
  if (!line) return null;
  const trimmed = line.trim();
  if (!trimmed) return null;

  const parts = trimmed.split(";");
  if (parts.length < 5) return null;

  const idRaw = cleanString(parts[0]);
  const id = parseInt(idRaw, 10);
  if (isNaN(id)) {
    // Linha de cabeçalho ou dados corrompidos
    return null;
  }

  const faccaoRaw = cleanString(parts[1]);
  const faccao = faccaoRaw.length > 0 ? faccaoRaw : null;

  const timestamp = cleanString(parts[2]);
  const latitude = parseFloat(cleanString(parts[3]));
  const longitude = parseFloat(cleanString(parts[4]));

  const medidaProtetiva = cleanString(parts[5]).toLowerCase() === "true";

  const restricaoIds = new Set();
  if (parts[6]) {
    const rawIds = cleanString(parts[6]);
    if (rawIds.length > 0) {
      const splitIds = rawIds.split(",");
      for (const rawId of splitIds) {
        const parsedId = parseInt(rawId.trim(), 10);
        if (!isNaN(parsedId)) {
          restricaoIds.add(parsedId);
        }
      }
    }
  }

  return {
    id,
    faccao,
    timestamp,
    lat: latitude,
    lon: longitude,
    medidaProtetiva,
    idsRestricaoMedida: restricaoIds
  };
}

