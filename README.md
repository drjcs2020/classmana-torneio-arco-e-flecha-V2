# ClassMana — Torneio de Arco e Flecha | V2.0

**Nova identidade visual de fantasia / gibi**, baseada nas seis telas de referência do projeto. A V2 mantém o PlayCanvas, a dinâmica dos disparos, os cinco tiros, as dificuldades, os duelos assíncronos, os alunos e equipes originais, a música e os efeitos de fogo.

## Novidades da V2

- **Lobby principal:** três arqueiros das Casas Águia Dourada (4º A), Leão de Fogo (4º B) e Dragão de Esmeralda (4º C), com botões gráficos JOGAR, DESAFIOS, RANKING e REGRAS.
- **Seleção:** casas, identificação real do aluno, arqueiro masculino/feminino, escolha do arco e modo de jogo.
- **Desafios:** cartões de alunos e busca visual, sincronizados com os campos e regras originais; sem cadastro fictício.
- **VS:** arte dos personagens V2 e animações existentes; o desafio só é criado após confirmação.
- **Arena:** cenografia V2 e HUD preservando PlayCanvas, mira, força, vento, níveis, pontuação e sons.
- **Resultados:** painel visual com os números e a pontuação calculados pelo jogo. Não atribuímos XP ou moedas pedagógicas que não existam no sistema.
- **Ranking:** painéis reais que usam somente a API específica da V2, não os valores fictícios dos mockups.
- **Sons e partículas:** trilha MP3 e efeitos preservados; brasas mágicas animadas no lobby, VS e arena.

## Separação total da V1

- Código V1: `https://github.com/drjcs2020/classmana-torneio-arco-e-flecha`
- Código V2: `https://github.com/drjcs2020/classmana-torneio-arco-e-flecha-V2`
- API V2: `https://classmana-v2-duel-api-production.up.railway.app/api`
- Banco V2: **volume Railway exclusivo** `/data/classmana-v2.sqlite` (não está neste repositório).
- As chaves de sessão, identidade e resultados locais do navegador ganharam nomes exclusivos V2.

## Publicação

O projeto deve ser publicado no repositório **V2**, não no original. Para GitHub Pages, use **Settings → Pages → Build and deployment → Deploy from a branch → main → /(root)** e salve. A página publicada terá URL semelhante a:

`https://drjcs2020.github.io/classmana-torneio-arco-e-flecha-V2/`

GitHub Pages pode precisar de alguns instantes após o push. Nenhuma automação antiga da V1 precisa ser ligada para a publicação por branch; as configurações antigas estão guardadas em `docs/workflows-v1/` como arquivos de texto inativos.

## Como rodar localmente

Execute na raiz do projeto:

```bat
python -m http.server 8000
```

Abra `http://localhost:8000/`. A URL da API V2 é configurada em `online-config.js`; **não a troque pela API da V1**. Não use `file://`, pois os módulos JavaScript precisam de servidor HTTP.

## Testes

```bat
node scripts/qa-static.mjs
node scripts/qa-media.mjs
node scripts/qa-v2.mjs
node scripts/qa-duel-endtoend.mjs
```

A verificação de duelo usa banco temporário separado. Testes funcionais completos no GitHub Pages devem ser feitos antes de liberar a V2 às turmas.

## Arquivos da nova identidade

- `assets/v2/heroes/`: arqueiros selecionáveis, WebP transparente.
- `assets/v2/backgrounds/`: cenários das telas.
- `assets/v2/buttons/`: botões principais.
- `assets/v2/crests/`: escudos das Casas.
- `assets/v2/frames/` e `assets/v2/panels/`: peças auxiliares para próximas revisões.
- `classmana-v2-theme.css`: aparência da V2, carregada depois dos CSS existentes.
- `classmana-v2-ui.js`: navegação de menu e lista visual que controla os elementos HTML originais.

**Arquivos originais antigos e pacotes ZIP de sprites foram mantidos** para evitar quebra de dependências históricas. Nenhuma imagem de tela inteira é usada como botão ou placar falso.

## Publicar a V2 pelo CMD do Windows (sem tocar na V1)

Extraia o ZIP completo. Dentro da pasta `classmana-v2`, clique duas vezes em **`PUBLICAR_V2.cmd`** (ou execute-o pelo CMD). O script verifica que o código usa a API V2, clona **somente** `drjcs2020/classmana-torneio-arco-e-flecha-V2` numa pasta temporária, copia todos os arquivos e envia o commit para `main` da **V2**. É necessário ter Git for Windows configurado com uma conta autorizada no repositório.

Para rodar a checagem local, use **`TESTAR_V2.cmd`**, que requer Node.js. O pacote inclui os arquivos antigos originais e os sprites descompactados, além dos novos recursos em `assets/v2/`.

**Limite dos testes realizados nesta entrega:** auditorias estáticas e testes isolados de API, duelos e navegação passaram. A renderização final da cena PlayCanvas, partidas reais entre dois navegadores e a publicação em GitHub Pages ainda precisam ser verificadas na URL publicada da V2. As capturas de aparência disponíveis são prévias estáticas, não gravações de uma partida real.
