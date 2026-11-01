#!/usr/bin/env node

/**
 * Ponto de entrada da aplicação SpaceCom - Detector de Encontros de Geolocalização.
 */

import path from "node:path";
import fs from "node:fs";
import { processDatasetStream } from "./core/streamProcessor.js";

const DEFAULT_DATA_DIR = path.resolve(process.cwd(), "data");
const DEFAULT_OUTPUT_DIR = path.resolve(process.cwd(), "output");

/**
 * Exibe a mensagem de ajuda no terminal.
 */
function showHelp() {
  console.log(`
Uso:
  node src/index.js [caminho_do_arquivo.txt] [caminho_de_saida.json]
  node src/index.js --all

Exemplos:
  node src/index.js data/dataset1.txt
  node src/index.js data/dataset2.txt output/resultado_ds2.json
  npm start               (processa todos os datasets em data/)
  npm run process:all    (processa todos os datasets em data/)
`);
}

/**
 * Formata números com separador de milhar.
 */
function formatNumber(num) {
  return new Intl.NumberFormat("pt-BR").format(num);
}

/**
 * Executa o processamento de um único arquivo e exibe os resultados.
 */
async function processSingleFile(inputFile, outputFile = null) {
  const resolvedInput = path.resolve(process.cwd(), inputFile);
  const baseName = path.basename(resolvedInput, path.extname(resolvedInput));
  const resolvedOutput = outputFile
    ? path.resolve(process.cwd(), outputFile)
    : path.join(DEFAULT_OUTPUT_DIR, `${baseName}.json`);

  console.log(`\n======================================================`);
  console.log(`Processando: ${path.basename(resolvedInput)}`);
  console.log(`Saída JSON : ${resolvedOutput}`);
  console.log(`======================================================`);

  const { encounters, metrics } = await processDatasetStream(resolvedInput, resolvedOutput);

  console.log(`Linhas lidas         : ${formatNumber(metrics.linesProcessed)}`);
  console.log(`Timestamps únicos    : ${formatNumber(metrics.timestampsCount)}`);
  console.log(`Tempo decorrido      : ${(metrics.durationMs / 1000).toFixed(3)}s`);
  console.log(`Total de encontros   : ${metrics.totalEncounters}`);
  console.log(`  - Genéricos        : ${metrics.encountersByType.generico}`);
  console.log(`  - Mesma Facção     : ${metrics.encountersByType.faccao}`);
  console.log(`  - Medida Protetiva : ${metrics.encountersByType.protetiva}`);

  return { file: path.basename(resolvedInput), ...metrics };
}

/**
 * Processa todos os datasets presentes na pasta 'data'.
 */
async function processAllDatasets() {
  if (!fs.existsSync(DEFAULT_DATA_DIR)) {
    console.error(`Diretório de dados não encontrado: ${DEFAULT_DATA_DIR}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(DEFAULT_DATA_DIR)
    .filter((f) => f.startsWith("dataset") && f.endsWith(".txt"))
    .sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ""), 10) || 0;
      const numB = parseInt(b.replace(/\D/g, ""), 10) || 0;
      return numA - numB;
    });

  if (files.length === 0) {
    console.warn(`Nenhum arquivo dataset*.txt encontrado em: ${DEFAULT_DATA_DIR}`);
    return;
  }

  console.log(`Encontrados ${files.length} datasets para processamento.`);

  const summary = [];
  const globalStart = Date.now();

  for (const file of files) {
    const inputPath = path.join(DEFAULT_DATA_DIR, file);
    const outputPath = path.join(DEFAULT_OUTPUT_DIR, `${path.basename(file, ".txt")}.json`);
    const metrics = await processSingleFile(inputPath, outputPath);
    summary.push(metrics);
  }

  const totalTimeSeconds = ((Date.now() - globalStart) / 1000).toFixed(2);

  console.log(`\n========================================================================`);
  console.log(`                         RESUMO CONSOLIDADO                             `);
  console.log(`========================================================================`);
  console.table(
    summary.map((s) => ({
      Dataset: s.file,
      Linhas: formatNumber(s.linesProcessed),
      Timestamps: formatNumber(s.timestampsCount),
      Encontros: s.totalEncounters,
      Genérico: s.encountersByType.generico,
      Facção: s.encountersByType.faccao,
      Protetiva: s.encountersByType.protetiva,
      "Tempo (s)": (s.durationMs / 1000).toFixed(2)
    }))
  );
  console.log(`Tempo total de execução de todos os datasets: ${totalTimeSeconds}s`);
  console.log(`Todos os arquivos JSON foram gerados com sucesso em: ${DEFAULT_OUTPUT_DIR}\n`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("-h") || args.includes("--help")) {
    showHelp();
    return;
  }

  if (args.length === 0 || args.includes("--all")) {
    await processAllDatasets();
  } else {
    const inputFile = args[0];
    const outputFile = args[1] || null;
    await processSingleFile(inputFile, outputFile);
  }
}

main().catch((err) => {
  console.error("Erro fatal durante a execução:", err);
  process.exit(1);
});

