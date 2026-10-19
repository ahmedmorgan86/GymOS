using GymOS.Windows;
using Windows.Media.SpeechSynthesis;
using var speech=new NativeSpeech();
var voices=SpeechSynthesizer.AllVoices.Where(v=>v.Language.StartsWith("ar")||v.Language.StartsWith("en")).ToArray();
if(voices.Length==0)throw new Exception("No Arabic/English voices installed");
foreach(var voice in voices){using var synth=new SpeechSynthesizer();synth.Voice=voice;using var stream=await synth.SynthesizeTextToStreamAsync(voice.Language.StartsWith("ar")?"مرحبًا بكم في جيم أو إس":"Welcome to Gym OS");if(stream.Size<100)throw new Exception("Empty audio");Console.WriteLine("PASS synthesis: "+voice.DisplayName+" ("+voice.Language+") "+stream.Size+" bytes");}
foreach(var text in new[]{"",new string('x',1001)}){try{await speech.Speak(text,"invalid",1);throw new Exception("Accepted invalid speech text");}catch(InvalidOperationException){}}
if(args.Contains("--play")){foreach(var language in new[]{"ar","en"}){var voice=voices.First(v=>v.Language.StartsWith(language));await speech.Speak(language=="ar"?"اختبار النداء. مرحبًا بكم في جيم أو إس.":"Announcement test. Welcome to Gym OS.",voice.Id,1);Console.WriteLine("PASS playback driver completed: "+voice.DisplayName);}
var clock=System.Diagnostics.Stopwatch.StartNew();var pending=speech.Speak(string.Join(" ",Enumerable.Repeat("Cancellation test.",30)),voices.First(v=>v.Language.StartsWith("en")).Id,1);await Task.Delay(400);speech.Stop();try{await pending.WaitAsync(TimeSpan.FromSeconds(5));throw new Exception("Stop failed to cancel");}catch(OperationCanceledException){Console.WriteLine("PASS active playback stop, elapsed milliseconds: "+clock.ElapsedMilliseconds);}}
speech.Stop();Console.WriteLine("PASS speech validation");
