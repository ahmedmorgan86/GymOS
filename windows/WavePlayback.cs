using System.Runtime.InteropServices;
using System.Text;
namespace GymOS.Windows;
// PCM output uses an event from the Windows audio driver so cancellation and completion are observable.
internal static class WavePlayback {
 [StructLayout(LayoutKind.Sequential,Pack=2)]struct Format{public ushort tag,channels;public uint samples,bytes;public ushort align,bits,extra;}
 [StructLayout(LayoutKind.Sequential)]struct Header{public IntPtr data;public uint length,recorded;public UIntPtr user;public uint flags,loops;public IntPtr next;public UIntPtr reserved;}
 [DllImport("winmm.dll")]static extern uint waveOutOpen(out IntPtr device,uint mapper,ref Format format,IntPtr callback,UIntPtr instance,uint flags);
 [DllImport("winmm.dll")]static extern uint waveOutPrepareHeader(IntPtr device,IntPtr header,uint size);
 [DllImport("winmm.dll")]static extern uint waveOutWrite(IntPtr device,IntPtr header,uint size);
 [DllImport("winmm.dll")]static extern uint waveOutReset(IntPtr device);
 [DllImport("winmm.dll")]static extern uint waveOutUnprepareHeader(IntPtr device,IntPtr header,uint size);
 [DllImport("winmm.dll")]static extern uint waveOutClose(IntPtr device);
 static void Check(uint code){if(code!=0)throw new InvalidOperationException("Windows audio output error "+code);}
 public static void Play(byte[] wav,CancellationToken token){
  if(wav.Length<44||Encoding.ASCII.GetString(wav,0,4)!="RIFF"||Encoding.ASCII.GetString(wav,8,4)!="WAVE")throw new InvalidOperationException("Invalid synthesized WAV");
  Format format=default;int offset=0,count=0;
  for(int p=12;p+8<=wav.Length;){string id=Encoding.ASCII.GetString(wav,p,4);int size=BitConverter.ToInt32(wav,p+4);p+=8;if(size<0||size>wav.Length-p)throw new InvalidOperationException("Invalid WAV chunk");if(id=="fmt "&&size>=16)format=new(){tag=BitConverter.ToUInt16(wav,p),channels=BitConverter.ToUInt16(wav,p+2),samples=BitConverter.ToUInt32(wav,p+4),bytes=BitConverter.ToUInt32(wav,p+8),align=BitConverter.ToUInt16(wav,p+12),bits=BitConverter.ToUInt16(wav,p+14)};if(id=="data"){offset=p;count=size;}p+=size+(size&1);}
  if(format.tag!=1||format.bytes==0||count==0)throw new InvalidOperationException("Unsupported speech PCM format");
  using var done=new EventWaitHandle(false,EventResetMode.ManualReset);Check(waveOutOpen(out var device,uint.MaxValue,ref format,done.SafeWaitHandle.DangerousGetHandle(),UIntPtr.Zero,0x50000));
  var buffer=GCHandle.Alloc(wav,GCHandleType.Pinned);var header=Marshal.AllocHGlobal(Marshal.SizeOf<Header>());uint headerSize=(uint)Marshal.SizeOf<Header>();bool prepared=false;
  try{Marshal.StructureToPtr(new Header{data=IntPtr.Add(buffer.AddrOfPinnedObject(),offset),length=(uint)count},header,false);Check(waveOutPrepareHeader(device,header,headerSize));prepared=true;token.ThrowIfCancellationRequested();done.Reset();Check(waveOutWrite(device,header,headerSize));var deadline=DateTime.UtcNow.AddMinutes(10);while((Marshal.PtrToStructure<Header>(header).flags&1)==0){token.ThrowIfCancellationRequested();if(DateTime.UtcNow>deadline)throw new TimeoutException("Speech output timed out");WaitHandle.WaitAny(new[]{done,token.WaitHandle},250);done.Reset();}token.ThrowIfCancellationRequested();}
  finally{waveOutReset(device);if(prepared)waveOutUnprepareHeader(device,header,headerSize);waveOutClose(device);Marshal.FreeHGlobal(header);buffer.Free();}
 }
}
