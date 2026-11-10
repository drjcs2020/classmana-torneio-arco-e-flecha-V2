# ClassMana — Referência visual aprovada para armas

**Data da aprovação:** 10/11/2026  
**Jogo:** Torneio das Três Casas — Arena de Arco e Flecha  
**Estado:** APROVADO visualmente pelo usuário após ajuste fino da flecha  
**Commit de referência:** [32db1206affe8373bead5d22dd36d0a2136dc475](https://github.com/drjcs2020/classmana-torneio-arco-e-flecha-V2/commit/32db1206affe8373bead5d22dd36d0a2136dc475)

## Arcos e flechas — padrão de referência

No arquivo `scene-v3.js`, o alinhamento da flecha aprovado utiliza:

```js
return {x:-.16,y:.01,z:.13,yaw:0};
```

- **X:** `-0.16`
- **Y:** `0.01` (antes `0.08`; redução de `0.07` unidade na coordenada do ajuste)
- **Z:** `0.13`
- **Yaw:** `0`
- **Inclinação visual do arco:** `bowVisualPivot.setLocalEulerAngles(0,0,0)`
- **Comprimento, espessura e orientação da flecha:** preservar como no commit aprovado.

O usuário avaliou o resultado no jogo e confirmou: **"agora sim, ficou perfeito"**.

### Regra para os demais arcos

Usar esta configuração como **referência inicial aprovada** de alinhamento visual entre flecha, corda e empunhadura. Verificar cada modelo no enquadramento real do jogo e só introduzir diferenças locais quando sua geometria exigir. Não alterar comprimento, espessura, ângulo, escala ou outros parâmetros já aprovados sem necessidade.

O pedido visual anterior foi de abaixar a flecha cerca de **2–3 mm na imagem de referência**. Não interpretar esse valor como uma conversão física exata para unidades do PlayCanvas: o deslocamento real no código foi `Y: 0.08 → 0.01`.

### Bestas — pendente

**Revisão futura, ainda não executada.** As bestas devem ser calibradas separadamente, incluindo alinhamento do virote com trilho, corda e ponto de disparo. Não copiar cegamente o offset dos arcos para as bestas.

## Cuidados ao continuar o projeto

- Manter esta referência como critério de comparação nas próximas armas.
- Preservar a implementação aprovada até que exista solicitação específica de alteração.
- Registrar novos ajustes aprovados neste documento, com commit de referência e observação visual.
