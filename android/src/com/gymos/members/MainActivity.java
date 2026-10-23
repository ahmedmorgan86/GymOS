package com.gymos.members;
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

/** Member-only HTTPS shell. No JavaScript bridge, file access, or device permissions. */
public final class MainActivity extends Activity {
 private static final String HOST="gymos-enterprise.vercel.app";
 private static final String HOME="https://"+HOST+"/member";
 private WebView web; private ProgressBar progress; private LinearLayout error;
 private static boolean trusted(Uri uri){return uri!=null&&"https".equals(uri.getScheme())&&HOST.equalsIgnoreCase(uri.getHost())&&(uri.getPort()==-1||uri.getPort()==443)&&uri.getUserInfo()==null;}
 private static boolean memberPage(Uri uri){String path=uri.getPath();return trusted(uri)&&path!=null&&(path.equals("/member")||path.startsWith("/member/"));}
 @Override public void onCreate(Bundle state){super.onCreate(state);
  getWindow().setSoftInputMode(android.view.WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
  FrameLayout root=new FrameLayout(this);root.setBackgroundColor(Color.rgb(245,246,252));setContentView(root);
  if(android.os.Build.VERSION.SDK_INT>=30){getWindow().setDecorFitsSystemWindows(false);root.setOnApplyWindowInsetsListener(new View.OnApplyWindowInsetsListener(){@Override public WindowInsets onApplyWindowInsets(View v,WindowInsets insets){android.graphics.Insets bars=insets.getInsets(WindowInsets.Type.systemBars()|WindowInsets.Type.ime());v.setPadding(bars.left,bars.top,bars.right,bars.bottom);return insets;}});}
  web=new WebView(this);root.addView(web,new FrameLayout.LayoutParams(-1,-1));
  progress=new ProgressBar(this,null,android.R.attr.progressBarStyleHorizontal);FrameLayout.LayoutParams pp=new FrameLayout.LayoutParams(-1,8);pp.gravity=android.view.Gravity.TOP;root.addView(progress,pp);
  error=new LinearLayout(this);error.setOrientation(LinearLayout.VERTICAL);error.setGravity(android.view.Gravity.CENTER);error.setPadding(40,40,40,40);error.setBackgroundColor(Color.rgb(245,246,252));
  TextView title=new TextView(this);title.setText("تعذر الاتصال بالنادي\nCheck your internet connection");title.setTextSize(21);title.setTextColor(Color.rgb(20,32,52));title.setGravity(android.view.Gravity.CENTER);error.addView(title);
  Button retry=new Button(this);retry.setText("إعادة المحاولة / Retry");retry.setOnClickListener(new View.OnClickListener(){@Override public void onClick(View v){loadHome();}});error.addView(retry);error.setVisibility(View.GONE);root.addView(error,new FrameLayout.LayoutParams(-1,-1));
  WebView.setWebContentsDebuggingEnabled(false);WebSettings settings=web.getSettings();settings.setJavaScriptEnabled(true);settings.setDomStorageEnabled(true);settings.setAllowFileAccess(false);settings.setAllowContentAccess(false);settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);settings.setSafeBrowsingEnabled(true);settings.setSupportMultipleWindows(false);settings.setJavaScriptCanOpenWindowsAutomatically(false);settings.setMediaPlaybackRequiresUserGesture(true);settings.setUserAgentString(settings.getUserAgentString()+" GymOSMemberAndroid/1.0.0");
  CookieManager.getInstance().setAcceptCookie(true);CookieManager.getInstance().setAcceptThirdPartyCookies(web,false);
  web.setWebChromeClient(new WebChromeClient(){@Override public void onProgressChanged(WebView v,int value){progress.setProgress(value);progress.setVisibility(value<100?View.VISIBLE:View.GONE);}});
  web.setWebViewClient(new WebViewClient(){
   @Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest request){return !memberPage(request.getUrl());}
   @Override public WebResourceResponse shouldInterceptRequest(WebView v,WebResourceRequest request){String asset=request.getUrl().toString();if(trusted(request.getUrl())||(asset.length()<2000000&&(asset.startsWith("data:image/png;base64,")||asset.startsWith("data:image/jpeg;base64,")||asset.startsWith("data:image/webp;base64,"))))return null;return new WebResourceResponse("text/plain","UTF-8",403,"Blocked",java.util.Collections.emptyMap(),new ByteArrayInputStream(new byte[0]));}
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
 private void showError(){runOnUiThread(new Runnable(){@Override public void run(){progress.setVisibility(View.GONE);web.setVisibility(View.GONE);error.setVisibility(View.VISIBLE);}});}
 private void handleBack(){if(web!=null&&web.canGoBack())web.goBack();else finish();}
 @Override public void onBackPressed(){handleBack();}
 @Override protected void onPause(){CookieManager.getInstance().flush();if(web!=null)web.onPause();super.onPause();}
 @Override protected void onResume(){super.onResume();if(web!=null)web.onResume();}
 @Override protected void onDestroy(){if(web!=null){web.stopLoading();((ViewGroup)web.getParent()).removeView(web);web.destroy();}super.onDestroy();}
}
