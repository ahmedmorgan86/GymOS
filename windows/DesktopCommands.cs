namespace GymOS.Windows;
public static class DesktopCommands {
 public static bool Allowed(string? action)=>action is "branding" or "status" or "chooseDatabase" or "save" or "export" or "refreshSignIn" or "speechSettings" or "speechVoices" or "speak" or "stopSpeech";
}
