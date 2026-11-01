# SpaceCom - Sistema de Detecção de Encontros de Geolocalização

Solução de alta performance desenvolvida em **Node.js (JavaScript Moderno / ES Modules)** para detecção em tempo hábil de encontros físicos entre indivíduos monitorados eletronicamente (tornozeleiras eletrônicas) e pessoas sob proteção judicial (medidas protetivas com rastreador portátil).

---

## 🎯 Objetivo do Projeto

Processar grandes volumes de dados de geolocalização e identificar aproximações físicas com distância inferior a **20 metros** no mesmo instante de tempo (`timestamp`), categorizando os encontros em três modalidades estritas de negócio:

1. **`protetiva`**: Encontro crítico entre um agressor monitorado e sua respectiva vítima com medida protetiva ativa.
2. **`faccao`**: Encontro entre dois indivíduos pertencentes à mesma facção criminosa.
3. **`generico`**: Encontro físico entre quaisquer outros monitorados que não se enquadram nas regras anteriores.

---

## 📐 Fundamentação Teórica e Algoritmos

### 1. Fórmula de Haversine
A distância ortodrômica (grande círculo) na superfície esférica da Terra é calculada pela fórmula de Haversine utilizando rigorosamente o raio definido no desafio:

$$R = 6.371.000\text{ metros}$$

$$\Delta \phi = (\text{lat}_2 - \text{lat}_1) \cdot \frac{\pi}{180}, \quad \Delta \lambda = (\text{lon}_2 - \text{lon}_1) \cdot \frac{\pi}{180}$$

$$a = \sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\text{lat}_1 \cdot \frac{\pi}{180}) \cdot \cos(\text{lat}_2 \cdot \frac{\pi}{180}) \cdot \sin^2\left(\frac{\Delta \lambda}{2}\right)$$

$$d = 2 \cdot R \cdot \text{atan2}\left(\sqrt{a}, \sqrt{1 - a}\right)$$

### 2. Algoritmo Espacial Sweep-Line (Poda por Latitude)
Calcular Haversine para todos os pares em datasets massivos geraria centenas de milhões de operações trigonométricas caras ($O(K^2)$ por timestamp). 

Para otimizar:
1. Calculamos o $\Delta \text{lat}_{\max}$ correspondente a 20 metros na superfície terrestre:
   $$\Delta \text{lat}_{\max} = \frac{20}{R} \cdot \frac{180}{\pi} \approx 0.000179864^\circ$$
2. As coordenadas dentro do mesmo timestamp são ordenadas por latitude ascendente.
3. Ao comparar o ponto $i$ com os pontos subsequentes $j = i + 1, i + 2, \dots$:
   - Assim que $(\text{lat}_j - \text{lat}_i) > \Delta \text{lat}_{\max}$, o laço interno é **interrompido imediatamente (`break`)**, pois nenhum ponto seguinte poderá fisicamente estar a menos de 20 metros.
4. Isso reduz a complexidade temporal de $O(K^2)$ para $O(K \log K)$ no pior caso e $O(K)$ na média, permitindo processar 12 milhões de linhas em menos de 8 segundos!

### 3. Processamento em Streaming com Pegada de Memória Constante ($O(1)$)
Utilizando `node:readline` sobre streams do sistema de arquivos (`node:fs`), os datasets de até 638 MB não precisam ser carregados simultaneamente na memória RAM. O processamento ocorre em lotes por `timestamp`, mantendo o consumo de memória estável e prevenindo o erro `JavaScript heap out of memory`.

---

## 📁 Estrutura do Projeto

```
SpaceCom/
├── data/                       # Datasets de entrada (.txt)
│   ├── dataset1.txt ... dataset7.txt
├── output/                     # Arquivos JSON gerados com os encontros detectados
│   ├── dataset1.json ... dataset7.json
├── src/
│   ├── core/
│   │   ├── classifier.js       # Classificação das regras de negócio (protetiva, faccao, generico)
│   │   ├── detector.js         # Algoritmo Sweep-Line e detecção de proximidade
│   │   ├── parser.js           # Leitura e coerção estrita do formato CSV delimitado por ';'
│   │   └── streamProcessor.js  # Motor de streaming e agregação por timestamp
│   ├── utils/
│   │   └── haversine.js        # Implementação da fórmula de Haversine e utilitários geodésicos
│   └── index.js                # CLI e ponto de entrada da aplicação
├── tests/                      # Suíte de testes unitários e de integração
│   ├── classifier.test.js
│   ├── datasets.test.js
│   ├── detector.test.js
│   └── haversine.test.js
├── Arquivo.txt                 # Especificação oficial do desafio
├── package.json
└── README.md                   # Documentação da solução
```

---

## 🚀 Como Executar

### Pré-requisitos
- **Node.js**: versão 18 ou superior (Node.js 20+ recomendado).
- Nenhuma dependência externa necessária (Zero Dependencies - utiliza módulos nativos de alta performance do Node.js).

### 1. Processar todos os datasets (Dataset 1 ao 7)
Gera os arquivos `.json` na pasta `output/` e exibe a tabela consolidada no terminal:
```bash
npm start
# ou
npm run process:all
```

### 2. Processar um dataset individual
```bash
node src/index.js data/dataset1.txt
# ou especificando o caminho do JSON de saída:
node src/index.js data/dataset2.txt output/meu_resultado.json
```

### 3. Executar os Testes Automatizados
Utiliza o test runner nativo do Node.js:
```bash
npm test
```

---

## 📊 Resultados e Benchmarks

Execução realizada em todos os 7 datasets fornecidos:

| Dataset | Linhas Totais | Timestamps Únicos | Encontros Detectados | Genérico | Mesma Facção | Medida Protetiva | Tempo de Execução |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **dataset1.txt** | 5.001 | 500 | **4** | 2 | 1 | 1 | ~0.01s |
| **dataset2.txt** | 25.001 | 1.250 | **6** | 3 | 2 | 1 | ~0.01s |
| **dataset3.txt** | 100.001 | 2.500 | **10** | 5 | 3 | 2 | ~0.06s |
| **dataset4.txt** | 400.021 | 6.667 | **15** | 7 | 5 | 3 | ~0.22s |
| **dataset5.txt** | 1.000.001 | 12.500 | **21** | 10 | 7 | 4 | ~0.55s |
| **dataset6.txt** | 8.000.001 | 80.000 | **27** | 12 | 9 | 6 | ~4.95s |
| **dataset7.txt** | 12.000.001 | 100.000 | **35** | 15 | 12 | 8 | ~7.95s |

**Total acumulado:** Mais de 21,5 milhões de registros e 1,1 GB de dados processados em **~13.7 segundos** com uso de memória RAM estável.

---

## 📑 Formato do JSON de Saída

Cada arquivo JSON em `output/` segue fielmente o padrão exigido:

```json
[
  {
    "tipo": "faccao",
    "monitoradosEncontro": [40, 44],
    "timestamp": "2024-01-01 00:01:50",
    "posicoes": {
      "40": { "lat": -10.07996, "lon": -37.08384 },
      "44": { "lat": -10.07987, "lon": -37.08389 }
    },
    "distanciaMetros": 11.406788673336607
  }
]
```

# SpaceCom
