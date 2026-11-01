import { describe, it } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { processDatasetStream } from "../src/core/streamProcessor.js";

describe("Validação dos Datasets de Teste", () => {
  it("deve processar dataset1.txt e identificar exatamente os 4 encontros", async () => {
    const inputPath = path.resolve(process.cwd(), "data/dataset1.txt");
    const { encounters, metrics } = await processDatasetStream(inputPath);

    assert.equal(metrics.totalEncounters, 4);
    assert.equal(metrics.encountersByType.generico, 2);
    assert.equal(metrics.encountersByType.faccao, 1);
    assert.equal(metrics.encountersByType.protetiva, 1);

    // Valida o encontro de medida protetiva (IDs [9, 10])
    const protEncounter = encounters.find((e) => e.tipo === "protetiva");
    assert.ok(protEncounter);
    assert.deepEqual(protEncounter.monitoradosEncontro, [9, 10]);
    assert.equal(protEncounter.timestamp, "2024-01-01 00:16:45");
    assert.ok(protEncounter.distanciaMetros < 20);

    // Valida o encontro de mesma facção (IDs [7, 8])
    const faccaoEncounter = encounters.find((e) => e.tipo === "faccao");
    assert.ok(faccaoEncounter);
    assert.deepEqual(faccaoEncounter.monitoradosEncontro, [7, 8]);
    assert.equal(faccaoEncounter.timestamp, "2024-01-01 00:36:00");
    assert.ok(faccaoEncounter.distanciaMetros < 20);
  });

  it("deve processar dataset2.txt e identificar exatamente os 6 encontros", async () => {
    const inputPath = path.resolve(process.cwd(), "data/dataset2.txt");
    const { encounters, metrics } = await processDatasetStream(inputPath);

    assert.equal(metrics.totalEncounters, 6);
    assert.equal(metrics.encountersByType.generico, 3);
    assert.equal(metrics.encountersByType.faccao, 2);
    assert.equal(metrics.encountersByType.protetiva, 1);

    // Valida o encontro de medida protetiva (IDs [12, 13])
    const protEncounter = encounters.find((e) => e.tipo === "protetiva");
    assert.ok(protEncounter);
    assert.deepEqual(protEncounter.monitoradosEncontro, [12, 13]);
    assert.equal(protEncounter.timestamp, "2024-01-01 00:29:50");
    assert.ok(protEncounter.distanciaMetros < 20);
  });
});

