# ClassMana 2.0: publicar APENAS no repositório V2, com validação de segurança.
# Rode pelo arquivo PUBLICAR_V2.cmd no Windows.
$ErrorActionPreference = 'Stop'
$repo = 'https://github.com/drjcs2020/classmana-torneio-arco-e-flecha-V2.git'
$api = 'classmana-v2-duel-api-production.up.railway.app/api'
$src = $PSScriptRoot
$dest = Join-Path $env:TEMP ('classmana-v2-publicacao-' + [Guid]::NewGuid().ToString('N'))
try {
    Write-Host 'CLASSMANA V2 - PUBLICACAO SEGURA' -ForegroundColor Cyan
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw 'Git nao encontrado. Instale Git for Windows.' }
    if (-not (Test-Path (Join-Path $src 'classmana-v2-theme.css'))) { throw 'O arquivo de estilo V2 nao esta na pasta.' }
    if (-not (Test-Path (Join-Path $src 'assets\v2\heroes\aguia-m.webp'))) { throw 'Pacote de imagens V2 incompleto.' }
    $config = Get-Content (Join-Path $src 'online-config.js') -Raw -Encoding UTF8
    if (-not $config.Contains($api) -or $config.Contains('https://classmana-duel-api-production.up.railway.app/api')) {
        throw 'A URL da API nao e exclusiva da V2. Publicacao interrompida.'
    }
    Write-Host 'Baixando SOMENTE o repositorio ClassMana V2...'
    & git clone --depth 1 $repo $dest
    if ($LASTEXITCODE -ne 0) { throw 'Falha ao clonar a V2. Confira sua conexao e acesso ao GitHub.' }
    $origin = (& git -C $dest remote get-url origin).Trim()
    if ($origin -ne $repo) { throw 'Repositorio remoto inesperado. Nenhum arquivo foi enviado.' }
    Write-Host 'Copiando o projeto completo, inclusive imagens e modelos 3D...'
    & robocopy $src $dest /E /R:1 /W:1 /XD .git node_modules /NFL /NDL /NP /NJH /NJS | Out-Null
    if ($LASTEXITCODE -ge 8) { throw 'Falha ao copiar arquivos para o clone local.' }
    & git -C $dest add -A
    if ($LASTEXITCODE -ne 0) { throw 'Falha ao preparar os arquivos.' }
    $changed = & git -C $dest status --porcelain
    if ($changed) {
        & git -C $dest -c user.name='ClassMana V2' -c user.email='classmana-v2@users.noreply.github.com' commit -m 'ClassMana V2: integrar seis telas fantasia e novos assets preservando gameplay'
        if ($LASTEXITCODE -ne 0) { throw 'Falha ao criar o commit local da V2.' }
        Write-Host 'Enviando SOMENTE para a V2...' -ForegroundColor Yellow
        & git -C $dest push origin HEAD:main
        if ($LASTEXITCODE -ne 0) { throw 'GitHub recusou o envio. Confira autenticacao/permissoes. Nada foi enviado para a V1.' }
        Write-Host 'Publicacao concluida na V2!' -ForegroundColor Green
    } else {
        Write-Host 'A V2 ja esta atualizada; nenhum novo commit necessario.' -ForegroundColor Green
    }
    Write-Host 'Repositorio: https://github.com/drjcs2020/classmana-torneio-arco-e-flecha-V2'
    Write-Host 'Para ativar a pagina: Settings > Pages > Deploy from a branch > main > / (root).'
} catch {
    Write-Host ('ERRO: ' + $_.Exception.Message) -ForegroundColor Red
    Write-Host 'A V1 nao foi alterada.' -ForegroundColor Yellow
    exit 1
} finally {
    if (Test-Path $dest) { Remove-Item $dest -Force -Recurse -ErrorAction SilentlyContinue }
}
