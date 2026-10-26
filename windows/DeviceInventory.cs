using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Text;
namespace GymOS.Windows;

public record ConnectedDevice(string id,string name,string kind,string status);
/// <summary>Read-only enumeration. Presence never certifies a scanner or biometric integration.</summary>
public static class DeviceInventory {
 [StructLayout(LayoutKind.Sequential)] struct DeviceInfo { public uint cbSize;public Guid classGuid;public uint devInst;public UIntPtr reserved; }
 [DllImport("setupapi.dll",CharSet=CharSet.Unicode,SetLastError=true)] static extern IntPtr SetupDiGetClassDevsW(IntPtr guid,string? enumerator,IntPtr parent,uint flags);
 [DllImport("setupapi.dll",SetLastError=true)] [return:MarshalAs(UnmanagedType.Bool)] static extern bool SetupDiEnumDeviceInfo(IntPtr set,uint index,ref DeviceInfo info);
 [DllImport("setupapi.dll",CharSet=CharSet.Unicode,SetLastError=true)] [return:MarshalAs(UnmanagedType.Bool)] static extern bool SetupDiGetDeviceRegistryPropertyW(IntPtr set,ref DeviceInfo info,uint property,out uint type,byte[] buffer,uint size,out uint required);
 [DllImport("setupapi.dll",CharSet=CharSet.Unicode,SetLastError=true)] [return:MarshalAs(UnmanagedType.Bool)] static extern bool SetupDiGetDeviceInstanceIdW(IntPtr set,ref DeviceInfo info,StringBuilder id,uint size,out uint required);
 [DllImport("setupapi.dll",SetLastError=true)] [return:MarshalAs(UnmanagedType.Bool)] static extern bool SetupDiDestroyDeviceInfoList(IntPtr set);
 public static string? Kind(string deviceClass,string name){
  var cls=deviceClass.ToLowerInvariant();var barcode=new[]{"barcode","bar code","datalogic","honeywell","symbol scanner","zebra scanner"}.Any(x=>name.Contains(x,StringComparison.OrdinalIgnoreCase));
  return cls switch {"camera"=>"camera","image" when name.Contains("camera",StringComparison.OrdinalIgnoreCase)||name.Contains("webcam",StringComparison.OrdinalIgnoreCase)=>"camera","audioendpoint"=>"audio","media"=>"audioController","keyboard"=>barcode?"barcode":"keyboard","hidclass"=>barcode?"barcode":"hid","biometric"=>"biometric","ports"=>"serial","printer" or "printqueue"=>"printer","smartcardreader"=>"smartCard","usb" or "usbdevice"=>"usb","bluetooth"=>"bluetooth","net"=>"networkAdapter",_=>null};
 }
 static string Property(IntPtr set,ref DeviceInfo info,uint key){var buffer=new byte[8192];return SetupDiGetDeviceRegistryPropertyW(set,ref info,key,out _,buffer,(uint)buffer.Length,out _)?Clean(Encoding.Unicode.GetString(buffer).TrimEnd('\0')):"";}
 static string Clean(string value)=>new(value.Where(c=>!char.IsControl(c)).Take(200).ToArray());
 public static ConnectedDevice[] Enumerate(){
  if(!OperatingSystem.IsWindows())throw new PlatformNotSupportedException();
  var set=SetupDiGetClassDevsW(IntPtr.Zero,null,IntPtr.Zero,2|4);if(set==new IntPtr(-1))throw new InvalidOperationException("Device enumeration unavailable");
  try{var rows=new List<ConnectedDevice>();for(uint index=0;index<4096&&rows.Count<200;index++){
   var info=new DeviceInfo{cbSize=(uint)Marshal.SizeOf<DeviceInfo>()};if(!SetupDiEnumDeviceInfo(set,index,ref info)){if(Marshal.GetLastWin32Error()==259)break;throw new InvalidOperationException("Device enumeration interrupted");}
   var cls=Property(set,ref info,7);var name=Property(set,ref info,12);if(name.Length==0)name=Property(set,ref info,0);var kind=Kind(cls,name);if(kind==null||name.Length==0)continue;
   var instance=new StringBuilder(2048);if(!SetupDiGetDeviceInstanceIdW(set,ref info,instance,(uint)instance.Capacity,out _))continue;
   // Raw instance paths/serials never leave this helper or enter application logs.
   var id=Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(instance.ToString())))[..24].ToLowerInvariant();
   rows.Add(new(id,name,kind,"detected"));
  }return rows.OrderBy(x=>x.kind).ThenBy(x=>x.name,StringComparer.OrdinalIgnoreCase).ToArray();}finally{SetupDiDestroyDeviceInfoList(set);}
 }
}
