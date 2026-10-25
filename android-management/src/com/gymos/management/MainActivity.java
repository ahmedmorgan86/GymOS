package com.gymos.management;
import android.app.Activity;
import android.os.Bundle;
import android.graphics.Color;
import android.net.Uri;
import android.net.http.SslError;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowInsets;
import android.webkit.CookieManager;
import android.webkit.SslErrorHandler;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import java.io.ByteArrayInputStream;

/** Authenticated management HTTPS shell. No JavaScript bridge or broad file access. Camera is granted only after runtime consent for the trusted application origin. */
public final class MainActivity extends Activity {
 private static final String HOST="gymos-enterprise.vercel.app";
 private static final String HOME="https://"+HOST+"/clubs";
 private android.widget.ImageView splash;private android.webkit.ValueCallback<Uri[]> fileCallback;private android.webkit.PermissionRequest cameraRequest;private static final int PICK_FILE=7001,CAMERA_PERMISSION=7002;
 private WebView web; private ProgressBar progress; private LinearLayout error;
 private static boolean trusted(Uri uri){return uri!=null&&"https".equals(uri.getScheme())&&HOST.equalsIgnoreCase(uri.getHost())&&(uri.getPort()==-1||uri.getPort()==443)&&uri.getUserInfo()==null;}
 private void openExternal(Uri uri){if(uri==null||!"https".equals(uri.getScheme())||uri.getHost()==null||uri.getUserInfo()!=null||(uri.getPort()!=-1&&uri.getPort()!=443))return;try{startActivity(new android.content.Intent(android.content.Intent.ACTION_VIEW,uri));}catch(Exception e){android.widget.Toast.makeText(this,"تعذر فتح الرابط / Cannot open link",android.widget.Toast.LENGTH_LONG).show();}}
 private static boolean authResource(Uri u){return u!=null&&"https".equals(u.getScheme())&&"frsstuqstutbflkaffcx.supabase.co".equalsIgnoreCase(u.getHost())&&u.getUserInfo()==null&&(u.getPort()==-1||u.getPort()==443)&&u.getPath()!=null&&u.getPath().startsWith("/auth/v1/");}
 private static boolean memberPage(Uri uri){String path=uri.getPath();return trusted(uri)&&path!=null;}
 @Override public void onCreate(Bundle state){super.onCreate(state);
  getWindow().setSoftInputMode(android.view.WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
  FrameLayout root=new FrameLayout(this);root.setBackgroundColor(Color.rgb(245,246,252));setContentView(root);
  if(android.os.Build.VERSION.SDK_INT>=30){getWindow().setDecorFitsSystemWindows(false);root.setOnApplyWindowInsetsListener(new View.OnApplyWindowInsetsListener(){@Override public WindowInsets onApplyWindowInsets(View v,WindowInsets insets){android.graphics.Insets bars=insets.getInsets(WindowInsets.Type.systemBars()|WindowInsets.Type.ime());v.setPadding(bars.left,bars.top,bars.right,bars.bottom);return insets;}});}
  web=new WebView(this);root.addView(web,new FrameLayout.LayoutParams(-1,-1));
  progress=new ProgressBar(this,null,android.R.attr.progressBarStyleHorizontal);FrameLayout.LayoutParams pp=new FrameLayout.LayoutParams(-1,8);pp.gravity=android.view.Gravity.TOP;root.addView(progress,pp);
  splash=new android.widget.ImageView(this);splash.setImageResource(R.drawable.logo);int logoSize=(int)(128*getResources().getDisplayMetrics().density);root.addView(splash,new FrameLayout.LayoutParams(logoSize,logoSize,android.view.Gravity.CENTER));
  error=new LinearLayout(this);error.setOrientation(LinearLayout.VERTICAL);error.setGravity(android.view.Gravity.CENTER);error.setPadding(40,40,40,40);error.setBackgroundColor(Color.rgb(245,246,252));
  TextView title=new TextView(this);title.setText("تعذر فتح التطبيق. تحقق من الاتصال وصلاحية حسابك\nCheck connection and account access");title.setTextSize(21);title.setTextColor(Color.rgb(20,32,52));title.setGravity(android.view.Gravity.CENTER);error.addView(title);
  Button retry=new Button(this);retry.setText("إعادة المحاولة / Retry");retry.setOnClickListener(new View.OnClickListener(){@Override public void onClick(View v){loadHome();}});error.addView(retry);error.setVisibility(View.GONE);root.addView(error,new FrameLayout.LayoutParams(-1,-1));
  WebView.setWebContentsDebuggingEnabled(false);WebSettings settings=web.getSettings();settings.setJavaScriptEnabled(true);settings.setDomStorageEnabled(true);settings.setAllowFileAccess(false);settings.setAllowContentAccess(false);settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);settings.setSafeBrowsingEnabled(true);settings.setSupportMultipleWindows(true);settings.setJavaScriptCanOpenWindowsAutomatically(false);settings.setMediaPlaybackRequiresUserGesture(true);settings.setUserAgentString(settings.getUserAgentString()+" GymOSManagerAndroid/1.0.0");
  CookieManager.getInstance().setAcceptCookie(true);CookieManager.getInstance().setAcceptThirdPartyCookies(web,false);
  web.setWebChromeClient(new WebChromeClient(){
   @Override public boolean onCreateWindow(WebView view,boolean dialog,boolean gesture,android.os.Message result){if(!gesture)return false;final WebView child=new WebView(MainActivity.this);child.getSettings().setJavaScriptEnabled(false);child.getSettings().setAllowFileAccess(false);child.getSettings().setAllowContentAccess(false);child.setWebViewClient(new WebViewClient(){private boolean handled=false;@Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest r){Uri target=r.getUrl();if(!handled){handled=true;if(trusted(target)&&!target.getPath().endsWith(".apk"))web.loadUrl(target.toString());else openExternal(target);v.destroy();}return true;}});((WebView.WebViewTransport)result.obj).setWebView(child);result.sendToTarget();return true;}
   @Override public boolean onShowFileChooser(WebView view,android.webkit.ValueCallback<Uri[]> callback,WebChromeClient.FileChooserParams params){if(fileCallback!=null)fileCallback.onReceiveValue(null);fileCallback=callback;try{android.content.Intent intent=params.createIntent();intent.addCategory(android.content.Intent.CATEGORY_OPENABLE);startActivityForResult(intent,PICK_FILE);return true;}catch(Exception e){fileCallback.onReceiveValue(null);fileCallback=null;return true;}}
   @Override public void onPermissionRequest(android.webkit.PermissionRequest request){if(!trusted(request.getOrigin())||request.getResources().length!=1||!android.webkit.PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(request.getResources()[0])){request.deny();return;}if(checkSelfPermission(android.Manifest.permission.CAMERA)==android.content.pm.PackageManager.PERMISSION_GRANTED){request.grant(new String[]{android.webkit.PermissionRequest.RESOURCE_VIDEO_CAPTURE});return;}if(cameraRequest!=null)cameraRequest.deny();cameraRequest=request;requestPermissions(new String[]{android.Manifest.permission.CAMERA},CAMERA_PERMISSION);}
   @Override public void onProgressChanged(WebView v,int value){progress.setProgress(value);progress.setVisibility(value<100?View.VISIBLE:View.GONE);if(value>=100)splash.setVisibility(View.GONE);}});
  web.setWebViewClient(new WebViewClient(){
   @Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest request){if(trusted(request.getUrl())&&request.getUrl().getPath()!=null&&request.getUrl().getPath().endsWith(".apk")){if(request.hasGesture())openExternal(request.getUrl());return true;}if(memberPage(request.getUrl()))return false;if(request.hasGesture())openExternal(request.getUrl());return true;}
   @Override public WebResourceResponse shouldInterceptRequest(WebView v,WebResourceRequest request){String asset=request.getUrl().toString();if(trusted(request.getUrl())||authResource(request.getUrl())||asset.startsWith("blob:https://"+HOST+"/")||(asset.length()<2000000&&(asset.startsWith("data:image/png;base64,")||asset.startsWith("data:image/jpeg;base64,")||asset.startsWith("data:image/webp;base64,"))))return null;return new WebResourceResponse("text/plain","UTF-8",403,"Blocked",java.util.Collections.emptyMap(),new ByteArrayInputStream(new byte[0]));}
   @Override public void onReceivedError(WebView v,WebResourceRequest request,WebResourceError e){if(request.isForMainFrame())showError();}
   @Override public void onReceivedHttpError(WebView v,WebResourceRequest request,WebResourceResponse response){if(request.isForMainFrame()&&response.getStatusCode()>=400)showError();}
   @Override public void onReceivedSslError(WebView v,SslErrorHandler handler,SslError e){handler.cancel();showError();}
   @Override public boolean onRenderProcessGone(WebView v,android.webkit.RenderProcessGoneDetail detail){((ViewGroup)v.getParent()).removeView(v);v.destroy();web=null;recreate();return true;}
  });
  // Never restore an externally supplied URL or save HTML/account data in the activity bundle.
  if(android.os.Build.VERSION.SDK_INT>=33)getOnBackInvokedDispatcher().registerOnBackInvokedCallback(android.window.OnBackInvokedDispatcher.PRIORITY_DEFAULT,new android.window.OnBackInvokedCallback(){@Override public void onBackInvoked(){handleBack();}});
  loadHome();
 }
 private void loadHome(){error.setVisibility(View.GONE);web.setVisibility(View.VISIBLE);web.loadUrl(HOME);}
 private void showError(){if(splash!=null)splash.setVisibility(View.GONE);runOnUiThread(new Runnable(){@Override public void run(){progress.setVisibility(View.GONE);web.setVisibility(View.GONE);error.setVisibility(View.VISIBLE);}});}
 private void handleBack(){if(web!=null&&web.canGoBack())web.goBack();else finish();}
 @Override public void onBackPressed(){handleBack();}
 @Override protected void onActivityResult(int code,int result,android.content.Intent data){super.onActivityResult(code,result,data);if(code==PICK_FILE&&fileCallback!=null){fileCallback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result,data));fileCallback=null;}}
 @Override public void onRequestPermissionsResult(int code,String[] permissions,int[] grants){super.onRequestPermissionsResult(code,permissions,grants);if(code==CAMERA_PERMISSION&&cameraRequest!=null){android.webkit.PermissionRequest request=cameraRequest;cameraRequest=null;if(grants.length>0&&grants[0]==android.content.pm.PackageManager.PERMISSION_GRANTED&&trusted(request.getOrigin()))request.grant(new String[]{android.webkit.PermissionRequest.RESOURCE_VIDEO_CAPTURE});else request.deny();}}
 @Override protected void onPause(){CookieManager.getInstance().flush();if(web!=null){web.onPause();web.pauseTimers();}super.onPause();}
 @Override protected void onResume(){super.onResume();if(web!=null){web.resumeTimers();web.onResume();}}
 @Override protected void onDestroy(){if(web!=null){web.stopLoading();((ViewGroup)web.getParent()).removeView(web);web.destroy();}if(fileCallback!=null){fileCallback.onReceiveValue(null);fileCallback=null;}if(cameraRequest!=null){cameraRequest.deny();cameraRequest=null;}super.onDestroy();}
}
