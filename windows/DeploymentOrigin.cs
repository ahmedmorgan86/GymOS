namespace GymOS.Windows;
public static class DeploymentOrigin {
 public const string Current="https://gymeg.vercel.app";
 public static string Resolve(string? value){
  if(!Uri.TryCreate(value,UriKind.Absolute,out var uri)||uri.Scheme!="https"||!string.IsNullOrEmpty(uri.UserInfo)||uri.AbsolutePath!="/"||!string.IsNullOrEmpty(uri.Query)||!string.IsNullOrEmpty(uri.Fragment))throw new InvalidOperationException("Set an HTTPS deployment origin in gymos.json.");
  // Keep customer-owned deployment origins, but migrate known retired public hosts.
  if(new[]{"pushtorq.vercel.app","gymos-enterprise.vercel.app","gym-os-liart.vercel.app","gymos-web-pulse.bouncybowl4.chatgpt.site"}.Contains(uri.Host,StringComparer.OrdinalIgnoreCase))return Current;
  return uri.GetLeftPart(UriPartial.Authority);
 }
}
