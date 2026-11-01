/**
 * Módulo para classificação do tipo de encontro com base nas regras de negócio.
 *
 * Tipos aceitos pelo desafio:
 * - "protetiva": Encontro entre um agressor e sua respectiva vítima (medida protetiva).
 * - "faccao": Encontro entre dois monitorados que pertencem à mesma facção.
 * - "generico": Encontro entre quaisquer dois monitorados.
 */

/**
 * Classifica a relação entre dois monitorados.
 *
 * @param {object} p1 Primeiro monitorado
 * @param {object} p2 Segundo monitorado
 * @returns {"protetiva" | "faccao" | "generico"}
 */
export function classifyEncounter(p1, p2) {
  // 1. Regra de Medida Protetiva (prioridade máxima por risco à vida)
  const isP1VictimOfP2 = p1.medidaProtetiva && p1.idsRestricaoMedida.has(p2.id);
  const isP2VictimOfP1 = p2.medidaProtetiva && p2.idsRestricaoMedida.has(p1.id);

  if (isP1VictimOfP2 || isP2VictimOfP1) {
    return "protetiva";
  }

  // 2. Regra de Facção (ambos possuem facção definida e idêntica)
  if (p1.faccao && p2.faccao && p1.faccao === p2.faccao) {
    return "faccao";
  }

  // 3. Regra Genérica
  return "generico";
}

