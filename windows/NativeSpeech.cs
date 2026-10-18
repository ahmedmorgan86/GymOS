using Windows.Media.Core;
using Windows.Media.Playback;
using Windows.Media.SpeechSynthesis;
namespace GymOS.Windows;
public sealed class NativeSpeech : IDisposable {
 readonly SemaphoreSlim gate=new(1,1);CancellationTokenSource stop=new();int pending;
 public object[] Voices()=>SpeechSynthesizer.AllVoices.Where(v=>v.Language.StartsWith("ar",StringComparison.OrdinalIgnoreCase)||v.Language.StartsWith("en",StringComparison.OrdinalIgnoreCase)).Select(v=>(object)new{id=v.Id,name=v.DisplayName,lang=v.Language}).ToArray();
 public void Stop(){stop.Cancel();stop.Dispose();stop=new CancellationTokenSource();}
 public async Task Speak(string text,string voice,double rate){if(string.IsNullOrWhiteSpace(text)||text.Length>1000||!double.IsFinite(rate)||rate<.5||rate>1.5)throw new InvalidOperationException("Invalid speech request");if(Interlocked.Increment(ref pending)>20){Interlocked.Decrement(ref pending);throw new InvalidOperationException("Speech queue is full");}var token=stop.Token;bool held=false;try{await gate.WaitAsync(token);held=true;token.ThrowIfCancellationRequested();var selected=SpeechSynthesizer.AllVoices.FirstOrDefault(v=>v.Id==voice)??throw new InvalidOperationException("Voice unavailable");using var synth=new SpeechSynthesizer();synth.Voice=selected;synth.Options.SpeakingRate=rate;using var audio=await synth.SynthesizeTextToStreamAsync(text);token.ThrowIfCancellationRequested();using var source=MediaSource.CreateFromStream(audio,audio.ContentType);using var player=new MediaPlayer();var finished=new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);player.MediaEnded+=(_,_)=>finished.TrySetResult();player.MediaFailed+=(_,_)=>finished.TrySetException(new InvalidOperationException("Audio playback failed"));player.Source=source;using var registration=token.Register(()=>{player.Pause();finished.TrySetCanceled(token);});player.Play();await finished.Task.WaitAsync(TimeSpan.FromMinutes(10),token);}finally{if(held)gate.Release();Interlocked.Decrement(ref pending);}}
 public void Dispose(){Stop();stop.Dispose();}
}
