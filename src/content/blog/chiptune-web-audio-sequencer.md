---
title: '用 Web Audio API 构建芯片音乐音序器'
description: '从零开始，用 Web Audio API 实现一个完整的 Step Sequencer，重现经典芯片音乐的方波、三角波与噪声通道，让浏览器变成你的8-Bit音乐工作站。'
date: 2026-05-12
tags: ['芯片音乐', 'Web Audio API', '前端技术', '8-Bit', '音序器']
categories: ['技术']
cover: '/assets/images/banner/8bit-music.webp'
toc: true
---

## 🎹 为什么要在浏览器里做芯片音乐？

芯片音乐（Chiptune）的灵魂在于**限制**——有限的声道、有限的波形、有限的效果。而 Web Audio API 给了我们精确到采样的控制力，让我们能在浏览器中还原甚至超越经典声音芯片的能力。

> "Creativity thrives on constraints. The NES gave you 5 channels and 64KB of memory, and people made masterpieces." —— Neil Baldwin, NES Audio Programmer

构建一个 Step Sequencer 是理解芯片音乐和 Web Audio API 的最佳实践。你将学到：

- 如何生成方波、三角波和噪声——三大芯片音乐波形
- 如何设计 Step Sequencer 的数据结构与调度逻辑
- 如何用 `AudioWorklet` 实现零延迟的实时音频处理
- 如何添加经典的芯片音乐效果：Arpeggio、Vibrato、Pitch Slide

## 🔊 三大核心波形解析

### NES 2A03 芯片声道一览

| 声道 | 波形 | 硬件特性 | 典型用途 |
|------|------|----------|----------|
| Pulse 1 | 方波 | 扫频、包络 | 主旋律 |
| Pulse 2 | 方波 | 扫频、包络 | 和声/副旋律 |
| Triangle | 三角波 | 固定音量 | 低音贝斯 |
| Noise | 伪随机噪声 | 2种模式 | 鼓点/打击乐 |
| DMC | Delta调制 | 采样播放 | 鼓采样/语音 |

我们先实现前4个声道——它们是芯片音乐的绝对核心。

### 方波生成：Duty Cycle 是关键

NES 的方波有 4 种占空比（Duty Cycle），这直接决定了音色的明亮程度：

```typescript
// 方波占空比定义
const DUTY_CYCLES = {
  0: 0.125,  // 12.5% - 空灵、尖锐
  1: 0.25,   // 25%  - 明亮、经典
  2: 0.5,    // 50%  - 柔和、类木管
  3: 0.75,   // 75%  - 接近50%但相位反转
} as const;

function createPulseOscillator(
  ctx: AudioContext,
  frequency: number,
  duty: number
): OscillatorNode {
  const osc = ctx.createOscillator();
  osc.type = 'square'; // Web Audio 的 square 是 50% 占空比
  osc.frequency.value = frequency;

  // 要实现其他占空比，需要用 PeriodicWave 或 AudioWorklet
  // 这里先用标准方波，后续用 AudioWorklet 替换
  return osc;
}
```

> ⚠️ Web Audio API 内置的 `square` 波形固定为 50% 占空比。要实现 NES 的 12.5% 和 25% 占空比，需要自定义 `PeriodicWave` 或 `AudioWorklet`。

### 用 PeriodicWave 自定义占空比

```typescript
function createCustomPulseWave(
  ctx: AudioContext,
  dutyCycle: number,
  harmonics = 32
): PeriodicWave {
  const real = new Float32Array(harmonics);
  const imag = new Float32Array(harmonics);

  // 方波的傅里叶级数：只有奇次谐波
  // a_n = (4 / nπ) * sin(nπ * dutyCycle)
  for (let n = 1; n < harmonics; n++) {
    const coefficient = (4 / (n * Math.PI)) * Math.sin(n * Math.PI * dutyCycle);
    imag[n] = coefficient;
  }

  return ctx.createPeriodicWave(real, imag, { disableNormalization: false });
}
```

### 三角波与噪声

三角波用作贝斯再经典不过——NES 的三角波通道音量不可调，正好模拟那种"稳如磐石"的低音：

```typescript
function createTriangleBass(
  ctx: AudioContext,
  frequency: number
): OscillatorNode {
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.value = frequency;
  // NES 三角波固定音量，不接 GainNode 包络
  return osc;
}
```

噪声通道是打击乐的灵魂。NES 使用 LFSR（线性反馈移位寄存器）生成伪随机序列，有"长"和"短"两种模式：

```typescript
function createNoiseChannel(ctx: AudioContext): AudioBufferSourceNode {
  const bufferSize = ctx.sampleRate * 2; // 2秒噪声缓冲
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  // LFSR 伪随机噪声（简化版，模拟 NES 短模式）
  let lfsr = 0x1;
  for (let i = 0; i < bufferSize; i++) {
    const bit = ((lfsr >> 0) ^ (lfsr >> 1)) & 1;
    lfsr = (lfsr >> 1) | (bit << 14);
    data[i] = (lfsr & 1) * 2 - 1; // 映射到 -1 ~ 1
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  return source;
}
```

## 🎼 Step Sequencer 数据结构设计

音序器的核心是**模式（Pattern）**——一个时间网格，每个格子存储一条音符指令：

```typescript
interface SequencerNote {
  frequency: number;     // 音高 (Hz), 0 表示静音
  instrument: 'pulse1' | 'pulse2' | 'triangle' | 'noise';
  duty?: number;         // 方波占空比 (仅 pulse 通道)
  effect?: ArpeggioEffect | VibratoEffect | SlideEffect;
  volume: number;        // 0 ~ 1
}

interface Pattern {
  id: string;
  steps: SequencerNote[][];  // 16步 × 声道数
  bpm: number;
  swing: number;             // 0 ~ 1, Shuffle 感
}

// 一个经典的4声道芯片音乐 Pattern
const demoPattern: Pattern = {
  id: 'main-theme',
  bpm: 140,
  swing: 0,
  steps: [
    // Step 0: C大调和弦 + 贝斯 + 底鼓
    [
      { frequency: 523.25, instrument: 'pulse1', duty: 0.25, volume: 0.8 },
      { frequency: 130.81, instrument: 'triangle', volume: 0.6 },
      { frequency: 0, instrument: 'noise', volume: 0.7 }, // 底鼓
    ],
    // Step 1: 静音
    [],
    // ... 共 16 步
  ],
};
```

### 音符频率查找表

芯片音乐家不需要实时计算频率——我们用查找表：

```typescript
// A4 = 440Hz, 12平均律
const NOTE_TABLE: Record<string, number> = {};
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

for (let octave = 1; octave <= 8; octave++) {
  for (let i = 0; i < 12; i++) {
    const midi = (octave + 1) * 12 + i;
    const freq = 440 * Math.pow(2, (midi - 69) / 12);
    NOTE_TABLE[`${NOTE_NAMES[i]}${octave}`] = Math.round(freq * 100) / 100;
  }
}

// 常用芯片音乐音域
console.log(NOTE_TABLE['C3']); // 130.81 - 贝斯区
console.log(NOTE_TABLE['A4']); // 440.00 - 中音区
console.log(NOTE_TABLE['C6']); // 1046.50 - 高音区
```

| 音名 | 频率 (Hz) | 典型用途 |
|------|-----------|----------|
| C2 | 65.41 | 极低音（较少使用） |
| C3 | 130.81 | 三角波贝斯 |
| E4 | 329.63 | 主旋律中音区 |
| A4 | 440.00 | 标准音高参考 |
| C6 | 1046.50 | 方波高音区 |

## ⏱️ 精确调度：Lookahead 调度器

Web Audio API 的时间轴和 JavaScript 的事件循环是两个独立的世界。要实现精确的音序播放，必须使用 **Lookahead 调度模式**：

```typescript
class ChipSequencer {
  private ctx: AudioContext;
  private tempo: number;
  private currentStep = 0;
  private nextStepTime = 0;
  private lookahead = 25;         // ms, 调度检查间隔
  private scheduleAheadTime = 0.1; // 秒, 提前调度窗口
  private timerID: number | null = null;

  constructor(ctx: AudioContext, tempo = 140) {
    this.ctx = ctx;
    this.tempo = tempo;
  }

  start(): void {
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.currentStep = 0;
    this.nextStepTime = this.ctx.currentTime;
    this.scheduler();
  }

  stop(): void {
    if (this.timerID !== null) {
      clearTimeout(this.timerID);
      this.timerID = null;
    }
  }

  private scheduler(): void {
    // 提前调度落入窗口内的所有步骤
    while (this.nextStepTime < this.ctx.currentTime + this.scheduleAheadTime) {
      this.scheduleStep(this.currentStep, this.nextStepTime);
      const secondsPerBeat = 60.0 / this.tempo;
      // 每拍4步 (16th notes)
      this.nextStepTime += secondsPerBeat / 4;
      this.currentStep = (this.currentStep + 1) % 16;
    }
    this.timerID = window.setTimeout(
      () => this.scheduler(),
      this.lookahead
    );
  }

  private scheduleStep(step: number, time: number): void {
    const notes = this.pattern.steps[step];
    for (const note of notes) {
      this.playNote(note, time);
    }
    // 通知 UI 更新（用于高亮当前步骤）
    this.onStep?.(step, time);
  }

  onStep?: (step: number, time: number) => void;

  private playNote(note: SequencerNote, time: number): void {
    // 根据乐器类型创建对应振荡器
    // ...
  }
}
```

> 💡 **关键原则**：永远不要在 `requestAnimationFrame` 或 `setTimeout` 回调中直接播放音频——它们的时间精度只有 ~15ms，远不够音乐调度。使用 `AudioContext.currentTime` 的绝对时间戳来调度，让音频硬件自己处理精确时序。

## 🎸 经典芯片音乐效果

### Arpeggio（快速琶音）—— 用3个音模拟和弦

NES 只有2个方波通道，怎么同时播放和弦？答案是 **Arpeggio**——在三个音符之间快速切换，人耳会"融合"出一个和弦的感觉：

```typescript
class ArpeggioEffect {
  private notes: number[];   // 琶音音符频率数组
  private speed: number;     // 切换速率 (Hz)
  private osc: OscillatorNode;

  apply(osc: OscillatorNode, ctx: AudioContext, startTime: number): void {
    const stepDuration = 1 / this.speed;
    for (let i = 0; i < this.notes.length * 4; i++) {
      const noteIndex = i % this.notes.length;
      const time = startTime + i * stepDuration;
      osc.frequency.setValueAtTime(this.notes[noteIndex], time);
    }
  }
}

// 使用：C大调和弦琶音
const arp = new ArpeggioEffect();
arp.notes = [261.63, 329.63, 392.00]; // C4, E4, G4
arp.speed = 50; // 每秒切换50次 → 听起来像一个和弦
```

### Vibrato（颤音）—— 模拟 LFO 调制

```typescript
function addVibrato(
  ctx: AudioContext,
  osc: OscillatorNode,
  rate = 6,     // Hz, 颤音速率
  depth = 3     // Hz, 颤音深度
): OscillatorNode {
  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = rate;

  const lfoGain = ctx.createGain();
  lfoGain.gain.value = depth;

  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);
  lfo.start();

  return lfo; // 返回 LFO 以便后续 stop
}
```

### Pitch Slide（滑音）—— 从一个音滑到另一个音

这是 Bass 和 Lead 中最经典的效果——`autoBend`：

```typescript
function pitchSlide(
  osc: OscillatorNode,
  startFreq: number,
  endFreq: number,
  duration: number,
  ctx: AudioContext,
  startTime: number
): void {
  osc.frequency.setValueAtTime(startFreq, startTime);
  // 线性滑音
  osc.frequency.linearRampToValueAtTime(endFreq, startTime + duration);
}
```

## 🎛️ 完整引擎架构

把以上所有内容组装起来，我们的音序器引擎架构如下：

```
┌─────────────────────────────────────────┐
│           ChipSequencerEngine           │
│                                         │
│  ┌─────────┐  ┌──────────┐  ┌────────┐ │
│  │ Pattern  │  │ Scheduler│  │  Mixer  │ │
│  │  Store   │──▶│ (Lookahead)──▶│(MasterGain)│
│  └─────────┘  └──────────┘  └────────┘ │
│                     │                    │
│         ┌───────────┼───────────┐       │
│         ▼           ▼           ▼       │
│  ┌──────────┐ ┌──────────┐ ┌────────┐  │
│  │  Pulse   │ │ Triangle │ │ Noise  │  │
│  │ Channel  │ │ Channel  │ │Channel │  │
│  │ ─Duty ───│ │ ─Fixed ──│ │ ─LFSR ─│  │
│  │ ─Arp     │ │ ─Volume ─│ │ ─Mode ─│  │
│  │ ─Vibrato │ │          │ │        │  │
│  └──────────┘ └──────────┘ └────────┘  │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │         Effects Chain               ││
│  │  ┌─────────┐ ┌────────┐ ┌────────┐ ││
│  │  │Arpeggio │ │Vibrato │ │  Slide │ ││
│  │  └─────────┘ └────────┘ └────────┘ ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

## 🚀 完整实现：可运行的 MVP

以下是一个最小可运行版本，可以直接复制到浏览器控制台测试：

```typescript
// 🎮 芯片音乐音序器 MVP - 复制到浏览器控制台运行
async function playChiptuneDemo() {
  const ctx = new AudioContext();
  await ctx.resume();

  const master = ctx.createGain();
  master.gain.value = 0.3;
  master.connect(ctx.destination);

  const NOTE = {
    C4: 261.63, E4: 329.63, G4: 392.00,
    A3: 220.00, C3: 130.81, E3: 164.81,
  };

  const melody = [
    NOTE.C4, NOTE.E4, NOTE.G4, NOTE.E4,
    NOTE.C4, NOTE.G4, NOTE.E4, NOTE.C4,
    NOTE.A3, NOTE.C4, NOTE.E4, NOTE.C4,
    NOTE.A3, NOTE.E3, NOTE.C3, NOTE.A3,
  ];

  const bass = [
    NOTE.C3, 0, NOTE.C3, 0,
    NOTE.C3, 0, NOTE.C3, 0,
    NOTE.A3, 0, NOTE.A3, 0,
    NOTE.A3, 0, NOTE.A3, 0,
  ];

  const bpm = 140;
  const stepTime = (60 / bpm) / 4; // 16th note duration
  let step = 0;

  function tick() {
    const time = ctx.currentTime;

    // 方波旋律
    if (melody[step] > 0) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = melody[step];
      gain.gain.setValueAtTime(0.4, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + stepTime * 0.9);
      osc.connect(gain).connect(master);
      osc.start(time);
      osc.stop(time + stepTime);
    }

    // 三角波贝斯
    if (bass[step] > 0) {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = bass[step];
      osc.connect(master);
      osc.start(time);
      osc.stop(time + stepTime);
    }

    step = (step + 1) % 16;
    setTimeout(tick, stepTime * 1000);
  }

  tick();
}

playChiptuneDemo();
```

## 📊 性能优化要点

在实际项目中，需要注意以下性能问题：

| 优化项 | 问题 | 解决方案 |
|--------|------|----------|
| 振荡器回收 | 每次创建新 `OscillatorNode` 产生 GC 压力 | 对象池 + `stop/start` 复用 |
| 噪声缓冲 | 重复创建 `AudioBuffer` | 预生成并缓存 |
| UI 更新 | 高频 `requestAnimationFrame` 阻塞 | 用 `MessagePort` 将调度移到 Worker |
| 音频中断 | 移动端 `AudioContext` 自动暂停 | 监听 `visibilitychange` 事件 |
| 延迟 | `setTimeout` 精度不足 | Lookahead 调度 + `currentTime` 绝对时间 |

## 🎯 下一步

这只是冰山一角。一个完整的芯片音乐 DAW 还需要：

1. **Pattern Chain**：将多个 Pattern 串联成完整歌曲
2. **AudioWorklet**：用真正的 `AudioWorkletProcessor` 实现自定义波形生成
3. **MIDI 输入**：支持外部 MIDI 键盘实时演奏
4. **导出 WAV**：用 `OfflineAudioContext` 离线渲染并导出
5. **可视化**：频谱分析 + 波形显示

> 🎮 芯片音乐教会我们：**限制不是束缚，而是创造力的催化剂**。当你的工具只有3个波形和4个声道时，每一个选择都变得至关重要——这正是芯片音乐永恒魅力的来源。

---

*Happy Chiptuning! 🎵👾*
