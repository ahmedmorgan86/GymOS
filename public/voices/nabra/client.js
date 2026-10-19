// app/lib/local-voice.ts
var worker = null;
var ready = null;
var next = 0;
var jobs = /* @__PURE__ */ new Map();
var active = null;
var context = null;
var generation = 0;
function request(type, extra = {}) {
  return new Promise((resolve, reject) => {
    const id = ++next;
    const timer = setTimeout(() => {
      jobs.delete(id);
      reject(Error("Local voice timeout"));
    }, 12e4);
    jobs.set(id, { resolve, reject, timer });
    worker.postMessage({ id, type, ...extra });
  });
}
async function prepareLocalVoice() {
  if (!ready) {
    worker = new Worker("/voices/nabra/worker.js", { type: "module", name: "GymOS Arabic voice" });
    worker.onmessage = ({ data }) => {
      const job = jobs.get(data.id);
      if (!job) return;
      clearTimeout(job.timer);
      jobs.delete(data.id);
      if (data.error) job.reject(Error(data.error));
      else job.resolve(data);
    };
    worker.onerror = () => {
      for (const job of jobs.values()) {
        clearTimeout(job.timer);
        job.reject(Error("Local voice unavailable"));
      }
      jobs.clear();
      worker?.terminate();
      worker = null;
      ready = null;
    };
    ready = request("load").then(() => {
    }).catch((error) => {
      worker?.terminate();
      worker = null;
      ready = null;
      throw error;
    });
  }
  await ready;
}
function stopLocalVoice() {
  generation++;
  active?.stop();
  active = null;
}
var playbackQueue = Promise.resolve();
function unlockLocalAudio() {
  context ??= new AudioContext();
  return context.resume();
}
function playLocalVoice(text, rate) {
  const requested = generation;
  const job = playbackQueue.catch(() => {
  }).then(() => {
    if (requested !== generation) throw Error("Stopped");
    return playOne(text, rate);
  });
  playbackQueue = job;
  return job;
}
async function playOne(text, rate) {
  if (!text.trim() || text.length > 1e3 || rate < 0.5 || rate > 1.5) throw Error("Invalid voice request");
  const current = generation;
  context ??= new AudioContext();
  await context.resume();
  await prepareLocalVoice();
  if (current !== generation) throw Error("Stopped");
  const result = await request("generate", { text, rate });
  if (current !== generation) throw Error("Stopped");
  if (!result.audio?.length || !result.sampleRate) throw Error("Empty audio");
  const buffer = context.createBuffer(1, result.audio.length, result.sampleRate);
  buffer.getChannelData(0).set(result.audio);
  await new Promise((resolve, reject) => {
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    active = source;
    source.onended = () => {
      if (active === source) active = null;
      if (current !== generation) reject(Error("Stopped"));
      else resolve();
    };
    source.start();
  });
  return { samples: result.audio.length, sampleRate: result.sampleRate };
}
export {
  playLocalVoice,
  prepareLocalVoice,
  stopLocalVoice,
  unlockLocalAudio
};
