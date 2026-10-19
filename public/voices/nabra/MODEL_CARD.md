---
license: apache-2.0
language: [ar]
pipeline_tag: text-to-speech
library_name: onnx
base_model: oddadmix/Nabra-7M-Distill
tags: [tts, arabic, kokoro, styletts2, onnx, onnxruntime-web, webgpu, on-device]
---

# Nabra-7M-Distill (ONNX)

ONNX export of [oddadmix/Nabra-7M-Distill](https://huggingface.co/oddadmix/Nabra-7M-Distill), a 7.48M-parameter
Arabic (MSA) text-to-speech model. These files are used by the [`nabra-tts`](https://www.npmjs.com/package/nabra-tts) npm package,
which runs the model fully client-side with ONNX Runtime Web (WebGPU / WASM).

```bash
npm i nabra-tts
```

```ts
import { NabraTTS } from 'nabra-tts';
const tts = await NabraTTS.load();
const { audio, sampleRate } = await tts.generate('مَرْحَبًا بِكُمْ'); // 24 kHz mono
```

## Files

| file | size | |
|---|---:|---|
| `onnx/model.onnx` | 30.5 MB | fp32 |
| `onnx/model_fp16.onnx` | 16.0 MB | fp16 weights, fp32 inputs/outputs |
| `voices/af_msa.bin` | 0.5 MB | voice pack `af_msa`, raw little-endian float32 `[510, 256]` |
| `config.json` | | original config (vocab) |

## Inputs / outputs

| name | type | shape | |
|---|---|---|---|
| `input_ids` | int64 | `[1, T]` | phoneme token ids, wrapped in `0 … 0`; T ≤ 512 |
| `style` | float32 | `[1, 256]` | row `len(phonemes) - 1` of the voice pack |
| `speed` | float32 | `[1]` | 1.0 = normal |
| `waveform` | float32 | `[N]` | 24 kHz audio |
| `durations` | int64 | `[T]` | predicted frames per token |

The phonemes come from espeak-ng (`ar`) followed by `clean_phonemes` from `arabic_g2p.py` in the source repository.
ʕ and ħ map to token ids 7 and 8.

## Validation

The export is checked against PyTorch on held-out sentences. The ISTFTNet source injects random noise, so samples
never match bit-for-bit. The comparison uses mean log-spectrogram distance, with a second PyTorch run giving the noise floor:

| | mean Δ log-spec |
|---|---:|
| PyTorch rerun (noise floor) | 0.350 |
| `model.onnx` | 0.350 |
| `model_fp16.onnx` | 0.360 |

Output lengths (durations) are identical. Dynamic int8 quantization was tested and dropped. It saved only 27% and audibly
degraded the output.

Export script: [`export/export_onnx.py`](https://github.com/oddadmix/nabra-tts/blob/main/export/export_onnx.py) in the nabra-tts repository.
