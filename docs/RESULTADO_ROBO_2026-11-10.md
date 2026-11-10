# ClassMana V2 — Correção da tela de resultado contra robô

Data: 10/11/2026. Alterações feitas diretamente na branch `main`.

## Escopo
- Molduras e área útil dos nomes/casas ampliadas na tela de resultado V2.1; ajuste automático do tamanho do texto para evitar sobreposição nas plaquetas.
- Espaçamento horizontal entre números e medalhão VS aumentado, inclusive com ajuste responsivo.
- Artes independentes `title-draw.svg` e `badge-draw.svg`, construídas sobre as artes oficiais de resultado aprovadas, com lettering EMPATE; não dependem de uma faixa de texto improvisada em CSS.
- `JOGAR NOVAMENTE` reinicia diretamente a arena para treino livre ou contra robô, mantendo jogador, Casa, personagem, arco, modo, dificuldade do robô e trilha de distâncias. Limpa tiros, placar, vento/posição anterior, marcações no alvo, pausa e indicadores; a nova rodada usa novos valores de vento e pontuação.
- `VOLTAR AO MENU` continua voltando à seleção. Para desafios online, o botão principal passa a dizer `NOVO DESAFIO`, sem simular um replay de outro jogador.
- Versões de cache atualizadas em `index.html` e `arena.html`.

## Não alterado
- `scene-v3.js`, incluindo o ajuste aprovado da flecha `{x:-.16,y:.01,z:.13,yaw:0}`.
- Física do tiro, pontuação, backend e ranking.

## Verificação e limitações
- Referências de arquivos, regras CSS, ligação do botão e atualização dos arquivos verificadas estaticamente após o commit.
- **Teste visual e funcional no navegador publicado ainda pendente.** Não declarar sucesso de ponta a ponta sem testar uma partida completa.
- Validar em computador e celular: resultado VITÓRIA/DERROTA/EMPATE, nomes longos das três Casas, espaçamento do placar, botão JOGAR NOVAMENTE iniciando direto na primeira flecha com as mesmas configurações e botão VOLTAR AO MENU retornando à seleção.

## Arte de EMPATE revisada
- Substituídas as duas artes SVG anteriores que usavam imagens de VITÓRIA e VENCEDOR com lettering sobreposto.
- Agora `title-draw.svg` e `badge-draw.svg` são **ilustrações vetoriais autônomas**, com faixas vinho, ornamentos dourados, alvo de arco e flecha e lettering EMPATE integrado. Não usam imagens de vitória/derrota nem texto improvisado por CSS.
- O arquivo `classmana-v21-resultado.css` continua somente posicionando as artes na tela; cache atualizado nas páginas.
