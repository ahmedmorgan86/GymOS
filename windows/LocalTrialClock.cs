using System.IO;
using System.Security.Cryptography;
using System.Text.Json;
namespace GymOS.Windows;
public record TrialReceipt(DateTimeOffset Started,DateTimeOffset Ends,DateTimeOffset LastSeen);
public sealed class LocalTrialClock {
 readonly string path;TrialReceipt? receipt;
 public LocalTrialClock(string folder){path=Path.Combine(folder,"trial-clock.dat");}
 public TrialReceipt Activate(DateTimeOffset serverStart,DateTimeOffset serverEnd,DateTimeOffset now){
  if(serverEnd<=serverStart||serverEnd-serverStart>TimeSpan.FromDays(30).Add(TimeSpan.FromSeconds(1)))throw new InvalidOperationException("Invalid trial dates");
  if(File.Exists(path))receipt=JsonSerializer.Deserialize<TrialReceipt>(ProtectedData.Unprotect(File.ReadAllBytes(path),null,DataProtectionScope.CurrentUser))??throw new InvalidOperationException("Invalid local trial receipt");
  var end=now.AddDays(30)<serverEnd?now.AddDays(30):serverEnd;
  receipt=receipt==null?new(serverStart,end,now):receipt with{Ends=receipt.Ends<end?receipt.Ends:end};Save();return receipt;
 }
 public bool Allowed(DateTimeOffset now){if(receipt==null)return false;if(now<receipt.LastSeen.AddMinutes(-5)||now<receipt.Started.AddMinutes(-5)||now>=receipt.Ends)return false;receipt=receipt with{LastSeen=now>receipt.LastSeen?now:receipt.LastSeen};Save();return true;}
 void Save(){Directory.CreateDirectory(Path.GetDirectoryName(path)!);var temp=path+".tmp";File.WriteAllBytes(temp,ProtectedData.Protect(JsonSerializer.SerializeToUtf8Bytes(receipt),null,DataProtectionScope.CurrentUser));File.Move(temp,path,true);}
}
