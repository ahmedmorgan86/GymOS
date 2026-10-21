using System.IO;
using System.Security.Cryptography;
using System.Text;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.Wpf;
namespace GymOS.Windows;

public static class MusicNavigation {
 static readonly HashSet<string> Hosts=new(StringComparer.OrdinalIgnoreCase){"open.spotify.com","play.anghami.com","mobile.anghami.com","www.anghami.com","anghami.com","music.youtube.com","www.youtube.com","youtube.com","youtu.be","soundcloud.com","www.soundcloud.com","music.apple.com","www.deezer.com","deezer.com","listen.tidal.com","tidal.com","www.tidal.com"};
 public static bool Https(string? value,out Uri uri){uri=null!;return value?.Length<=4000&&Uri.TryCreate(value,UriKind.Absolute,out uri!)&&uri.Scheme=="https"&&string.IsNullOrEmpty(uri.UserInfo)&&uri.IsDefaultPort;}
 public static bool Initial(string? value)=>Https(value,out var uri)&&Hosts.Contains(uri.Host);
 public static bool MayRequestAutoplay(string? value,bool autoplay)=>autoplay&&Initial(value);
 public static string Profile(string scope){if(string.IsNullOrWhiteSpace(scope)||scope.Length>300||scope.Any(char.IsControl))throw new ArgumentException("Invalid music scope");return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(scope)));}
}

// Provider content runs in a separate profile with no GymOS native message bridge.
public sealed class MusicPane:UserControl,IDisposable {
 public event Action? CloseRequested;public event Action? ToggleSizeRequested;
 readonly WebView2 browser=new();readonly TextBlock address=new(){Margin=new Thickness(16,12,16,12),Foreground=Brushes.White,TextWrapping=TextWrapping.Wrap};readonly string target,scope;bool disposed;
 public MusicPane(string url,string ownerScope){if(!MusicNavigation.Initial(url))throw new ArgumentException("Unsupported music provider");_ = MusicNavigation.Profile(ownerScope);target=url;scope=ownerScope;var panel=new DockPanel();var header=new DockPanel{Background=new SolidColorBrush(Color.FromRgb(33,29,49)),LastChildFill=true};var close=new Button{Content="×",Width=34,Height=36,Foreground=Brushes.White,Background=Brushes.Transparent,BorderThickness=new Thickness(0),ToolTip="إغلاق مشغل الموسيقى / Close music"};close.Click+=(_,_)=>CloseRequested?.Invoke();var collapse=new Button{Content="—",Width=34,Height=36,Foreground=Brushes.White,Background=Brushes.Transparent,BorderThickness=new Thickness(0),ToolTip="تصغير / استعادة مشغل الموسيقى / Minimize or restore music"};collapse.Click+=(_,_)=>{browser.Visibility=browser.Visibility==Visibility.Visible?Visibility.Collapsed:Visibility.Visible;ToggleSizeRequested?.Invoke();};DockPanel.SetDock(close,Dock.Right);DockPanel.SetDock(collapse,Dock.Right);header.Children.Add(close);header.Children.Add(collapse);header.Children.Add(address);DockPanel.SetDock(header,Dock.Top);panel.Children.Add(header);panel.Children.Add(browser);Content=panel;address.Text=new Uri(url).GetLeftPart(UriPartial.Authority)+" · سجّل الدخول بحساب المنصة / Sign in to the provider";address.FontSize=12;Loaded+=Start;}
 public void Dispose(){if(disposed)return;disposed=true;browser.Dispose();}
 async void Start(object sender,RoutedEventArgs e){try{var profile=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"GymOS","MusicProfiles",MusicNavigation.Profile(scope));var env=await CoreWebView2Environment.CreateAsync(null,profile);if(disposed)return;await browser.EnsureCoreWebView2Async(env);if(disposed)return;var core=browser.CoreWebView2;core.Settings.AreHostObjectsAllowed=false;core.Settings.IsWebMessageEnabled=false;core.Settings.AreDevToolsEnabled=false;core.Settings.IsPasswordAutosaveEnabled=false;core.PermissionRequested+=(_,args)=>{if(MusicNavigation.MayRequestAutoplay(args.Uri,args.PermissionKind==CoreWebView2PermissionKind.Autoplay)){args.State=MessageBox.Show("السماح بتشغيل الموسيقى ومتابعة القائمة لهذه المنصة داخل التطبيق؟\nAllow music autoplay for this provider inside the app?\n"+new Uri(args.Uri).Host,"GYM OS music",MessageBoxButton.YesNo,MessageBoxImage.Question)==MessageBoxResult.Yes?CoreWebView2PermissionState.Allow:CoreWebView2PermissionState.Deny;}else args.State=CoreWebView2PermissionState.Deny;};
  core.NavigationStarting+=(_,args)=>{if(!MusicNavigation.Https(args.Uri,out var uri)){args.Cancel=true;return;}address.Text=uri.GetLeftPart(UriPartial.Authority);};
  core.NewWindowRequested+=(_,args)=>{args.Handled=true;if(MusicNavigation.Https(args.Uri,out var uri))core.Navigate(uri.AbsoluteUri);};
  core.NavigationCompleted+=(_,args)=>{if(!args.IsSuccess)address.Text="تعذر تحميل المنصة داخل التطبيق. راجع الاتصال أو قيود المنصة. / Provider unavailable. Check connection or provider restrictions.";};core.Navigate(target);
 }catch{if(!disposed)address.Text="تعذر تشغيل المنصة داخل التطبيق. / Could not start the in-app provider player.";}}
}
