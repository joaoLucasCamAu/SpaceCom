import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateHaversineDistance,
  getMaxDeltaLat,
  EARTH_RADIUS_METERS
} from "../src/utils/haversine.js";

describe("Cálculos Geodésicos de Haversine", () => {
  it("deve utilizar o raio da Terra de 6.371.000 metros", () => {
    assert.equal(EARTH_RADIUS_METERS, 6371000);
  });

  it("deve calcular a distância com exatidão conforme exemplo oficial do desafio", () => {
    const lat1 = -10.07996;
    const lon1 = -37.08384;
    const lat2 = -10.07987;
    const lon2 = -37.08389;

    const distancia = calculateHaversineDistance(lat1, lon1, lat2, lon2);
    const esperado = 11.406788673336607;

    assert.ok(
      Math.abs(distancia - esperado) < 1e-9,
      `Distância calculada (${distancia}) difere do esperado (${esperado})`
    );
  });

  it("deve retornar 0 para pontos idênticos", () => {
    const lat = -23.55052;
    const lon = -46.63331;
    const dist = calculateHaversineDistance(lat, lon, lat, lon);
    assert.equal(dist, 0);
  });

  it("deve calcular delta máximo de latitude com margem de segurança", () => {
    const maxDelta = getMaxDeltaLat(20.0);
    // 20m em radianos = 20 / 6371000 ~ 3.139e-6 rad = ~0.00017986 graus
    assert.ok(maxDelta > 0.000179);
    assert.ok(maxDelta < 0.00019);
  });
});

