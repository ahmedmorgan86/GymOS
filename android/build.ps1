param(
 [string]$SdkPath = "$env:LOCALAPPDATA\Android\Sdk",
 [string]$JavaHome = 'C:\Program Files\Android\Android Studio\jbr',
 [Parameter(Mandatory=$true)][string]$SigningKey,
 [string]$KeyAlias = 'gymos-member-release',
 [string]$PasswordEnv = 'GYMOS_ANDROID_STORE_PASSWORD'
)
$ErrorActionPreference='Stop'
if(-not [Environment]::GetEnvironmentVariable($PasswordEnv)){throw 'Set the signing password through the named environment variable.'}
$env:JAVA_HOME=$JavaHome
$env:PATH="$JavaHome\bin;"+$env:PATH
$androidRoot=$PSScriptRoot
$repo=Split-Path $androidRoot -Parent
$build=Join-Path $androidRoot ('build/'+(Get-Date -Format 'yyyyMMdd-HHmmss-fff'))
New-Item -ItemType Directory -Path $build,(Join-Path $build 'generated'),(Join-Path $build 'classes'),(Join-Path $build 'dex') -Force | Out-Null
$tools=Join-Path $SdkPath 'build-tools/36.0.0'
$platform=Join-Path $SdkPath 'platforms/android-36/android.jar'
function Check {if($LASTEXITCODE -ne 0){throw "Android build tool failed: $LASTEXITCODE"}}
& "$tools/aapt2.exe" compile --dir "$androidRoot/res" -o "$build/resources.zip";Check
& "$tools/aapt2.exe" link -o "$build/unsigned.apk" -I $platform --manifest "$androidRoot/AndroidManifest.xml" --java "$build/generated" "$build/resources.zip";Check
$sources=@(Get-ChildItem "$androidRoot/src","$build/generated" -Filter '*.java' -Recurse | ForEach-Object {$_.FullName})
& "$JavaHome/bin/javac.exe" -encoding UTF-8 -source 8 -target 8 -bootclasspath $platform -d "$build/classes" @sources;Check
& "$JavaHome/bin/jar.exe" --create --file "$build/classes.jar" -C "$build/classes" .;Check
& "$tools/d8.bat" --release --min-api 26 --lib $platform --output "$build/dex" "$build/classes.jar";Check
& "$JavaHome/bin/jar.exe" --update --file "$build/unsigned.apk" -C "$build/dex" classes.dex;Check
& "$tools/zipalign.exe" -f -p 4 "$build/unsigned.apk" "$build/aligned.apk";Check
$downloads=Join-Path $repo 'public/downloads'
New-Item -ItemType Directory -Path $downloads -Force | Out-Null
$apk=Join-Path $downloads 'GymOS-Members-Android-1.0.1.apk'
& "$tools/apksigner.bat" sign --ks $SigningKey --ks-key-alias $KeyAlias --ks-pass "env:$PasswordEnv" --out $apk "$build/aligned.apk";Check
& "$tools/apksigner.bat" verify --verbose --print-certs $apk;Check
$hash=(Get-FileHash -LiteralPath $apk -Algorithm SHA256).Hash.ToLowerInvariant()
$sourceHashes=[ordered]@{}
$sourceFiles=@(Get-ChildItem "$androidRoot/src","$androidRoot/res" -File -Recurse)+@(Get-Item "$androidRoot/AndroidManifest.xml")
foreach($sourceFile in ($sourceFiles | Sort-Object FullName)){$relative=[System.IO.Path]::GetRelativePath($androidRoot,$sourceFile.FullName).Replace('\','/');$sourceHashes[$relative]=(Get-FileHash -LiteralPath $sourceFile.FullName -Algorithm SHA256).Hash.ToLowerInvariant()}
$release=@{sourceHashes=$sourceHashes;version='1.0.1';versionCode=2;url='/downloads/GymOS-Members-Android-1.0.1.apk';sha256=$hash;bytes=(Get-Item -LiteralPath $apk).Length;minAndroid='8.0';package='com.gymos.members';builtAt=[DateTime]::UtcNow.ToString('o')}
$release | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $downloads 'member-android.json') -Encoding utf8NoBOM
Write-Output ($release | ConvertTo-Json -Compress)
