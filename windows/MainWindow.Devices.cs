using System.Text.Json;
using System.Windows.Interop;
using System.Windows.Threading;
namespace GymOS.Windows;
public partial class MainWindow {
 readonly DispatcherTimer deviceTimer=new(){Interval=TimeSpan.FromMilliseconds(900)};
 HwndSource? deviceSource;string deviceRequestId="";bool deviceWatch,deviceEnumerating,devicePending;
 void InitDeviceWatch(){
  SourceInitialized+=(_,_)=>{deviceSource=HwndSource.FromHwnd(new WindowInteropHelper(this).Handle);deviceSource?.AddHook(DeviceMessage);};
  deviceTimer.Tick+=(_,_)=>{deviceTimer.Stop();_ = PublishDeviceInventory();};
  Closed+=(_,_)=>{deviceWatch=false;deviceRequestId="";deviceTimer.Stop();deviceSource?.RemoveHook(DeviceMessage);};
 }
 IntPtr DeviceMessage(IntPtr hwnd,int msg,IntPtr w,IntPtr l,ref bool handled){if(msg==0x219&&deviceWatch&&w.ToInt64() is 7 or 0x8000 or 0x8004){deviceTimer.Stop();deviceTimer.Start();}return IntPtr.Zero;}
 bool DevicesPage()=>Browser?.CoreWebView2!=null&&Uri.TryCreate(Browser.Source?.AbsoluteUri,UriKind.Absolute,out var uri)&&uri.GetLeftPart(UriPartial.Authority)==Site&&uri.AbsolutePath=="/";
 void RequestDevices(JsonElement message){if(!DevicesPage()||!message.TryGetProperty("requestId",out var id)||id.ValueKind!=JsonValueKind.String||!DesktopCommands.DeviceInventoryAllowed(Browser.Source?.AbsoluteUri,Site,id.GetString()))return;deviceRequestId=id.GetString()!;deviceWatch=message.TryGetProperty("watch",out var watch)&&watch.ValueKind==JsonValueKind.True;deviceTimer.Stop();deviceTimer.Start();}
 void StopDevices(JsonElement message){if(message.TryGetProperty("requestId",out var id)&&id.ValueKind==JsonValueKind.String&&id.GetString()==deviceRequestId){deviceRequestId="";deviceWatch=false;deviceTimer.Stop();}}
 void ResetDevices(){deviceRequestId="";deviceWatch=false;deviceTimer.Stop();}
 async Task PublishDeviceInventory(){
  if(!DevicesPage()||deviceRequestId.Length==0)return;if(deviceEnumerating){devicePending=true;return;}deviceEnumerating=true;var requestId=deviceRequestId;
  try{ConnectedDevice[] devices;string? error=null;try{devices=await Task.Run(DeviceInventory.Enumerate);}catch{devices=[];error="enumerationUnavailable";}
   if(DevicesPage()&&deviceRequestId==requestId)Browser.CoreWebView2.PostWebMessageAsJson(JsonSerializer.Serialize(new{type="gymos-devices",requestId,devices,error}));
  }catch{/* Closing/navigating the host cancels delivery; no hardware operation is performed. */}finally{deviceEnumerating=false;if(devicePending&&deviceRequestId.Length>0){devicePending=false;deviceTimer.Stop();deviceTimer.Start();}}
 }
}
