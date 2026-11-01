param([Parameter(Mandatory=$true)][ValidateSet('start','stop')][string]$Action)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$demoDir = Join-Path $root '.demo'
$statePath = Join-Path $demoDir 'launcher-state.json'
$lockPath = Join-Path $demoDir 'launcher.lock'
$appUrl = 'http://127.0.0.1:3218'
$dbArgs = @('compose','--env-file','.env.local','-f','compose.yaml')

function Fail([string]$message) { throw $message }

function Docker([string[]]$arguments) {
  $previousPreference = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try {
    $output = & docker.exe @arguments 2>&1 | Out-String
    $code = $LASTEXITCODE
  } finally { $ErrorActionPreference = $previousPreference }
  if ($code -ne 0) { Fail "Docker falhou. Confira o Docker Desktop e o arquivo .env.local. Detalhe: $($output.Trim())" }
  return $output.Trim()
}

function DockerReady {
  if (-not (Get-Command docker.exe -ErrorAction SilentlyContinue)) { Fail 'Docker Desktop nao encontrado. Instale o Docker Desktop para usar o banco da demo.' }
  $previousPreference = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try {
    & docker.exe info --format '{{.ServerVersion}}' 2>$null | Out-Null
    $code = $LASTEXITCODE
  } finally { $ErrorActionPreference = $previousPreference }
  return ($code -eq 0)
}

function EnsureDocker {
  if (DockerReady) { return }
  $desktop = @(
    (Join-Path $env:ProgramFiles 'Docker\Docker\Docker Desktop.exe'),
    (Join-Path $env:LOCALAPPDATA 'Programs\DockerDesktop\Docker Desktop.exe')
  ) | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
  if (-not $desktop) { Fail 'Docker Desktop instalado, mas o mecanismo nao responde. Abra o Docker Desktop e tente novamente.' }
  Write-Host 'Aguardando o Docker Desktop...'
  if (-not (Get-Process -Name 'Docker Desktop' -ErrorAction SilentlyContinue)) {
    Start-Process -FilePath $desktop -WindowStyle Hidden | Out-Null
  }
  for ($i=0; $i -lt 60; $i++) {
    Start-Sleep -Seconds 2
    if (DockerReady) { return }
  }
  Fail 'Docker Desktop nao ficou disponivel em dois minutos. Confira se ele abriu corretamente.'
}

function GetListenerPid {
  $listener = Get-NetTCPConnection -State Listen -LocalPort 3218 -ErrorAction SilentlyContinue |
    Where-Object { $_.LocalAddress -in @('127.0.0.1','0.0.0.0','::','::1') } |
    Select-Object -First 1
  if ($listener) { return [int]$listener.OwningProcess }
  return 0
}

function DemoResponds {
  try {
    $health = Invoke-WebRequest "$appUrl/api/health" -UseBasicParsing -TimeoutSec 4
    $page = Invoke-WebRequest "$appUrl/onde-comprar" -UseBasicParsing -TimeoutSec 6
    $body = $health.Content | ConvertFrom-Json
    return ($health.StatusCode -eq 200 -and $body.ok -eq $true -and $page.StatusCode -eq 200 -and
      $page.Content -match 'Onde comprar' -and $page.Content -match 'pontos de venda')
  } catch { return $false }
}

function IsDemoListener([int]$processId) {
  $process = Get-CimInstance Win32_Process -Filter "ProcessId=$processId" -ErrorAction SilentlyContinue
  if (-not $process) { return $false }
  return ($process.CommandLine -and
    $process.CommandLine.IndexOf($root,[StringComparison]::OrdinalIgnoreCase) -ge 0 -and
    $process.CommandLine -match 'next' -and $process.CommandLine -match '3218')
}

function LoadState {
  if (-not (Test-Path -LiteralPath $statePath)) { return $null }
  try {
    $state = Get-Content -LiteralPath $statePath -Raw | ConvertFrom-Json
    if ($state.owner -eq 'JP-Pereira-Demo' -and $state.root -eq $root) { return $state }
  } catch {}
  Fail 'Estado do inicializador invalido. Nao vou parar processos sem confirmar a propriedade.'
}

function SaveState($state) {
  $state | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $statePath -Encoding UTF8
}

function ProcessMatches([int]$processId, [string]$createdUtc) {
  if ($processId -le 0 -or -not $createdUtc) { return $false }
  $process = Get-CimInstance Win32_Process -Filter "ProcessId=$processId" -ErrorAction SilentlyContinue
  if (-not $process) { return $false }
  $actualUtc = $process.CreationDate.ToUniversalTime().ToString('o')
  return ($actualUtc -eq $createdUtc -and $process.ExecutablePath -match 'node\.exe$' -and
    $process.CommandLine -match 'next' -and $process.CommandLine -match '3218')
}

function ProcessCreatedUtc([int]$processId) {
  $process = Get-CimInstance Win32_Process -Filter "ProcessId=$processId" -ErrorAction SilentlyContinue
  if ($process) { return $process.CreationDate.ToUniversalTime().ToString('o') }
  return ''
}

function ContainerId {
  return (Docker ($dbArgs + @('ps','-q','db')))
}

function ContainerHealthy([string]$id) {
  if (-not $id) { return $false }
  $health = Docker @('inspect','--format','{{.State.Health.Status}}',$id)
  return ($health -eq 'healthy')
}

function StartDemo {
  if (-not (Test-Path -LiteralPath (Join-Path $root '.env.local'))) { Fail 'Arquivo .env.local ausente. Execute npm run demo:setup nesta pasta antes do primeiro uso.' }
  if (-not (Test-Path -LiteralPath (Join-Path $root '.next\BUILD_ID'))) { Fail 'Compilacao ausente. Execute npm run build nesta pasta antes de iniciar.' }
  if (-not (Test-Path -LiteralPath (Join-Path $root 'node_modules\next\dist\bin\next'))) { Fail 'Dependencias ausentes. Execute npm ci nesta pasta.' }
  $state = LoadState
  $listener = GetListenerPid
  if ($listener -ne 0) {
    $registered = ($state -and [int]$state.listenerPid -eq $listener -and
      (ProcessMatches $listener $state.listenerCreatedUtc))
    if (-not $registered -and -not (IsDemoListener $listener)) {
      Fail 'A porta 3218 esta ocupada por outro processo. Nada foi encerrado.'
    }
    if (-not (DemoResponds)) {
      Write-Host 'O servidor da demo ja existe; verificando o banco...'
      EnsureDocker
      $container = ContainerId
      if (-not (ContainerHealthy $container)) {
        Docker ($dbArgs + @('up','-d','--no-recreate','--wait','db')) | Out-Null
        $container = ContainerId
        if (-not (ContainerHealthy $container)) { Fail 'O PostgreSQL da demo nao ficou saudavel.' }
        if (-not $state) {
          $state = [ordered]@{owner='JP-Pereira-Demo';root=$root;dbStarted=$true;dbContainerId=$container;
            serverPid=0;serverCreatedUtc='';listenerPid=0;listenerCreatedUtc=''}
        } else {
          $state.dbStarted = $true
          $state.dbContainerId = $container
        }
        SaveState $state
      }
      $ready = $false
      for ($i=0; $i -lt 45; $i++) {
        if (DemoResponds) { $ready = $true; break }
        Start-Sleep -Seconds 2
      }
      if (-not $ready) { Fail 'O banco iniciou, mas o servidor existente nao respondeu. Confira os logs do Next.js.' }
    }
    Write-Host 'A demonstracao ja esta funcionando. Abrindo a pagina.'
    Start-Process 'http://localhost:3218/onde-comprar' | Out-Null
    return
  }
  EnsureDocker
  $container = ContainerId
  $ownedDb = $false
  if ($state -and $state.dbStarted -and $state.dbContainerId -eq $container) { $ownedDb = $true }
  if (-not (ContainerHealthy $container)) {
    Write-Host 'Iniciando somente o PostgreSQL da demo...'
    Docker ($dbArgs + @('up','-d','--no-recreate','--wait','db')) | Out-Null
    $container = ContainerId
    if (-not (ContainerHealthy $container)) { Fail 'O PostgreSQL da demo nao ficou saudavel. Confira o Docker Desktop.' }
    $ownedDb = $true
  }
  $state = [ordered]@{owner='JP-Pereira-Demo';root=$root;dbStarted=$ownedDb;dbContainerId=$container;
    serverPid=0;serverCreatedUtc='';listenerPid=0;listenerCreatedUtc=''}
  SaveState $state
  $script:nodePath = (Get-Command node.exe -ErrorAction SilentlyContinue).Source
  if (-not $script:nodePath) { Fail 'Node.js nao encontrado. Instale/ative a versao usada pela demo.' }
  Write-Host 'Iniciando o Next.js na porta 3218...'
  $nextCli = '"' + (Join-Path $root 'node_modules\next\dist\bin\next') + '"'
  $process = Start-Process -FilePath $script:nodePath -ArgumentList @($nextCli,'start','--hostname','127.0.0.1','--port','3218') `
    -WorkingDirectory $root -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $demoDir 'launcher.stdout.log') `
    -RedirectStandardError (Join-Path $demoDir 'launcher.stderr.log')
  $state.serverPid = [int]$process.Id
  $state.serverCreatedUtc = ProcessCreatedUtc $process.Id
  SaveState $state
  for ($i=0; $i -lt 45; $i++) {
    Start-Sleep -Seconds 2
    if (DemoResponds) {
      $listener = GetListenerPid
      $state.listenerPid = $listener
      $state.listenerCreatedUtc = ProcessCreatedUtc $listener
      SaveState $state
      Write-Host 'Demonstracao pronta: http://localhost:3218/onde-comprar'
      Start-Process 'http://localhost:3218/onde-comprar' | Out-Null
      return
    }
    if ($process.HasExited) { break }
  }
  Fail 'O Next.js nao respondeu em 90 segundos. Consulte .demo/launcher.stderr.log. Execute Parar-JP-Pereira.cmd para limpar esta tentativa.'
}

function StopDemo {
  $state = LoadState
  if (-not $state) { Write-Host 'Nenhuma execucao registrada por este inicializador. Nada foi encerrado.'; return }
  $listenerStopped = $false
  if (ProcessMatches ([int]$state.listenerPid) $state.listenerCreatedUtc) {
    Stop-Process -Id ([int]$state.listenerPid) -ErrorAction Stop
    $listenerStopped = $true
  }
  if ([int]$state.serverPid -ne [int]$state.listenerPid -and (ProcessMatches ([int]$state.serverPid) $state.serverCreatedUtc)) {
    Stop-Process -Id ([int]$state.serverPid) -ErrorAction Stop
  }
  Start-Sleep -Seconds 2
  if ((GetListenerPid) -ne 0 -and (DemoResponds)) {
    Fail 'A demo ainda responde na porta 3218, mas o processo nao confere com o registro. Nada mais foi encerrado.'
  }
  if ($state.dbStarted) {
    EnsureDocker
    $container = ContainerId
    if ($container -and $container -eq $state.dbContainerId) {
      Write-Host 'Parando somente o banco Docker desta demo; o volume de dados permanece.'
      Docker ($dbArgs + @('stop','db')) | Out-Null
    } elseif ($container) {
      Fail 'O conteiner do banco mudou desde a inicializacao. Nao vou parar esse conteiner.'
    }
  }
  Remove-Item -LiteralPath $statePath -Force
  Write-Host 'Processos registrados pela demo encerrados. Dados preservados.'
}

try {
  if (-not (Test-Path -LiteralPath $demoDir)) { New-Item -ItemType Directory -Path $demoDir | Out-Null }
  $lock = [System.IO.File]::Open($lockPath, 'OpenOrCreate', 'ReadWrite', 'None')
  try {
    Set-Location -LiteralPath $root
    $node = Get-Command node.exe -ErrorAction SilentlyContinue
    $script:nodePath = if ($node) { $node.Source } else { '' }
    if ($Action -eq 'start') { StartDemo } else { StopDemo }
  } finally { $lock.Dispose() }
  exit 0
} catch {
  Write-Host "ERRO: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}
