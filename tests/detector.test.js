import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { detectEncountersInTimestamp } from "../src/core/detector.js";

describe("Detector de Encontros", () => {
  it("deve detectar encontro a menos de 20 metros e respeitar a estrutura de saída", () => {
    const timestamp = "2024-01-01 00:01:50";
    const points = [
      {
        id: 40,
        faccao: "1",
        lat: -10.07996,
        lon: -37.08384,
        medidaProtetiva: false,
        idsRestricaoMedida: new Set()
      },
      {
        id: 44,
        faccao: "1",
        lat: -10.07987,
        lon: -37.08389,
        medidaProtetiva: false,
        idsRestricaoMedida: new Set()
      }
    ];

    const encounters = detectEncountersInTimestamp(timestamp, points);
    assert.equal(encounters.length, 1);

    const enc = encounters[0];
    assert.equal(enc.tipo, "faccao");
    assert.deepEqual(enc.monitoradosEncontro, [40, 44]);
    assert.equal(enc.timestamp, timestamp);
    assert.equal(enc.posicoes["40"].lat, -10.07996);
    assert.equal(enc.posicoes["40"].lon, -37.08384);
    assert.equal(enc.posicoes["44"].lat, -10.07987);
    assert.equal(enc.posicoes["44"].lon, -37.08389);
    assert.ok(enc.distanciaMetros < 20);
    assert.ok(Math.abs(enc.distanciaMetros - 11.406788673336607) < 1e-9);
  });

  it("não deve detectar encontro se a distância for maior ou igual a 20 metros", () => {
    const timestamp = "2024-01-01 00:00:00";
    const points = [
      {
        id: 1,
        faccao: null,
        lat: -25.59386,
        lon: -73.96319,
        medidaProtetiva: false,
        idsRestricaoMedida: new Set()
      },
      {
        id: 2,
        faccao: null,
        lat: -21.15463,
        lon: -61.43519,
        medidaProtetiva: false,
        idsRestricaoMedida: new Set()
      }
    ];

    const encounters = detectEncountersInTimestamp(timestamp, points);
    assert.equal(encounters.length, 0);
  });
});

