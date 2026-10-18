using System.IO;
using System.Text.Json;
using System.Windows;
using Microsoft.Web.WebView2.Core;
namespace GymOS.Windows;
public partial class MainWindow:Window {
 readonly string Site;
 public MainWindow(){InitializeComponent();var json=JsonDocument.Parse(File.ReadAllText(Path.Combine(AppContext.BaseDirectory,"gymos.json")));var url=json.RootElement.GetProperty("siteUrl").GetString();if(!Uri.TryCreate(url,UriKind.Absolute,out var uri)||uri.Scheme!="https"||!string.IsNullOrEmpty(uri.UserInfo)||uri.AbsolutePath!="/")throw new InvalidOperationException("Set the HTTPS deployment origin in gymos.json.");Site=uri.GetLeftPart(UriPartial.Authority);}
 async void Start(object sender,RoutedEventArgs e){try{
  var profile=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"GymOS","WebProfile");
  var environment=await CoreWebView2Environment.CreateAsync(null,profile);await Browser.EnsureCoreWebView2Async(environment);
  var core=Browser.CoreWebView2;core.Settings.AreDevToolsEnabled=false;core.Settings.IsStatusBarEnabled=false;core.Settings.AreHostObjectsAllowed=false;
  core.NavigationStarting+=(_,args)=>{if(!Uri.TryCreate(args.Uri,UriKind.Absolute,out var uri)||uri.Scheme!="https")args.Cancel=true;};
  core.NewWindowRequested+=(_,args)=>{args.Handled=true;if(Uri.TryCreate(args.Uri,UriKind.Absolute,out var uri)&&uri.Scheme=="https")core.Navigate(uri.AbsoluteUri);};
  core.PermissionRequested+=(_,args)=>{if(args.PermissionKind==CoreWebView2PermissionKind.Camera&&Uri.TryCreate(args.Uri,UriKind.Absolute,out var uri)&&uri.GetLeftPart(UriPartial.Authority)==Site){args.State=MessageBox.Show("السماح للكاميرا بقراءة كارت الحضور؟\nAllow camera access to scan attendance cards?","GYM OS",MessageBoxButton.YesNo,MessageBoxImage.Question)==MessageBoxResult.Yes?CoreWebView2PermissionState.Allow:CoreWebView2PermissionState.Deny;}else args.State=CoreWebView2PermissionState.Deny;};
  core.NavigationCompleted+=(_,args)=>{Status.Visibility=args.IsSuccess?Visibility.Collapsed:Visibility.Visible;Status.Text=args.IsSuccess?"":"تعذر الاتصال. تحقق من الإنترنت ثم أعد تشغيل التطبيق.\nConnection unavailable. Check internet and restart.";};
  core.Navigate(Site);
 }catch(Exception ex){Status.Text="يلزم Microsoft Edge WebView2 Runtime لتشغيل التطبيق.\nInstall Microsoft Edge WebView2 Runtime.\n"+ex.Message;}}
}
