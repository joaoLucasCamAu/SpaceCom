<div align="center">

<img src="docs/assets/spacecom-logo.png" alt="Spacecom" width="230">

<br>

# Sistema de Detecção de Encontros

### Processamento eficiente de dados de geolocalização para identificação de encontros entre indivíduos monitorados.

<br>

![Node.js](https://img.shields.io/badge/Node.js-18%2B-222222?style=for-the-badge&logo=node.js&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES%20Modules-E51B23?style=for-the-badge&logo=javascript&logoColor=white)
![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero-222222?style=for-the-badge)
![Tests](https://img.shields.io/badge/Tests-Automated-E51B23?style=for-the-badge)

**Tecnologia • Performance • Confiabilidade**

</div>

---

## Sobre o projeto

Este projeto foi desenvolvido como solução para o desafio técnico de **detecção de encontros a partir de dados de geolocalização**.

A aplicação utiliza **Node.js com JavaScript moderno e ES Modules** para processar grandes volumes de registros de localização e identificar aproximações físicas entre indivíduos monitorados eletronicamente e pessoas vinculadas a medidas protetivas.

A solução foi projetada com três objetivos principais:

- **correção das regras de negócio;**
- **baixo consumo de memória;**
- **boa performance mesmo em datasets de milhões de registros.**

> O foco não foi apenas identificar os encontros, mas construir uma solução capaz de processar grandes volumes de dados de maneira eficiente e previsível.

---

## Visão geral

| Característica | Implementação |
|---|---|
| **Runtime** | Node.js 18+ |
| **Linguagem** | JavaScript / ES Modules |
| **Distância máxima** | `< 20 metros` |
| **Cálculo geográfico** | Fórmula de Haversine |
| **Otimização espacial** | Sweep-Line por latitude |
| **Leitura de dados** | Streaming com `node:readline` |
| **Dependências externas** | Nenhuma |
| **Testes** | Node.js Test Runner |
| **Formato de saída** | JSON |

---

## Objetivo

O sistema deve processar registros de geolocalização e detectar encontros físicos cuja distância seja inferior a **20 metros**, considerando indivíduos presentes no mesmo instante de tempo (`timestamp`).

Os encontros são classificados de acordo com as regras de negócio.

### Medida protetiva

Encontro entre um agressor monitorado e sua respectiva vítima vinculada a uma medida protetiva ativa.

```text
AGRESSOR  ─────── < 20 m ───────  VÍTIMA
                    ↓
                PROTETIVA
```

### Facção

Encontro entre dois indivíduos monitorados pertencentes à mesma facção.

```text
MONITORADO A  ─── < 20 m ───  MONITORADO B
      │                            │
      └────── mesma facção ────────┘
                    ↓
                  FACÇÃO
```

### Genérico

Encontro entre dois indivíduos monitorados que não se enquadram nas regras anteriores.

```text
MONITORADO A  ─── < 20 m ───  MONITORADO B
                    ↓
                 GENÉRICO
```

---

# Arquitetura da solução

O processamento foi dividido em etapas independentes para manter responsabilidades bem definidas.

```text
                    DATASET
                       │
                       ▼
              ┌─────────────────┐
              │     Parser      │
              │ leitura + tipos │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ Stream Processor│
              │   timestamp     │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │    Detector     │
              │   Sweep-Line    │
              └────────┬────────┘
                       │
                  candidatos
                       │
                       ▼
              ┌─────────────────┐
              │   Haversine     │
              │ distância real  │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │   Classifier    │
              │ regras negócio  │
              └────────┬────────┘
                       │
                       ▼
                     JSON
```

Essa separação permite testar individualmente:

- parsing;
- cálculos geográficos;
- detecção;
- classificação;
- integração dos datasets.

---

# Fundamentação técnica

Durante o desenvolvimento, alguns conceitos foram especialmente importantes para construir uma solução escalável.

## 1. Distância geográfica — Fórmula de Haversine

Latitude e longitude não podem ser tratadas simplesmente como coordenadas cartesianas quando buscamos uma distância geográfica precisa.

Por isso, a distância entre dois pontos é calculada usando a **Fórmula de Haversine**, utilizando o raio terrestre definido no desafio:

$$
R = 6.371.000\text{ metros}
$$

Primeiro são calculadas as diferenças angulares:

$$
\Delta \phi =
(\text{lat}_2-\text{lat}_1)
\cdot
\frac{\pi}{180}
$$

$$
\Delta \lambda =
(\text{lon}_2-\text{lon}_1)
\cdot
\frac{\pi}{180}
$$

Em seguida:

$$
a =
\sin^2\left(\frac{\Delta\phi}{2}\right)
+
\cos\left(\text{lat}_1\frac{\pi}{180}\right)
\cdot
\cos\left(\text{lat}_2\frac{\pi}{180}\right)
\cdot
\sin^2\left(\frac{\Delta\lambda}{2}\right)
$$

Finalmente:

$$
d =
2R
\cdot
\operatorname{atan2}
\left(
\sqrt{a},
\sqrt{1-a}
\right)
$$

O resultado `d` representa a distância entre os dois pontos em metros.

---

## 2. Problema de força bruta

Uma implementação ingênua poderia comparar todos os indivíduos contra todos os demais presentes em determinado `timestamp`.

Para `K` posições:

$$
O(K^2)
$$

Por exemplo:

```text
1.000 posições → ~499.500 pares
5.000 posições → ~12.497.500 pares
10.000 posições → ~49.995.000 pares
```

Cada par ainda exigiria cálculos trigonométricos da Fórmula de Haversine.

Para datasets muito grandes, essa abordagem se torna desnecessariamente custosa.

---

## 3. Otimização espacial com Sweep-Line

Para reduzir a quantidade de comparações foi implementada uma estratégia de **Sweep-Line baseada em latitude**.

O primeiro passo é determinar qual variação aproximada de latitude representa 20 metros:

$$
\Delta \text{lat}_{max}
=
\frac{20}{R}
\cdot
\frac{180}{\pi}
$$

Resultando aproximadamente em:

$$
\Delta \text{lat}_{max}
\approx
0.000179864^\circ
$$

Dentro de cada `timestamp`, os registros são ordenados por latitude.

```text
Latitude
   ▲

   ● A
   │
   │  < 20 m
   │
   ● B
   │
   │
   │  > limite
   │
   ● C

   └────────────►
```

Durante a varredura, um ponto `i` é comparado apenas com os pontos subsequentes.

Quando:

```text
latitude[j] - latitude[i] > MAX_LAT_DIFF
```

o laço é interrompido imediatamente:

```js
break;
```

Como os pontos estão ordenados, qualquer ponto posterior estará ainda mais distante em latitude.

Dessa maneira, grande parte das chamadas desnecessárias de Haversine é eliminada antes mesmo do cálculo trigonométrico.

### Complexidade

A ordenação possui custo:

$$
O(K\log K)
$$

Depois disso, a quantidade de comparações depende principalmente da densidade espacial dos pontos.

Na prática, para coordenadas geograficamente dispersas, a quantidade de candidatos analisados é muito menor do que em uma busca quadrática completa.

---

## 4. Streaming e controle de memória

Outro problema importante era o tamanho dos datasets.

Alguns arquivos possuem centenas de megabytes e milhões de registros.

Carregar todo o arquivo com algo como:

```js
fs.readFile()
```

aumentaria significativamente o consumo de memória e poderia provocar:

```text
JavaScript heap out of memory
```

A solução utiliza:

```js
node:fs
node:readline
```

para processar o arquivo utilizando **streams**.

```text
ARQUIVO
  │
  ▼
linha
  │
  ▼
linha
  │
  ▼
linha
  │
  ▼
timestamp atual
  │
  ├── processamento
  │
  └── descarte
```

Somente os registros necessários para o `timestamp` atual permanecem em memória.

Quando o timestamp muda:

1. o lote anterior é processado;
2. os encontros são detectados;
3. os resultados são gravados;
4. o lote pode ser liberado;
5. inicia-se o próximo timestamp.

Isso evita manter o dataset completo em RAM.

---

# Estrutura do projeto

```text
SpaceCom/
│
├── data/
│   ├── dataset1.txt
│   ├── dataset2.txt
│   ├── dataset3.txt
│   └── dataset4.txt
│
├── output/
│   ├── dataset1.json
│   ├── dataset2.json
│   ├── dataset3.json
│   └── dataset4.json
│
├── src/
│   │
│   ├── core/
│   │   ├── classifier.js
│   │   ├── detector.js
│   │   ├── parser.js
│   │   └── streamProcessor.js
│   │
│   ├── utils/
│   │   └── haversine.js
│   │
│   └── index.js
│
├── tests/
│   ├── classifier.test.js
│   ├── datasets.test.js
│   ├── detector.test.js
│   └── haversine.test.js
│
├── docs/
│   └── assets/
│       └── spacecom-logo.png
│
├── Arquivo.txt
├── package.json
└── README.md
```

### Responsabilidades

| Arquivo | Responsabilidade |
|---|---|
| `parser.js` | Conversão e validação dos registros de entrada |
| `streamProcessor.js` | Leitura do dataset e agrupamento por timestamp |
| `detector.js` | Detecção espacial e algoritmo Sweep-Line |
| `classifier.js` | Aplicação das regras de classificação |
| `haversine.js` | Cálculo da distância geográfica |
| `index.js` | Interface CLI e inicialização da aplicação |

---

# Como executar

## Pré-requisitos

É necessário possuir:

```text
Node.js >= 18
```

Node.js 20 ou superior é recomendado.

A solução não utiliza bibliotecas externas para o processamento.

```text
Zero runtime dependencies.
```

---

## Instalação

Clone o projeto:

```bash
git clone <URL-DO-REPOSITORIO>
```

Entre no diretório:

```bash
cd SpaceCom
```

Caso necessário:

```bash
npm install
```

---

## Processar os datasets

Para processar automaticamente os datasets disponíveis dentro de `data/`:

```bash
npm start
```

ou:

```bash
npm run process:all
```

Os arquivos processados serão gerados dentro de:

```text
output/
```

---

## Processar um único dataset

```bash
node src/index.js data/dataset1.txt
```

Também é possível informar explicitamente o arquivo de saída:

```bash
node src/index.js \
  data/dataset2.txt \
  output/meu_resultado.json
```

---

# Testes automatizados

A aplicação possui testes para as principais camadas da solução.

Execute:

```bash
npm test
```

São testados cenários relacionados a:

- distância geográfica;
- classificação dos encontros;
- detecção de proximidade;
- parsing;
- processamento dos datasets;
- integração entre componentes.

---

# Resultados e benchmarks

A arquitetura foi construída buscando reduzir tanto o número de comparações espaciais quanto o consumo de memória.

### Dataset de maior volume testado

| Métrica | Resultado |
|---|---:|
| Registros processados | ~12 milhões |
| Tamanho do arquivo | ~638 MB |
| Estratégia | Streaming + Sweep-Line |
| Dependências externas | 0 |
| Tempo observado | `< 8 segundos`* |

> \* Resultado observado no ambiente utilizado durante o desenvolvimento. O tempo pode variar conforme CPU, armazenamento, sistema operacional e características do dataset.

A principal otimização não está apenas no tempo total, mas na redução da quantidade de pares enviados para o cálculo de Haversine.

---

# Formato da saída

Cada arquivo presente em `output/` contém os encontros identificados no respectivo dataset.

Exemplo:

```json
[
  {
    "tipo": "faccao",
    "monitoradosEncontro": [40, 44],
    "timestamp": "2024-01-01 00:01:50",
    "posicoes": {
      "40": {
        "lat": -10.07996,
        "lon": -37.08384
      },
      "44": {
        "lat": -10.07987,
        "lon": -37.08389
      }
    },
    "distanciaMetros": 11.406788673336607
  }
]
```

---

# Decisões de engenharia

Algumas decisões foram adotadas deliberadamente durante o desenvolvimento.

### JavaScript com ES Modules

A solução utiliza recursos modernos do Node.js mantendo uma implementação simples e sem necessidade de etapa adicional de compilação.

### Zero dependencies

Para o núcleo do processamento foram priorizados módulos nativos do Node.js.

Isso reduz:

- dependências externas;
- superfície de manutenção;
- overhead;
- complexidade de instalação.

### Processamento por timestamp

Como um encontro somente pode ocorrer entre registros referentes ao mesmo instante, cada timestamp pode ser tratado como uma unidade independente de processamento.

### Pré-filtro espacial

O cálculo completo de Haversine é executado somente quando existe possibilidade real de os dois pontos estarem dentro do raio de interesse.

### Separação de responsabilidades

Parsing, classificação, cálculo geográfico e detecção foram implementados separadamente para facilitar:

- testes;
- manutenção;
- legibilidade;
- evolução da solução.

---

# Limitações e possíveis evoluções

Embora a implementação atual resolva o desafio proposto, existem possíveis caminhos de evolução, eu por exemplo colocaria um chalk para qunaod os arquivos fosse gerados e o sistema estivesse em running ficasse mais agradavel.

### Spatial Hash / Grid

Dividir o espaço geográfico em células permitiria buscar apenas indivíduos presentes na mesma região ou em células vizinhas.

### R-Tree

Para cenários mais complexos, estruturas de indexação espacial poderiam ser utilizadas.

### Worker Threads

Datasets ou timestamps muito densos poderiam ser distribuídos entre múltiplos núcleos da CPU.

### TypeScript

Uma possível evolução seria migrar o projeto para TypeScript para aumentar a segurança de tipos em estruturas como:

```text
Monitorado
Posição
Encontro
MedidaProtetiva
```

### Persistência

Em um cenário produtivo, os encontros poderiam ser encaminhados para:

```text
Detector
   │
   ├── Banco de dados
   ├── Message Broker
   ├── API
   ├── Sistema de alertas
   └── Dashboard
```

---

# Datasets

Por limitações de tamanho de arquivos do GitHub, este repositório contém apenas os datasets que puderam ser versionados diretamente.

Atualmente estão disponíveis:

```text
dataset1
dataset2
dataset3
dataset4
```

Os datasets:

```text
dataset5
dataset6
dataset7
```

não foram adicionados ao repositório devido ao tamanho dos arquivos.

A aplicação, entretanto, suporta o processamento desses datasets normalmente quando eles são adicionados localmente à pasta:

```text
data/
```

---

# Considerações finais

Mais do que encontrar pares de coordenadas próximas, este projeto exigiu pensar em como realizar esse processamento de maneira eficiente em datasets de grande volume.

Durante o desenvolvimento foram explorados conceitos relacionados a:

- processamento de dados;
- geolocalização;
- algoritmos espaciais;
- análise de complexidade;
- streaming;
- otimização de memória;
- arquitetura modular;
- testes automatizados.

O resultado é uma solução simples de executar, modular e preparada para processar grandes volumes de registros sem exigir que todo o dataset seja carregado em memória.

---

<div align="center">

### Sistema de Detecção de Encontros

**Desafio técnico — Engenharia de Software**

<br>

`Node.js` • `Geolocation`

</div>
