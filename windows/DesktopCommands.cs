namespace GymOS.Windows;
public static class DesktopCommands {
 public static bool Allowed(string? action)=>action is "status" or "chooseDatabase" or "save" or "export" or "refreshSignIn" or "speechSettings";
}
