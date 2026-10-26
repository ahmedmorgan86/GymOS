namespace GymOS.Windows;
public static class DesktopCommands {
 public static bool Allowed(string? action)=>action is "trial" or "music" or "musicStop" or "branding" or "status" or "chooseDatabase" or "save" or "export" or "refreshSignIn" or "speechSettings" or "speechVoices" or "speak" or "stopSpeech" or "devices" or "stopDevices" or "soundSettings";
 public static bool DeviceInventoryAllowed(string? source,string site,string? requestId)=>Guid.TryParse(requestId,out _)&&Uri.TryCreate(source,UriKind.Absolute,out var uri)&&uri.Scheme=="https"&&string.IsNullOrEmpty(uri.UserInfo)&&uri.GetLeftPart(UriPartial.Authority)==site&&uri.AbsolutePath=="/";
}
