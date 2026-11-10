# ClassMana — Inventário de Armas V3 (09/11/2026)

## Decisão
O carrossel antigo foi descontinuado. Um brasão clicável na seleção do herói abre um modal de inventário na mesma página, sem alterar a rota.

## Implementado
- Brasão novo: assets/ui/arsenal-crest.svg.
- Modal em escudo, com categorias Arcos, Bestas e Flechas.
- Coleção de 9 armas (7 arcos e 2 bestas) e 3 flechas do catálogo atual.
- Miniaturas vetoriais distintas por arma; ao visitar cada arma, o navegador tenta capturar a renderização 3D como miniatura.
- Apenas um model-viewer grande, com zoom, giro de 90 graus, reenquadramento e arrasto.
- Ficha: raridade, habilidade, margem de acerto, desvio do vento, pontos, distâncias da arena, flecha associada e custo por vitórias.
- Desbloqueio validado por vitórias oficiais. Flechas são associadas automaticamente à arma.
- Escape, fechamento por botão ou fundo, e retorno do foco ao botão de abertura.
- Alvo fixo da arena: disco 3D procedural voltado à câmera; suporte visual antigo da mira removido quando GLB carrega.

## Arquivos
Novos: equipment-inventory.js, equipment-inventory.css, assets/ui/arsenal-crest.svg.
Integrados: index.html, arena.html, game-v3.js, scene-v3.js.
Legado: equipment-carousel.js e equipment-carousel.css permanecem apenas como histórico, sem importação nas telas principais.

## Verificações executadas
- Sintaxe JavaScript estática: game-v3.js, equipment-inventory.js, scene-v3.js aprovados.
- Referências de arquivos e SVG no GitHub confirmadas.
- Inventário possui um único model-viewer, evitando sobreposição de GLBs.
- Regras de desbloqueio não foram alteradas no backend.

## Pendente — não declarar sucesso visual ainda
- Verificar o site publicado em navegador real, em computador e celular.
- Confirmar enquadramento e orientação de cada GLB, inclusive modelos compactados.
- Conferir que as miniaturas 3D são capturadas nos navegadores compatíveis.
- Conferir o alvo frontal e a ausência de arco antigo sobreposto na arena.
- Não há preços em ouro: o custo exibido é o número de vitórias para desbloquear.
- Não foram alterados dados pedagógicos, planilhas ou identidade de alunos.

## Roteiro manual
1. Abrir o jogo, selecionar Casa e estudante e chegar à tela do herói.
2. Confirmar que o carrossel antigo sumiu e o brasão abre o inventário.
3. Percorrer Arcos, Bestas e Flechas e conferir os 12 itens.
4. Selecionar arma e conferir visualização 3D grande, zoom, rotação e textos.
5. Tentar equipar arma bloqueada (deve permanecer bloqueada).
6. Equipar arma liberada, fechar inventário e conferir o resumo.
7. Entrar no treino de 10 m; conferir alvo frontal e arco sem sobreposição.
8. Repetir em 1365x630, notebook, celular retrato e paisagem.