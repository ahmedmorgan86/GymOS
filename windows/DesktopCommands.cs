namespace GymOS.Windows;
public static class DesktopCommands {
 public static bool Allowed(string? action)=>action is "trial" or "music" or "musicStop" or "branding" or "status" or "chooseDatabase" or "save" or "export" or "refreshSignIn" or "speechSettings" or "speechVoices" or "speak" or "stopSpeech";
}
