# Auditoria técnica V2 — pré-liberação aos alunos (14/11/2026)

## Situação
**Auditoria estática realizada; liberação ainda depende de prova de ponta a ponta em dois navegadores com alunos de teste.** Não foi feito reset de duelos, nem exclusão destrutiva de mídias do jogo.

### Tamanho do `main` (árvore Git, bytes sem compressão Git)
- 547 arquivos antes da organização, 186.838.009 bytes (~187 MB em unidades decimais).
- 209 PNGs = ~93,0 MB; 95 WebPs = ~12,6 MB; 4 ZIPs = ~38,2 MB.
- Modelos 3D e fragmentos em `models3d/` = ~33,8 MB.
- Site estático estimado pelo filtro atual de rsync = ~148,3 MB **como conjunto de arquivos publicados**, não como download inicial de cada aluno. Recursos só são transferidos quando solicitados pelo navegador.
- Os arquivos de código CSS+JS somam aproximadamente 1,2 MB antes de compressão HTTP; prioridades de desempenho são imagens solicitadas, modelos 3D e rede.

## Limpeza já executada — segura e reversível
Três pacotes históricos foram movidos, sem alterar seus blobs Git, da raiz para `archive/pacotes-historicos/`:
1. `ClassMana_Assets_Parte_1_Personagens_Interface.zip` (~13,1 MB)
2. `ClassMana_Assets_Parte_2_Cenarios_Botoes_HUD.zip` (~10,9 MB)
3. `ClassMana_Integracao_Visual_01.zip` (~10,5 MB)

**Não confundir organização com redução imediata do tamanho do repositório:** mover arquivos no mesmo Git não apaga o histórico. O workflow já excluía `*.zip` do site; logo a limpeza não acelera automaticamente o jogo.

**Não mover/excluir** `assets/ui/ClassMana_Artes_Finais_Inventario.zip` nesta fase. O workflow `.github/workflows/publicar-v2-pages.yml`, linhas 38–52, descompacta esse pacote e exige oito imagens no `_site/assets/ui/`.

## Dependências confirmadas (NÃO excluir)
- `index.html`, `arena.html`, `game-v3.js`, `scene-v3.js`, `online-client.js`, `online-config.js`.
- `duel-api/` e `duel-api/teacher-admin.mjs`: API oficial V2, ranking e reset com snapshot no SQLite.
- `models3d/equipment/` e `equipment-catalog.js`: nove modelos obrigatórios; `scripts/qa-arsenal.mjs` compara hashes e geometria antes de cada deploy.
- `assets/ui/challenge/`, `assets/ui/challenge/same-house/`, `assets/ui/ranking-v2/`, `assets/v2/heroes/`, `assets/ui/crests/`: contêm imagens atuais, inclusive artes que podem parecer versões antigas pelo nome.
- `assets/ui/arsenal-*.png`: dependência do inventário e da extração automática.
- `assets/scenes/`, `assets/v2/backgrounds/`, `assets/sounds/`: referenciadas por CSS, cenas e áudio.
- CSS carregados por `index.html` ou `arena.html`; ainda há folhas com regras antigas sobrescritas por CSS recentes, mas remover sem revisão de cascade pode quebrar layouts.

## Candidatos a arquivo histórico — NÃO movidos nesta rodada
Fora da lista de CSS incluída nas duas páginas: `classmana-arena-restauro-arte.css`, `classmana-design-system.css`, `equipment-carousel.css`. Conferir imports e visualizações independentes antes de mover.

Arquivos JS aparentemente substituídos no fluxo principal: `game.js` (importa `scene.js`), `scene.js`, `equipment-carousel.js`, `classmana-arena-visual.js`. Não há import explícito deles no `game-v3.js` atualmente carregado; podem servir a testes ou versões de referência.

`preview-duelo-casas.html` e `rebuild/` são prévias/experimentos históricos; `rebuild/` já é excluída do GitHub Pages pelo workflow.

Pastas a investigar com **análise exaustiva de referências antes de excluir imagens**: `assets/equipment/` (~14,6 MB), `assets/characters/` (~6,2 MB), `assets/ui/characters/` (~9,8 MB), `assets/images/arte-*.png`. **Não classificar todas como lixo:** `v3.css`, `style.css`, `archer-selection.css` ainda referenciam algumas imagens `arte-*.jpg`; código e prévias podem montar caminhos dinamicamente.

## Pendências de qualidade antes de zerar o placar
1. **Teste real com dois perfis em navegadores separados**: criar desafio (mesma turma e turmas diferentes), concluir cinco disparos de cada participante, verificar convite, replay de alvo móvel, pontuação exata, resultado, ranking individual e das casas, atualização após recarregar.
2. **Treino contra o robô** em Fácil, Médio e Difícil: verificar alvo 3D e disparos do robô, fim de rodada, aplausos/vitória, opção jogar novamente e inventário.
3. **Viewport notebook 16 polegadas**: confirmar placas de aluno, botão Voltar, Iniciar Duelo integralmente visível, ranking e responsividade; validações recentes foram de CSS, não navegação real em navegador.
4. **QA de navegador desatualizado**: `scripts/qa-browser.mjs` ainda espera `.cm-duel-title` (removido) e `botao-ranking-classmana.svg` (substituído pelo escudo roxo), além de seis tiles iguais que não representam mais o layout ilustrado. Atualizar esses testes, não apagar as artes atuais para satisfazê-los.
5. **QA estático desatualizado**: `scripts/qa-static.mjs` exige `window.location.assign('./arena.html')`; o código atual acrescenta query string de cache. Atualizar asserção para a navegação real, não fazer rollback no jogo.
6. **CI não é teste completo**: `publicar-v2-pages.yml` executa somente `node scripts/qa-arsenal.mjs` antes da publicação e verifica imagens do inventário. Status de GitHub Pages verde **não significa** testes completos de dois alunos, navegação e placar.
7. **Identidade do aluno**: o sistema atual permite selecionar nomes sem PIN; supervisionar alunos para evitar que alguém jogue com o perfil alheio.
8. **Backup antes do reset**: `teacherResetScores` salva o snapshot dos duelos e operações na tabela `teacher_resets` do **mesmo banco SQLite V2**, depois executa DELETE das duas tabelas. Esse snapshot não substitui um backup externo do volume Railway. Confirmar também que a administração aponta para `classmana-v2-duel-api-production.up.railway.app`, nunca para a API antiga.
9. **Progresso do arsenal**: armas dependem de vitórias oficiais. Após o reset, testar de novo desbloqueios e recarregamento do perfil; o jogo resincroniza vitórias com o servidor, mas o estado local da sessão exige validação no navegador.

## Recomendação de liberação
Não zerar nem excluir imagens adicionais **até** o teste de ponta a ponta confirmar itens 1–3 e existir cópia externa do banco V2 (ou decisão consciente de aceitar apenas o snapshot interno). Depois, zerar pelo painel do professor com a frase exata `ZERAR V2`, recarregar e conferir ranking zerado e as três casas visíveis.

**Importante:** os ZIPs históricos estão arquivados, não apagados. Não foi feita mudança em pontuação, duelos, PlayCanvas, artes aprovadas, API ou estrutura de banco.
