import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { classifyEncounter } from "../src/core/classifier.js";

describe("Classificação de Encontros", () => {
  it("deve classificar como 'protetiva' quando o agressor estiver na lista de restrição da vítima", () => {
    const vitima = {
      id: 9,
      faccao: null,
      medidaProtetiva: true,
      idsRestricaoMedida: new Set([10])
    };
    const agressor = {
      id: 10,
      faccao: null,
      medidaProtetiva: false,
      idsRestricaoMedida: new Set()
    };

    assert.equal(classifyEncounter(vitima, agressor), "protetiva");
    assert.equal(classifyEncounter(agressor, vitima), "protetiva");
  });

  it("deve classificar como 'faccao' quando ambos tiverem a mesma facção", () => {
    const membro1 = {
      id: 40,
      faccao: "1",
      medidaProtetiva: false,
      idsRestricaoMedida: new Set()
    };
    const membro2 = {
      id: 44,
      faccao: "1",
      medidaProtetiva: false,
      idsRestricaoMedida: new Set()
    };

    assert.equal(classifyEncounter(membro1, membro2), "faccao");
  });

  it("deve classificar como 'generico' quando pertencerem a facções diferentes", () => {
    const membroA = {
      id: 40,
      faccao: "1",
      medidaProtetiva: false,
      idsRestricaoMedida: new Set()
    };
    const membroB = {
      id: 44,
      faccao: "2",
      medidaProtetiva: false,
      idsRestricaoMedida: new Set()
    };

    assert.equal(classifyEncounter(membroA, membroB), "generico");
  });

  it("deve classificar como 'generico' quando não possuírem facção nem medida protetiva mútua", () => {
    const m1 = {
      id: 4,
      faccao: null,
      medidaProtetiva: false,
      idsRestricaoMedida: new Set()
    };
    const m2 = {
      id: 6,
      faccao: null,
      medidaProtetiva: false,
      idsRestricaoMedida: new Set()
    };

    assert.equal(classifyEncounter(m1, m2), "generico");
  });
});

