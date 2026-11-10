# Arsenal 3D — ClassMana Torneio das Três Casas

**Nove modelos 3D distintos**, todos navegáveis no carrossel de equipamentos, com prévia real em `model-viewer` e uso na arena PlayCanvas. O catálogo e as regras de desbloqueio ficam em `equipment-catalog.js` e `duel-api/server.mjs`.

| Nível | Equipamento | Arquivo publicado | Modelo enviado |
| --- | --- | --- | --- |
| 1 | Arco de Treino | `bow-practice.glb` | `bow_practice.glb` |
| 2 | Arco Real | `bow-royal.glb` (7 partes) | `bow.glb` |
| 3 | Arco dos Ventos | `bow-wind.glb` | `cool_bow.glb` |
| 4 | Besta Leve | `crossbow-light.glb` | `crossbow.glb` |
| 5 | Arco Lendário | `bow-legend.glb` (10 partes) | `amos_bow.glb` |
| 6 | Besta Real | `crossbow-royal.glb` (6 partes) | `crossbow (1).glb` |
| 7 | Arco Recurvo | `bow-recurve.glb.gz` (1 parte) | `recurve-bow (1).zip` → `source/recurveBow.glb` |
| 8 | Arco do Explorador | `bow-ranger.glb.gz` (1 parte) | `bow (1).glb` |
| 9 | Arco de Guerra de Aloy | `bow-aloy-war.glb.gz` (12 partes) | `aloys_war_bow_from_horizon_zero_dawn.glb` |

`bow_practice (1).glb` era uma cópia **binariamente idêntica** de `bow_practice.glb`, portanto não é um décimo modelo.

## Importação e preservação

Os três modelos adicionados por último preservam integralmente malhas, texturas e materiais. Foi inserido somente um nó pai de transformação, para centralizar a arma, normalizar a escala e apresentar sua face principal à câmera. Os GLBs resultantes foram compactados com gzip e divididos em partes de até 850 kB para publicação no GitHub. O navegador reconstrói, descompacta com `DecompressionStream` e fornece o GLB ao visualizador 3D e à arena.

Não confundir partes de um GLB com armas diferentes: o total é **nove modelos**, não o número de arquivos `.partXX`.

Execute `node scripts/qa-arsenal.mjs` para validar o catálogo, integridade dos arquivos, malhas, orientação e paridade com as regras da API.
