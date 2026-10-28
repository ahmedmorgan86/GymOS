param(
 [Parameter(Mandatory=$true)][ValidatePattern('^[A-Fa-f0-9]{40}$')][string]$CertificateThumbprint,
 [Parameter(Mandatory=$true)][string]$Executable,
 [Parameter(Mandatory=$true)][ValidatePattern('^https?://')][string]$TimestampUrl
)
$ErrorActionPreference = 'Stop'
# Use an existing trusted code-signing certificate in CurrentUser/My.
# Hardware-backed/cloud certificates require the vendor provider installed first.
$cert = Get-Item "Cert:\CurrentUser\My\$CertificateThumbprint"
if ($cert.NotAfter -le (Get-Date)) { throw 'Certificate expired' }
if (-not $cert.HasPrivateKey) { throw 'Signing private key is unavailable' }
if (-not ($cert.EnhancedKeyUsageList.ObjectId.Value -contains '1.3.6.1.5.5.7.3.3')) { throw 'Not a code-signing certificate' }
$target = (Resolve-Path -LiteralPath $Executable).Path
& signtool sign /s My /sha1 $CertificateThumbprint /fd SHA256 /tr $TimestampUrl /td SHA256 $target
if ($LASTEXITCODE -ne 0) { throw 'Signing failed' }
& signtool verify /pa /all /v $target
if ($LASTEXITCODE -ne 0) { throw 'Authenticode verification failed' }
$signature = Get-AuthenticodeSignature -LiteralPath $target
if ($signature.Status -ne 'Valid' -or $signature.SignerCertificate.Thumbprint -ne $CertificateThumbprint) { throw 'Publisher validation failed' }
Get-FileHash -Algorithm SHA256 -LiteralPath $target
