---
title: '从零打造芯片音乐合成器：Web Audio API 实战'
description: '用浏览器原生的 Web Audio API 搭建一个完整的 Chiptune 合成器，深入解析方波、三角波、噪声通道的合成原理与代码实现。'
date: 2026-05-13
tags: ['芯片音乐', 'Web Audio API', '前端技术', '8-Bit', 'TypeScript']
categories: ['技术']
cover: '/assets/images/banner/8bit-music.webp'
toc: true
---

## 🎮 为什么要在浏览器里做芯片音乐？

芯片音乐（Chiptune）的灵魂在于**限制**——恰恰是硬件的约束逼出了最极致的创造力。NES 只有 5 个声道，Game Boy 只有 4 个，而今天浏览器提供的 Web Audio API 拥有几乎无限的声道和采样率。那为什么还要模拟那些"简陋"的声音？

> 限制不是枷锁，而是创造力的催化剂。当你可以用任何音色时，你反而不知道选什么；当只有方波和三角波时，你被迫在旋律与节奏上花更多心思。

答案很简单：**因为那种粗粝的、带着数字体温的声音本身就是一种美学**。而 Web Audio API 让我们可以在不安装任何插件的情况下，直接在浏览器中重现这种美学。

## 🔊 经典芯片的声道架构

在写代码之前，我们需要了解三大经典芯片的声道结构：

| 平台 | 芯片 | 方波声道 | 三角波声道 | 噪声声道 | 采样声道 |
|------|------|---------|-----------|---------|---------|
| NES (FC) | 2A03 | 2 | 1 | 1 | 1 (DPCM) |
| Game Boy | LR35902 | 2 (含1个带扫频) | 0 | 1 | 0 |
| C64 | SID 6581 | 3 (可切换波形) | — | — | — |

关键观察：

- **方波**是旋律的主力——尖锐、穿透力强
- **三角波**通常用于低音线——温暖、厚实
- **噪声通道**负责打击乐和音效——嘶嘶声就是鼓点
- **DPCM/采样通道**是奢侈的补充，用于播放低码率采样

## 🛠️ 搭建 Web Audio 引擎

### 初始化 AudioContext

```typescript
// synth-engine.ts
class ChiptuneEngine {
  private ctx: AudioContext;
  private masterGain: GainNode;

  constructor() {
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.8;
    this.masterGain.connect(this.ctx.destination);
  }

  /** 确保 AudioContext 处于运行状态（浏览器自动暂停策略） */
  async resume() {
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  get audioContext() {
    return this.ctx;
  }

  get master() {
    return this.masterGain;
  }
}
```

> ⚠️ 现代浏览器要求用户交互后才能启动 `AudioContext`。始终在点击/按键事件中调用 `resume()`。

### 方波通道：旋律的脊梁

方波（Square Wave）的丰富度来自**占空比**（Duty Cycle）。NES 的两个方波通道各有 4 种占空比可选：

```
12.5%  ▋░░░░░░░   空洞、笛子感
25%    ▋▋░░░░░░   温暖、类似双簧管
50%    ▋▋▋▋░░░░   经典8-Bit音色   ← 最常用
75%    ▋▋▋▋▋▋░░   饱满、接近锯齿波
```

用 Web Audio API 实现：

```typescript
interface SquareChannelConfig {
  frequency: number;
  dutyCycle: number;  // 0 ~ 1
  duration: number;   // 秒
  volume: number;     // 0 ~ 1
}

class SquareChannel {
  constructor(private engine: ChiptuneEngine) {}

  play({ frequency, dutyCycle, duration, volume }: SquareChannelConfig) {
    const ctx = this.engine.audioContext;
    const now = ctx.currentTime;

    // 使用 PeriodicWave 精确控制占空比
    const real = new Float32Array(32);
    const imag = new Float32Array(32);

    // 方波的傅里叶级数：仅奇次谐波
    for (let n = 1; n < 32; n++) {
      const harmonic = 2 * n - 1;
      imag[harmonic] = (4 / (harmonic * Math.PI))
        * Math.sin(harmonic * Math.PI * dutyCycle);
    }

    const wave = ctx.createPeriodicWave(real, imag);
    const osc = ctx.createOscillator();
    osc.setPeriodicWave(wave);
    osc.frequency.value = frequency;

    // 增益包络：快起快落，模拟芯片硬切
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.005);   // 5ms attack
    gain.gain.setValueAtTime(volume, now + duration - 0.01);
    gain.gain.linearRampToValueAtTime(0, now + duration);      // 10ms release

    osc.connect(gain);
    gain.connect(this.engine.master);
    osc.start(now);
    osc.stop(now + duration + 0.01);
  }
}
```

### 三角波通道：低音的骨骼

三角波天生柔和，NES 用它做低音线。但 NES 的三角波有特殊之处——**没有音量控制**！它要么开要么关，固定在中音量。这种"不灵活"反而成了标志性的浑厚低音。

```typescript
class TriangleChannel {
  constructor(private engine: ChiptuneEngine) {}

  play(frequency: number, duration: number) {
    const ctx = this.engine.audioContext;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = frequency;

    // NES三角波无音量控制，固定增益约0.3
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.setValueAtTime(0.3, now + duration - 0.008);
    gain.gain.linearRampToValueAtTime(0, now + duration);

    osc.connect(gain);
    gain.connect(this.engine.master);
    osc.start(now);
    osc.stop(now + duration + 0.01);
  }
}
```

### 噪声通道：像素风打击乐

噪声通道是芯片音乐的鼓组。NES 的噪声有两种模式：

| 模式 | 描述 | 用途 |
|------|------|------|
| 长周期 (Long) | 32767 步 LFSR | 军鼓、Hi-hat |
| 短周期 (Short) | 93 步 LFSR | 镲片、爆炸音效 |

Web Audio API 提供了 `AudioBuffer` 方式来生成自定义噪声：

```typescript
class NoiseChannel {
  private noiseBuffer: AudioBuffer;

  constructor(private engine: ChiptuneEngine) {
    this.noiseBuffer = this.createNoiseBuffer();
  }

  /** 生成 NES 风格的 LFSR 噪声 */
  private createNoiseBuffer(): AudioBuffer {
    const sampleRate = this.engine.audioContext.sampleRate;
    const length = sampleRate * 2; // 2秒循环
    const buffer = this.engine.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    // 简化的 LFSR（线性反馈移位寄存器）
    let lfsr = 0x7FFF;
    for (let i = 0; i < length; i++) {
      const bit = ((lfsr >> 0) ^ (lfsr >> 1)) & 1;
      lfsr = (lfsr >> 1) | (bit << 14);
      data[i] = (lfsr & 1) ? 1 : -1;
    }

    return buffer;
  }

  play(duration: number, pitch: number = 0) {
    const ctx = this.engine.audioContext;
    const now = ctx.currentTime;

    const source = ctx.createBufferSource();
    source.buffer = this.noiseBuffer;

    // 通过低通滤波器模拟音高变化
    // pitch 越高 → 截止频率越低 → "沉闷"的鼓声
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 8000 - pitch * 600;
    filter.Q.value = 1.0;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.engine.master);
    source.start(now);
    source.stop(now + duration);
  }
}
```

## 🎹 组装完整的合成器

将三个通道组合在一起，我们就得到了一个功能完备的芯片合成器：

```typescript
class ChiptuneSynth {
  readonly square1: SquareChannel;
  readonly square2: SquareChannel;
  readonly triangle: TriangleChannel;
  readonly noise: NoiseChannel;

  constructor() {
    const engine = new ChiptuneEngine();
    this.square1 = new SquareChannel(engine);
    this.square2 = new SquareChannel(engine);
    this.triangle = new TriangleChannel(engine);
    this.noise = new NoiseChannel(engine);
  }
}

// 演奏一段经典 8-Bit 风格旋律
const synth = new ChiptuneSynth();

// 主旋律（方波1，50%占空比）
synth.square1.play({ frequency: 523.25, dutyCycle: 0.5, duration: 0.2, volume: 0.6 }); // C5
synth.square1.play({ frequency: 659.25, dutyCycle: 0.5, duration: 0.2, volume: 0.6 }); // E5
synth.square1.play({ frequency: 783.99, dutyCycle: 0.5, duration: 0.4, volume: 0.6 }); // G5

// 低音线（三角波）
synth.triangle.play(130.81, 0.8);  // C3

// 节奏（噪声通道）
synth.noise.play(0.1, 8);  // "踢鼓"
synth.noise.play(0.05, 2); // "Hi-hat"
```

## 📊 延迟与性能对比

Web Audio API 的实时性直接决定了合成器的可玩性：

| 方案 | 典型延迟 | 优点 | 缺点 |
|------|---------|------|------|
| `OscillatorNode` | < 5ms | API 简单，CPU 低 | 波形种类有限 |
| `PeriodicWave` | < 5ms | 精确占空比控制 | 创建开销略高 |
| `AudioBuffer` + LFSR | < 5ms | 完美还原芯片噪声 | 内存占用 |
| `AudioWorklet` | 1~3ms | 最低延迟，自定义 DSP | 代码复杂度高 |
| `ScriptProcessorNode` | 10~50ms | — | ❌ 已废弃，延迟高 |

> 💡 生产环境推荐 `AudioWorklet` 处理音频线程，主线程只做 UI 和调度。但对于博客 Demo 级别的合成器，`OscillatorNode` + `PeriodicWave` 组合已经足够。

## 🎯 进阶技巧：让声音更"芯片"

光有波形还不够，以下是把"干净的 Web Audio"变成"真正的芯片味"的关键技巧：

### 1. 量化音高

真实芯片的音高是离散的。NES 的方波和三角波通道只有 11 位频率寄存器，精度约为半音的 1/16。刻意将频率**量化到最近的可表示值**能增加颗粒感：

```typescript
function quantizePitch(frequency: number, steps: number = 16): number {
  const semitone = Math.log2(frequency / 440) * 12;
  const quantized = Math.round(semitone * steps) / steps;
  return 440 * Math.pow(2, quantized / 12);
}
```

### 2. 限幅失真

芯片的 DAC 是 4-bit 的，只有 16 级音量。用 `WaveShaperNode` 模拟阶梯量化：

```typescript
function createBitcrusher(ctx: AudioContext, bits: number = 4): WaveShaperNode {
  const steps = Math.pow(2, bits);
  const curve = new Float32Array(8192);
  for (let i = 0; i < 8192; i++) {
    const x = (i * 2) / 8192 - 1;
    curve[i] = Math.round(x * steps) / steps;
  }
  const shaper = ctx.createWaveShaper();
  shaper.curve = curve;
  return shaper;
}
```

### 3. 扫频（Sweep）

Game Boy 的方波通道 1 支持自动频率扫频，这是许多经典音效的基础：

```typescript
// 上升扫频 → "蓄力"音效
osc.frequency.setValueAtTime(200, now);
osc.frequency.exponentialRampToValueAtTime(800, now + 0.3);
```

## 🏁 总结

我们从零搭建了一个浏览器端的芯片音乐合成器，覆盖了三大核心通道的实现。整个引擎不到 200 行 TypeScript，零依赖，却足以还原 8-Bit 时代的标志性音色。

回顾关键设计决策：

- **PeriodicWave** 而非 `type: 'square'` —— 获得精确占空比控制
- **LFSR 噪声** 而非白噪声 —— 还原芯片特有的金属质感
- **硬切包络** 而非平滑包络 —— 这才是芯片声的"脾气"
- **量化和限幅** —— 从数字层面逼近真实硬件的粗粝感

> 芯片音乐教会我们一件事：**创造力不需要最高配置的设备，它只需要一个开始。** 打开浏览器控制台，粘贴上面的代码，你就能听到属于你的第一声方波。🎵

---

*参考资料：*
- *[NES Audio Wiki](https://www.nesdev.org/wiki/APU)*
- *[Web Audio API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)*
- *[Chiptune = Win](https://chiptune.win)*
