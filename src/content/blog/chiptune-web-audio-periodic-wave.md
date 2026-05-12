---
title: '用 Web Audio API 的 PeriodicWave 合成芯片音色：从傅里叶级数到 8-bit 灵魂'
description: '深入 Web Audio API 的 PeriodicWave 接口，用自定义谐波表从零合成经典芯片音色——方波、三角波、锯齿波与噪音，重现 NES/Game Boy 时代的声学魔法。'
date: 2026-05-11
tags: ['芯片音乐', 'Web Audio API', '前端技术', 'TypeScript', '8位文化', '音频合成']
categories: ['技术', '文化']
cover: '/assets/images/banner/8bit-music.webp'
toc: true
---

## 🎵 当傅里叶遇见 8-bit

芯片音乐（Chiptune）的灵魂不在于"低音质"，而在于**用有限的硬件资源创造无限的音乐可能**。NES 的 2A03 芯片只有 5 个声道，Game Boy 的 LR35902 只有 4 个——但正是这些约束催生了整个 8-bit 音乐文化。

> 限制不是枷锁，而是创造力的催化剂。——Brian Eno

当我们在现代浏览器中重现这些音色时，Web Audio API 的 `PeriodicWave` 接口提供了一条从数学到声学的直接路径。它让我们能够**用傅里叶级数定义任意周期波形**，从而精确模拟经典芯片的声学特征。

## 🔊 PeriodicWave：自定义波形的钥匙

Web Audio API 内置了四种基本波形（`sine`、`square`、`sawtooth`、`triangle`），但它们是"理想化"的——而真实芯片产生的波形远非理想。NES 的方波带有微弱的过冲，Game Boy 的三角波有独特的量化台阶，C64 的 SID 芯片甚至允许逐个谐波调节。

`PeriodicWave` 让我们突破内置波形的限制：

```typescript
interface PeriodicWaveOptions {
  real: Float32Array;      // 实部（余弦分量），索引 0 为直流偏移
  imag: Float32Array;      // 虚部（正弦分量），索引 0 必须为 0
  disableNormalization?: boolean;  // 是否禁用自动归一化
}

// 创建自定义波形
const ctx = new AudioContext();

const real = new Float32Array([0, 0, 0, 0]);    // 余弦分量
const imag = new Float32Array([0, 1, 0.5, 0]);  // 正弦分量：基波 + 二次谐波

const wave = ctx.createPeriodicWave(real, imag, {
  disableNormalization: false,
});

const osc = ctx.createOscillator();
osc.setPeriodicWave(wave);
osc.frequency.value = 440; // A4
osc.connect(ctx.destination);
osc.start();
```

### 傅里叶级数回顾

任何周期函数 $f(t)$ 可以展开为傅里叶级数：

$$f(t) = \frac{a_0}{2} + \sum_{n=1}^{\infty} \left[ a_n \cos(n\omega t) + b_n \sin(n\omega t) \right]$$

其中 `real` 数组对应 $a_n$（余弦系数），`imag` 数组对应 $b_n$（正弦系数）。Web Audio API 使用的是**正弦级数形式**，所以 `imag` 是我们的主战场。

## 🎮 经典芯片音色的谐波配方

下面是四种经典芯片波形的傅里叶系数。记住：**理想的波形只是起点，真正的芯片音色来自对这些"理想"的有意偏离。**

| 波形 | 傅里叶特征 | 谐波公式 | 典型芯片 |
|------|-----------|---------|---------|
| **方波** | 只有奇次谐波 | $b_n = \frac{4}{n\pi}$ (n为奇数) | NES 2A03, Game Boy |
| **锯齿波** | 所有谐波，幅度递减 | $b_n = \frac{2}{n\pi}(-1)^{n+1}$ | C64 SID, AY-3-8910 |
| **三角波** | 只有奇次谐波，平方递减 | $b_n = \frac{8}{n^2\pi^2}\sin\frac{n\pi}{2}$ | NES 2A03 (三角波通道) |
| **脉冲波** | 占空比决定谐波分布 | 取决于占空比 d | NES (12.5%, 25%, 50%) |

### 方波：8-bit 的标志性声音

方波是芯片音乐最具辨识度的音色。理想方波只包含奇次谐波：

```typescript
function createSquareWave(ctx: AudioContext, harmonics: number = 16): PeriodicWave {
  const real = new Float32Array(harmonics + 1);
  const imag = new Float32Array(harmonics + 1);

  real[0] = 0;
  imag[0] = 0;

  for (let n = 1; n <= harmonics; n++) {
    real[n] = 0;
    imag[n] = n % 2 === 1 ? (4 / (n * Math.PI)) : 0;  // 只有奇次谐波
  }

  return ctx.createPeriodicWave(real, imag);
}
```

### 三角波：低频声部的温柔

三角波在 NES 上专门用于低音和打击乐通道，其谐波幅度以 $1/n^2$ 的速度衰减，听起来比方波柔和得多：

```typescript
function createTriangleWave(ctx: AudioContext, harmonics: number = 12): PeriodicWave {
  const real = new Float32Array(harmonics + 1);
  const imag = new Float32Array(harmonics + 1);

  real[0] = 0;
  imag[0] = 0;

  for (let n = 1; n <= harmonics; n++) {
    real[n] = 0;
    // 只有 n=1,3,5... 的奇次谐波，且符号交替
    if (n % 2 === 1) {
      imag[n] = (8 / (n * n * Math.PI * Math.PI)) * Math.sin((n * Math.PI) / 2);
    } else {
      imag[n] = 0;
    }
  }

  return ctx.createPeriodicWave(real, imag);
}
```

### 脉冲波：占空比的艺术

NES 的方波通道实际上支持 12.5%、25% 和 50% 三种占空比，不同占空比产生截然不同的音色：

```typescript
function createPulseWave(
  ctx: AudioContext,
  dutyCycle: number = 0.25,  // 占空比：0.125, 0.25, 0.5
  harmonics: number = 20,
): PeriodicWave {
  const real = new Float32Array(harmonics + 1);
  const imag = new Float32Array(harmonics + 1);

  real[0] = dutyCycle - 0.5;  // 直流偏移
  imag[0] = 0;

  for (let n = 1; n <= harmonics; n++) {
    real[n] = 0;
    // 脉冲波的傅里叶系数
    imag[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * dutyCycle);
  }

  return ctx.createPeriodicWave(real, imag);
}
```

| 占空比 | NES 用途 | 音色特征 |
|--------|---------|---------|
| 12.5% | 尖锐的旋律线 | 薄而尖锐，类似簧片 |
| 25% | 主旋律/和声 | 明亮饱满，最常用 |
| 50% | 低音/粗犷旋律 | 厚重温暖，等同于方波 |

## 🎛️ 超越理想：添加芯片的"不完美"

理想波形只是第一步。真实芯片音色之所以迷人，恰恰因为硬件的**非理想特性**：

### 1. 量化台阶（Quantization Staircase）

Game Boy 的三角波不是光滑的曲线，而是由 32 个离散台阶组成的"阶梯波"。我们可以用更高次谐波来模拟这种阶梯效果：

```typescript
function createGameBoyTriangle(ctx: AudioContext): PeriodicWave {
  const steps = 32;       // Game Boy 三角波的量化台阶数
  const harmonics = 64;   // 需要更多谐波来逼近台阶
  const real = new Float32Array(harmonics + 1);
  const imag = new Float32Array(harmonics + 1);

  // 先生成一个周期的台阶波形采样
  const samples = 1024;
  const waveform = new Float32Array(samples);

  for (let i = 0; i < samples; i++) {
    const phase = i / samples;
    const step = Math.floor(phase * steps);
    // 模拟 Game Boy 的量化三角波
    if (phase < 0.5) {
      waveform[i] = (step / (steps / 2)) * 2 - 1;
    } else {
      waveform[i] = 1 - ((step - steps / 2) / (steps / 2)) * 2;
    }
  }

  // DFT → 傅里叶系数
  for (let n = 1; n <= harmonics; n++) {
    let bn = 0;
    for (let i = 0; i < samples; i++) {
      bn += waveform[i] * Math.sin((2 * Math.PI * n * i) / samples);
    }
    imag[n] = (2 * bn) / samples;
  }

  return ctx.createPeriodicWave(real, imag);
}
```

### 2. 谐波衰减与包络

C64 的 SID 芯片允许为每个声道设置独立的包络（ADSR），这是芯片音乐表现力的核心。我们用 `GainNode` 实现经典的快速起音、中等衰减包络：

```typescript
function applyChiptuneEnvelope(
  ctx: AudioContext,
  osc: OscillatorNode,
  duration: number = 0.3,
): GainNode {
  const gain = ctx.createGain();
  const now = ctx.currentTime;

  // 经典芯片 ADSR：快速起音，无延音，短释放
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.8, now + 0.005);   // Attack: 5ms
  gain.gain.linearRampToValueAtTime(0.5, now + 0.05);    // Decay: 50ms
  gain.gain.setValueAtTime(0.5, now + duration - 0.05);  // Sustain
  gain.gain.linearRampToValueAtTime(0, now + duration);   // Release: 50ms

  osc.connect(gain);
  return gain;
}
```

### 3. 硬限幅（Hard Clipping）

经典芯片的 DAC 会在高电平时产生硬限幅，这是一种自然的失真效果：

```typescript
function createHardClipper(ctx: AudioContext, threshold: number = 0.7): WaveShaperNode {
  const shaper = ctx.createWaveShaper();
  const samples = 44100;
  const curve = new Float32Array(samples);

  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    // 硬限幅：超过阈值直接截断
    curve[i] = Math.max(-threshold, Math.min(threshold, x));
  }

  shaper.curve = curve;
  shaper.oversample = '2x';  // 抗混叠
  return shaper;
}
```

## 🎼 组合起来：一个完整的芯片合成器

把以上所有模块组合起来，我们得到一个可以在浏览器中运行的芯片合成器核心：

```typescript
class ChiptuneSynth {
  private ctx: AudioContext;
  private masterGain: GainNode;

  constructor() {
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.5;
    this.masterGain.connect(this.ctx.destination);
  }

  playNote(
    frequency: number,
    waveType: 'square' | 'triangle' | 'pulse25' | 'pulse12',
    duration: number = 0.2,
    startTime?: number,
  ): void {
    const t = startTime ?? this.ctx.currentTime;

    // 选择波形
    let wave: PeriodicWave;
    switch (waveType) {
      case 'square':
        wave = createSquareWave(this.ctx);
        break;
      case 'triangle':
        wave = createTriangleWave(this.ctx);
        break;
      case 'pulse25':
        wave = createPulseWave(this.ctx, 0.25);
        break;
      case 'pulse12':
        wave = createPulseWave(this.ctx, 0.125);
        break;
    }

    const osc = this.ctx.createOscillator();
    osc.setPeriodicWave(wave);
    osc.frequency.value = frequency;

    const env = applyChiptuneEnvelope(this.ctx, osc, duration);
    const clipper = createHardClipper(this.ctx, 0.8);

    // 信号链：振荡器 → 包络 → 限幅 → 主输出
    env.connect(clipper);
    clipper.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + duration + 0.1);  // 多留一点余量给释放
  }

  // 演奏一段经典的上行琶音
  playArpeggio(baseFreq: number = 261.63): void {
    const notes = [1, 1.25, 1.5, 2];  // 根、三度、五度、八度
    const stepDuration = 0.08;          // 琶音速度

    notes.forEach((ratio, i) => {
      this.playNote(
        baseFreq * ratio,
        'pulse25',
        stepDuration,
        this.ctx.currentTime + i * stepDuration,
      );
    });
  }
}

// 🎮 使用示例
const synth = new ChiptuneSynth();
synth.playArpeggio(440);  // A4 起的琶音
```

## 📊 不同浏览器的 PeriodicWave 支持

| 浏览器 | 基本支持 | disableNormalization | 最大谐波数 | 备注 |
|--------|:-------:|:--------------------:|:---------:|------|
| Chrome 25+ | ✅ | ✅ | ~1024 | 最佳实现 |
| Firefox 25+ | ✅ | ✅ | ~512 | 低谐波数表现稳定 |
| Safari 14.1+ | ✅ | ✅ | ~256 | 较高谐波数可能出现伪影 |
| Edge 79+ | ✅ | ✅ | ~1024 | 与 Chromium 一致 |

> ⚠️ 实际使用中，**16-32 个谐波**就足以获得优良的音色。过多的谐波不仅增加 CPU 负担，还可能在低频时产生可闻的混叠失真。

## 🔗 延伸阅读与资源

- [Web Audio API 规范 - PeriodicWave](https://webaudio.github.io/web-audio-api/#PeriodicWave)——官方规范中关于自定义波形的完整定义
- [NES Audio 的秘密](https://www.nesdev.org/wiki/APU)——NES 开发者社区对 2A03 APU 的逆向工程文档
- [C64 SID 芯片手册](http://www.waitingforfriday.com/?p=6582)——SID 芯片寄存器级别的编程指南
- [Chiptune = Win](https://chiptune.win/)——活跃的芯片音乐社区与资源聚合

## 💡 写在最后

从傅里叶级数到 `PeriodicWave`，从纸上的数学公式到浏览器里的 8-bit 声音，我们走过的这条路，和 1980 年代的芯片设计师们何其相似——都是在有限资源中寻找最大表现力。

芯片音乐之所以在 40 年后依然生机勃勃，不是因为它"复古"，而是因为它证明了一个永恒的真理：**创造力不需要最高端的工具，它只需要一个开始。**

下次当你在浏览器里敲下 `createPeriodicWave` 时，请记住——你正在延续一段从 MOS Technology 6502 开始的故事。🎮🔊
