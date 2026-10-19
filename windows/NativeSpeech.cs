using System.IO;
using Windows.Media.SpeechSynthesis;
namespace GymOS.Windows;
public sealed class NativeSpeech : IDisposable {
 readonly SemaphoreSlim gate=new(1,1);CancellationTokenSource stop=new();int pending;bool disposed;
 public object[] Voices()=>SpeechSynthesizer.AllVoices.Where(v=>v.Language.StartsWith("ar",StringComparison.OrdinalIgnoreCase)||v.Language.StartsWith("en",StringComparison.OrdinalIgnoreCase)).Select(v=>(object)new{id=v.Id,name=v.DisplayName,lang=v.Language}).ToArray();
 public void Stop(){if(disposed)return;var previous=stop;stop=new CancellationTokenSource();previous.Cancel();previous.Dispose();}
 public async Task Speak(string text,string voice,double rate){ObjectDisposedException.ThrowIf(disposed,this);if(string.IsNullOrWhiteSpace(text)||text.Length>1000||!double.IsFinite(rate)||rate<.5||rate>1.5)throw new InvalidOperationException("Invalid speech request");if(Interlocked.Increment(ref pending)>20){Interlocked.Decrement(ref pending);throw new InvalidOperationException("Speech queue is full");}var token=stop.Token;bool held=false;try{await gate.WaitAsync(token);held=true;token.ThrowIfCancellationRequested();var selected=SpeechSynthesizer.AllVoices.FirstOrDefault(v=>v.Id==voice)??throw new InvalidOperationException("Voice unavailable");using var synth=new SpeechSynthesizer();synth.Voice=selected;synth.Options.SpeakingRate=rate;using var audio=await synth.SynthesizeTextToStreamAsync(text).AsTask(token);token.ThrowIfCancellationRequested();using var wav=new MemoryStream();using(var input=audio.AsStreamForRead())await input.CopyToAsync(wav,token);await Task.Run(()=>WavePlayback.Play(wav.ToArray(),token),token);token.ThrowIfCancellationRequested();}finally{if(held)gate.Release();Interlocked.Decrement(ref pending);}}
 public void Dispose(){if(disposed)return;Stop();disposed=true;stop.Dispose();}
}
