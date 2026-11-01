/**
 * Processador de streaming para datasets de geolocalização.
 * Permite processar arquivos de qualquer porte (até gigabytes) mantendo
 * uso de memória constante O(K), onde K é o número de entidades por timestamp.
 */

import fs from "node:fs";
import readline from "node:readline";
import path from "node:path";
import { parseLine } from "./parser.js";
import { detectEncountersInTimestamp } from "./detector.js";

/**
 * Processa um arquivo de dataset em formato CSV streaming e gera o JSON de saída com os encontros.
 *
 * @param {string} inputFilePath Caminho do arquivo de entrada (.txt)
 * @param {string} [outputFilePath] Caminho de saída (.json). Se omitido, não salva em disco.
 * @returns {Promise<{
 *   encounters: Array<object>,
 *   metrics: {
 *     linesProcessed: number,
 *     timestampsCount: number,
 *     durationMs: number,
 *     encountersByType: { generico: number, faccao: number, protetiva: number },
 *     outputFilePath?: string
 *   }
 * }>}
 */
export async function processDatasetStream(inputFilePath, outputFilePath = null) {
  const startTime = Date.now();

  if (!fs.existsSync(inputFilePath)) {
    throw new Error(`Arquivo de entrada não encontrado: ${inputFilePath}`);
  }

  const fileStream = fs.createReadStream(inputFilePath, { encoding: "utf-8" });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const allEncounters = [];
  let currentTimestamp = null;
  let currentBatch = [];
  let linesProcessed = 0;
  let timestampsCount = 0;

  const encountersByType = {
    generico: 0,
    faccao: 0,
    protetiva: 0
  };

  /**
   * Processa o lote acumulado para o timestamp atual.
   */
  function flushBatch() {
    if (currentBatch.length >= 2 && currentTimestamp !== null) {
      const detected = detectEncountersInTimestamp(currentTimestamp, currentBatch);
      for (const encounter of detected) {
        allEncounters.push(encounter);
        if (encountersByType[encounter.tipo] !== undefined) {
          encountersByType[encounter.tipo]++;
        }
      }
    }
  }

  for await (const line of rl) {
    linesProcessed++;
    const record = parseLine(line);
    if (!record) continue;

    if (record.timestamp !== currentTimestamp) {
      flushBatch();
      currentTimestamp = record.timestamp;
      currentBatch = [];
      timestampsCount++;
    }

    currentBatch.push(record);
  }

  // Processa o último lote remanescente
  flushBatch();

  const durationMs = Date.now() - startTime;

  // Se caminho de saída for especificado, salva o JSON resultante
  if (outputFilePath) {
    const dir = path.dirname(outputFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outputFilePath, JSON.stringify(allEncounters, null, 2), "utf-8");
  }

  return {
    encounters: allEncounters,
    metrics: {
      linesProcessed,
      timestampsCount,
      durationMs,
      encountersByType,
      totalEncounters: allEncounters.length,
      outputFilePath: outputFilePath || undefined
    }
  };
}

