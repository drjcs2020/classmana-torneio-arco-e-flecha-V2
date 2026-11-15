# ClassMana V3 — Cloudflare (ambiente isolado)

Esta é a V3 em desenvolvimento, criada na branch `classmana-v3-cloudflare`.

- V2 oficial: branch `main`, API Railway, sem alterações.
- V3: branch `classmana-v3-cloudflare`, API Cloudflare Worker experimental, D1 `classmana-torneio-v2-teste`.
- Evitar mistura de dados e resultados entre V2 e V3; duelos na V3 não aparecem no ranking V2.
- A V3 ainda NÃO tem hospedagem própria configurada: GitHub Pages do repositório pode continuar servindo a `main`. Não assumir que o endereço oficial carrega a V3.
- O painel do professor exige verificar que a alteração de senha feita no Cloudflare persiste; o hash do professor é secret do Worker, não deve ir para o repositório.
- Não mesclar a branch V3 na main nem alterar a API oficial sem decisão explícita.

## Critérios para promover a V3
- Frontend acessível por uma URL de testes independente.
- Duelo completo com pontuação e ranking no D1, com resultados coerentes.
- Administração do professor operacional.
- Cadastro igual ao aprovado para V3; alterações dinâmicas da V2 são intencionalmente independentes.
- Aprovação explícita para troca da API oficial, se desejada.
