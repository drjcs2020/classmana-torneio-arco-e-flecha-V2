# Arena PlayCanvas — correção de pivô, flecha e mira (10/11/2026)

## Escopo desta alteração
- Repositório: drjcs2020/classmana-torneio-arco-e-flecha-V2, branch `main`.
- Apenas apresentação/controle da arena: `scene-v3.js`, `game-v3.js`, `v3.css`, `sprite-hud.css`, cache bust de `index.html` e `arena.html`.
- Nenhum backend, Apps Script, planilha, ranking ou regra de pontuação foi modificado.

## Problemas identificados no código anterior
1. `bowVisualPivot` tinha roll lateral +6° e um segundo ajuste dinâmico de roll via PCA.
2. `arrowLoaded` tinha yaw independente +30°, deslocando a ponta para a esquerda quando o alvo estava à direita.
3. O GLB da flecha era esticado somente em Z (2x comprimento, largura inalterada).
4. Uma mira circular 3D era renderizada, enquanto `#playcross` (mira original) estava oculto por dois CSS.
5. A empunhadura seguia a posição da mira, deslocando o arco inteiro pelo campo de visão.

## Alterações
- Arco preso a ponto fixo em primeiro plano: 20% da largura e 66% da altura da arena, profundidade 2,70 no referencial da câmera.
- Rotação de pontaria por pitch/yaw calculados a partir do raio do cursor até o plano do alvo; roll zero.
- Modelo de arco inclinado 8° para a frente em X; yaw visual de 45° para posicionar a corda atrás da empunhadura.
- Para `bow-practice.glb`, a empunhadura real está aproximadamente em X=0,534 depois da rotação base de 45°. O offset do modelo passa a usar essa posição, em vez do centro da AABB.
- Encaixe da flecha em X=-0,12, Y=0,02, Z=0,17 (coordenadas locais do `WeaponPivot`), com recuo adicional em Z ao puxar. A flecha não recebe yaw independente.
- Escala da flecha uniforme: `(2 * spec.width, 2 * spec.width, 2)`. O fallback também usa `(2,2,2)`.
- Retirada a geometria da mira circular 3D. `#playcross` restaurado, 15% maior e sincronizado ao mesmo `reticle` usado na pontuação.
- Alvo projetado à direita, aproximadamente 77% da largura, respeitando margens para telas estreitas; tamanho em perspectiva mantido.
- Ponta da flecha termina na face frontal do alvo, não 0,37 unidade antes.
- Consultas `?qa=1` continuam disponíveis para inspeção da mira.

## Verificações efetuadas
- Sintaxe JavaScript dos arquivos alterados validada estaticamente.
- Assertivas de fonte: sem mira circular 3D, sem yaw de 30° da flecha, sem roll lateral do arco, escala uniforme, CSS da mira visível.
- Projeção geométrica independente com a malha original `bow_practice.glb` em 410×365: arco projetado entre x=39–98 e y=159–326; flecha da corda (x≈60,y≈237) à ponta (x≈174,y≈253), na direção do alvo à direita (x≈315,y≈273). O arco ocupa cerca de 46% da altura.
- Ainda NÃO foi validado visualmente no navegador com o PlayCanvas e os arquivos hospedados. Uma captura do jogo publicado é necessária para confirmação final.

## Próximos testes prioritários
1. Abrir `arena.html` em computador e celular; conferir se o GLB carregou (`data-glb-bow` e `data-glb-arrow` = `ready`).
2. Conferir a corda, a inclinação para a frente e o encaixe da flecha em 10m e 35m.
3. Disparar cinco flechas e comparar a posição da mira, pontuação e marca de impacto.
4. Validar todos os equipamentos desbloqueados: a correção da empunhadura X=0,534 é específica do arco de treino.
5. Continuar o trabalho pendente no lobby, convites online e resultados sem misturar essas tarefas com a calibração visual.
