---
title: '用 Web Audio API 重现芯片音乐：从方波到复古音效'
description: '深入探索如何使用现代浏览器的 Web Audio API 模拟经典芯片音乐——方波合成、NES 风格音序器、噪声生成与实时效果链，用代码复刻 8-Bit 的黄金之声。'
date: 2026-05-07
tags: ['芯片音乐', 'Web Audio API', '前端技术', '8-Bit', 'TypeScript']
categories: ['教程']
cover: '/assets/images/banner/8bit-music.webp'
toc: true
---

## 🎵 为什么在浏览器里做芯片音乐？

芯片音乐（Chiptune）的灵魂在于**限制**——5 个声道、4 种波形、极低采样率。而现代浏览器的 Web Audio API 恰好给了我们"模拟限制"的能力：我们不是要用 100 个效果器堆出华丽音色，而是用代码**精确还原**那些方波、三角波和噪声的独特质感。

> "Chiptune 的美不在于声音有多丰富，而在于你如何在极度有限的声场中创造令人难忘的旋律。"
> —— Jeff Kulowiec, *The Art of Chiptune*

在浏览器中实现芯片音乐，有三个核心价值：

| 价值 | 说明 |
|------|------|
| **零门槛** | 打开 DevTools 就能开始，无需安装 DAW 或插件 |
| **可交互** | 音频与 UI 实时联动，做网页音乐游戏的基础 |
| **可分享** | 一段 URL 即可传播你的作品，比 .mp3 更轻量 |

## 🔊 Web Audio API 核心概念

Web Audio API 是浏览器内置的**图状音频路由系统**。每个节点（`AudioNode`）负责一个任务——振荡、增益、滤波——节点之间通过 `connect()` 连接，音频信号从源节点流向 destination。

```typescript
// 最简化的 Web Audio 拓扑
const audioCtx = new AudioContext();

const oscillator = audioCtx.createOscillator(); // 源：振荡器
const gainNode = audioCtx.createGain();         // 处理：增益

oscillator.type = 'square';  // 方波 = 芯片音乐标志
oscillator.frequency.value = 440; // A4

oscillator.connect(gainNode);
gainNode.connect(audioCtx.destination);

oscillator.start();
```

关键节点类型一览：

| 节点类型 | 作用 | 芯片音乐中的角色 |
|----------|------|------------------|
| `OscillatorNode` | 产生周期波形 | 方波/三角波/锯齿波旋律 |
| `GainNode` | 音量控制 | 音符包络（Attack/Decay） |
| `BiquadFilterNode` | 频率滤波 | 模拟硬件低通滤波 |
| `AudioBufferSourceNode` | 播放采样 | DPCM 采样声道 |
| `ScriptProcessorNode` | 自定义处理 | 自定义噪声/失真 |
| `ConvolverNode` | 卷积混响 | 模拟硬件腔体共振 |

## 🎹 模拟 NES 的五个声道

### Pulse（方波）声道

NES 的方波是最具辨识度的芯片音乐音色。它支持 **25%** 和 **50%** 两种占空比（duty cycle），前者更"薄"适合和声，后者更"厚"适合主旋律。

```typescript
class PulseChannel {
  private osc: OscillatorNode;
  private gain: GainNode;
  private ctx: AudioContext;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.osc = ctx.createOscillator();
    this.gain = ctx.createGain();

    this.osc.type = 'square';
    this.osc.connect(this.gain);
    this.gain.connect(ctx.destination);
    this.gain.gain.value = 0;
    this.osc.start();
  }

  /** 设置占空比（NES 硬件只支持 25% 和 50%） */
  setDuty(duty: 'thin' | 'thick') {
    // Web Audio API 的 square 波 = 50% 占空比
    // 25% 占空比需要用 PeriodicWave 自定义
    if (duty === 'thin') {
      const real = new Float32Array([0, 0, 0, 1]); // 25% 占空比傅里叶系数
      const imag = new Float32Array(real.length);
      const wave = this.ctx.createPeriodicWave(real, imag);
      this.osc.setPeriodicWave(wave);
    } else {
      this.osc.type = 'square';
    }
  }

  /** 播放音符，带简单包络 */
  playNote(freq: number, duration: number, volume = 0.3) {
    const now = this.ctx.currentTime;
    this.osc.frequency.setValueAtTime(freq, now);
    this.gain.gain.cancelScheduledValues(now);
    this.gain.gain.setValueAtTime(volume, now);
    this.gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  }
}
```

### Triangle（三角波）声道

三角波是 NES 的低音担当，音色柔和浑厚。Web Audio API 原生支持 `triangle` 类型：

```typescript
class TriangleChannel {
  private osc: OscillatorNode;
  private gain: GainNode;

  constructor(ctx: AudioContext) {
    this.osc = ctx.createOscillator();
    this.gain = ctx.createGain();
    this.osc.type = 'triangle';
    this.gain.gain.value = 0;
    this.osc.connect(this.gain);
    this.gain.connect(ctx.destination);
    this.osc.start();
  }

  /** 低音行进模式（典型 8-Bit bass line） */
  playBassLine(notes: number[], bpm: number) {
    const beatDuration = 60 / bpm;
    const now = this.ctx.currentTime;

    notes.forEach((freq, i) => {
      const startTime = now + i * beatDuration;
      this.osc.frequency.setValueAtTime(freq, startTime);
      this.gain.gain.setValueAtTime(0.25, startTime);
      this.gain.gain.exponentialRampToValueAtTime(
        0.01, startTime + beatDuration * 0.9
      );
    });
  }
}
```

### Noise（噪声）声道

噪声声道是 NES 的打击乐核心。它不是"白噪声"，而是一种**伪随机序列**，有"长"和"短"两种模式。短模式音高更明确，适合军鼓；长模式更浑浊，适合踩镲。

```typescript
class NoiseChannel {
  private buffer: AudioBuffer;
  private ctx: AudioContext;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    // 创建 NES 风格的伪随机噪声缓冲区
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * 2; // 2 秒循环
    this.buffer = ctx.createBuffer(1, length, sampleRate);

    const data = this.buffer.getChannelData(0);
    // NES 2A03 噪声：基于 LFSR（线性反馈移位寄存器）
    let lfsr = 1;
    for (let i = 0; i < length; i++) {
      const bit = (lfsr >>> 0) & 1;
      data[i] = bit ? 0.5 : -0.5;
      // 16-bit LFSR 反馈
      const feedback = ((lfsr >> 0) ^ (lfsr >> 1)) & 1;
      lfsr = ((lfsr >>> 1) | (feedback << 15)) >>> 0;
    }
  }

  /** 播放打击乐音效 */
  playHit(duration: number, pitch: 'hi' | 'lo' = 'hi') {
    const source = this.ctx.createBufferSource();
    source.buffer = this.buffer;
    source.loop = true;

    // 用播放速率模拟音高
    source.playbackRate.value = pitch === 'hi' ? 4.0 : 1.0;

    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    source.connect(gain);
    gain.connect(this.ctx.destination);
    source.start(now);
    source.stop(now + duration);
  }
}
```

## 🎼 构建一个 NES 风格音序器

有了三个声道，我们来组装一个**可运行的音序器**。它读取一个简单的音符序列，按节拍自动播放：

```typescript
interface NoteEvent {
  channel: 'pulse1' | 'pulse2' | 'triangle' | 'noise';
  freq: number;       // 频率（Hz），噪声声道忽略
  duration: number;    // 时值（拍数）
  duty?: 'thin' | 'thick';
  noisePitch?: 'hi' | 'lo';
}

class NesSequencer {
  private pulse1: PulseChannel;
  private pulse2: PulseChannel;
  private triangle: TriangleChannel;
  private noise: NoiseChannel;
  private ctx: AudioContext;

  constructor() {
    this.ctx = new AudioContext();
    this.pulse1 = new PulseChannel(this.ctx);
    this.pulse2 = new PulseChannel(this.ctx);
    this.triangle = new TriangleChannel(this.ctx);
    this.noise = new NoiseChannel(this.ctx);
  }

  async playSequence(events: NoteEvent[], bpm: number) {
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    const beatDuration = 60 / bpm;
    let currentTime = this.ctx.currentTime + 0.1;

    for (const event of events) {
      const dur = event.duration * beatDuration;
      switch (event.channel) {
        case 'pulse1':
          if (event.duty) this.pulse1.setDuty(event.duty);
          this.pulse1.playNote(event.freq, dur);
          break;
        case 'pulse2':
          if (event.duty) this.pulse2.setDuty(event.duty);
          this.pulse2.playNote(event.freq, dur);
          break;
        case 'triangle':
          this.triangle.playNote(event.freq, dur, 0.2);
          break;
        case 'noise':
          this.noise.playHit(dur, event.noisePitch);
          break;
      }
      currentTime += dur;
    }
  }
}
```

### 演奏超级玛丽开场旋律

```typescript
const sequencer = new NesSequencer();

// 超级玛丽经典开场（简化版）
const marioTheme: NoteEvent[] = [
  // 主旋律
  { channel: 'pulse1', freq: 659.25, duration: 0.5, duty: 'thick' }, // E5
  { channel: 'pulse1', freq: 659.25, duration: 0.5, duty: 'thick' }, // E5
  { channel: 'pulse1', freq: 0,      duration: 0.5 },                 // 休止
  { channel: 'pulse1', freq: 659.25, duration: 0.5, duty: 'thick' }, // E5
  { channel: 'pulse1', freq: 0,      duration: 0.5 },                 // 休止
  { channel: 'pulse1', freq: 523.25, duration: 0.5, duty: 'thick' }, // C5
  { channel: 'pulse1', freq: 659.25, duration: 1.0, duty: 'thick' }, // E5
  { channel: 'pulse1', freq: 783.99, duration: 1.0, duty: 'thick' }, // G5

  // 低音伴奏
  { channel: 'triangle', freq: 261.63, duration: 2.0 }, // C4
  { channel: 'triangle', freq: 392.00, duration: 2.0 }, // G4

  // 打击乐
  { channel: 'noise', freq: 0, duration: 0.5, noisePitch: 'hi' },
  { channel: 'noise', freq: 0, duration: 0.5, noisePitch: 'lo' },
  { channel: 'noise', freq: 0, duration: 0.5, noisePitch: 'hi' },
  { channel: 'noise', freq: 0, duration: 0.5, noisePitch: 'lo' },
];

sequencer.playSequence(marioTheme, 180);
```

## 🔧 进阶：效果链与硬件模拟

### 模拟 NES 的硬件低通滤波

NES 的音频输出自带一个粗糙的低通滤波器，这赋予了芯片音乐标志性的"闷"质感。我们可以用 `BiquadFilterNode` 来模拟：

```typescript
function createNesOutput(ctx: AudioContext): BiquadFilterNode {
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  // NES 输出截止频率约 12kHz
  filter.frequency.value = 12000;
  filter.Q.value = 0.707; // Butterworth 特性
  return filter;
}

// 路由所有声道通过 NES 输出滤波器
const nesOutput = createNesOutput(audioCtx);
pulse1Gain.connect(nesOutput);
pulse2Gain.connect(nesOutput);
triangleGain.connect(nesOutput);
noiseGain.connect(nesOutput);
nesOutput.connect(audioCtx.destination);
```

### 硬限幅失真

NES 硬件在声道叠加时会**硬限幅**——超过阈值直接截断，产生独特的削波失真：

```typescript
function createHardClipper(
  ctx: AudioContext,
  threshold = 0.8
): WaveShaperNode {
  const shaper = ctx.createWaveShaper();
  const samples = 44100;
  const curve = new Float32Array(samples);

  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    // 硬限幅：超过阈值直接截断
    curve[i] = Math.max(-threshold, Math.min(threshold, x));
  }

  shaper.curve = curve;
  shaper.oversample = 'none'; // NES 没有过采样
  return shaper;
}
```

### 完整效果链拓扑

```
Pulse 1 ──┐
Pulse 2 ──┼── [混音] ── [硬限幅] ── [低通滤波] ── destination
Triangle ──┤
  Noise ──┘
```

```typescript
function buildNesEffectChain(ctx: AudioContext) {
  const merger = ctx.createChannelMerger(4);
  const clipper = createHardClipper(ctx, 0.75);
  const lpf = createNesOutput(ctx);

  // 4 声道合并 → 硬限幅 → 低通 → 输出
  merger.connect(clipper);
  clipper.connect(lpf);
  lpf.connect(ctx.destination);

  return { merger, clipper, lpf };
}
```

## 📊 性能优化与实践建议

| 策略 | 说明 | 影响 |
|------|------|------|
| **预分配 AudioBuffer** | 避免在播放时动态创建缓冲区 | 消除 GC 停顿 |
| **复用 OscillatorNode** | 避免频繁 `createOscillator()` | 减少 GC 压力 |
| **使用 `setValueAtTime`** | 优先调度 API，避免 `value` 直接赋值 | 确保时间精度 |
| **限制同时发声数** | NES 只有 5 声道，我们也应克制 | CPU 友好 |
| **AudioWorklet** | 自定义处理移至独立线程 | 主线程零阻塞 |

```typescript
// 使用 AudioWorklet 实现自定义 LFSR 噪声（推荐）
class LfsrNoiseWorklet extends AudioWorkletProcessor {
  private lfsr = 1;
  private mode: 'long' | 'short' = 'long';

  process(_inputs: Float32Array[], outputs: Float32Array[]) {
    const output = outputs[0][0];
    for (let i = 0; i < output.length; i++) {
      const bit = (this.lfsr >>> 0) & 1;
      output[i] = bit ? 0.5 : -0.5;

      if (this.mode === 'long') {
        const fb = ((this.lfsr >> 0) ^ (this.lfsr >> 1)) & 1;
        this.lfsr = ((this.lfsr >>> 1) | (fb << 14)) >>> 0;
      } else {
        const fb = ((this.lfsr >> 0) ^ (this.lfsr >> 6)) & 1;
        this.lfsr = ((this.lfsr >>> 1) | (fb << 14)) >>> 0;
      }
    }
    return true;
  }
}

registerProcessor('lfsr-noise', LfsrNoiseWorklet);
```

## 🎮 延伸：从音频到游戏

将音序器与游戏循环结合，就能做出一个完整的**网页音乐游戏**：

```typescript
// 游戏节拍同步的核心技巧
function syncToBeat(bpm: number) {
  const beatInterval = 60_000 / bpm; // 毫秒
  let lastBeatTime = performance.now();
  let beatCount = 0;

  function gameLoop(now: number) {
    const elapsed = now - lastBeatTime;
    if (elapsed >= beatInterval) {
      beatCount++;
      lastBeatTime += beatInterval;
      onBeat(beatCount); // 触发音符判定、视觉反馈
    }
    requestAnimationFrame(gameLoop);
  }
  requestAnimationFrame(gameLoop);
}
```

> 记住：**节拍是游戏的心跳**。音频和视觉的每一帧都应该锚定在同一个时钟上。

## 🔗 推荐资源

| 资源 | 类型 | 链接 |
|------|------|------|
| Web Audio API 规范 | 文档 | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) |
| Nes_Snd_Emu | C++ 库 | [blargg's site](http://blargg.8bitalley.com/) — 精确 NES 音频模拟 |
| MilkyTracker | 软件 | [milkytracker.org](https://milkytracker.org/) — 经典 Tracker 软件 |
| 8bit Peeps | 社区 | [8bitpeeps.com](https://8bitpeeps.com/) — 芯片音乐社区 |
| chiptune2safety | 文章 | [intractive](https://intractive.bandcamp.com/) — 硬件与安全 |

## 💡 总结

用 Web Audio API 复现芯片音乐，核心不是"多高端的音色"，而是**忠于硬件限制的还原精神**：

1. **方波 + 三角波 + LFSR 噪声** = NES 三件套
2. **占空比切换** = 旋律/和声的薄厚变化
3. **硬限幅 + 低通滤波** = 标志性"闷"质感
4. **精确调度** = `setValueAtTime` 保证时间精度
5. **AudioWorklet** = 自定义处理的线程安全方案

打开浏览器控制台，敲下几行代码，让方波再次响起来——**8-Bit 从未死去，它只是换了一种运行方式**。🎮🔊
