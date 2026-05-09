---
title: 'Node.js流式数据处理'
description: '高效处理大数据的流式编程模式'
date: 2026-05-10
tags: ['Node.js', '流处理']
categories: ['技术']
cover: '/assets/images/banner/pixel-blog.webp'
toc: true
comment: true
reward: false
---

# Node.js流式数据处理

在处理大数据时，传统的方式往往是将整个数据集加载到内存中，这种方式在数据量较小时可以接受，但当数据规模达到GB级别时就会面临严重的性能问题。Node.js的流式API提供了一种优雅的解决方案，让我们可以高效地处理海量数据。

## 什么是流？

流是Node.js中处理可读和可写数据的一种抽象。与一次性处理整个数据集不同，流可以逐块处理数据，这意味着内存占用始终保持在一个可控的水平。

```javascript
const fs = require('fs');

// 创建可读流
const readStream = fs.createReadStream('large-file.log', { encoding: 'utf8' });

// 创建可写流
const writeStream = fs.createWriteStream('processed.log', { encoding: 'utf8' });

// 简单的管道操作
readStream.pipe(writeStream);

readStream.on('end', () => {
  console.log('处理完成！');
});
```

## 高级流操作

### 自定义转换流

```javascript
const { Transform } = require('stream');

class LogParser extends Transform {
  constructor(options) {
    super(options);
    this.buffer = '';
  }

  _transform(chunk, encoding, callback) {
    // 累积数据块
    this.buffer += chunk.toString();
    
    // 按行分割并处理
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop(); // 保留未完成的行
    
    // 处理完整的行
    lines.forEach(line => {
      if (line.trim()) {
        const data = JSON.parse(line);
        // 转换数据格式
        const transformed = {
          timestamp: data.time,
          level: data.level.toUpperCase(),
          message: data.msg
        };
        this.push(JSON.stringify(transformed) + '\n');
      }
    });
    
    callback();
  }

  _flush(callback) {
    // 处理最后一行
    if (this.buffer.trim()) {
      this.push(this.buffer + '\n');
    }
    callback();
  }
}

// 使用转换流
const readStream = fs.createReadStream('input.log', { encoding: 'utf8' });
const parser = new LogParser();
const writeStream = fs.createWriteStream('output.json', { encoding: 'utf8' });

readStream.pipe(parser).pipe(writeStream);
```

### 双向流

```javascript
const { Duplex } = require('stream');

class RequestForwarder extends Duplex {
  constructor(sourceStream, targetUrl) {
    super();
    this.source = sourceStream;
    this.targetUrl = targetUrl;
  }

  _write(chunk, encoding, callback) {
    // 将接收到的数据发送到目标服务器
    this.push(chunk);
    callback();
  }

  _read(size) {
    // 从源流读取数据并写入目标
    const chunk = this.source.read(size);
    if (chunk !== null) {
      this.push(chunk);
    }
  }
}

// 使用双向流
const request = require('http').request('https://api.example.com/upload');
const duplex = new RequestForwarder(process.stdin, request);
duplex.pipe(process.stdout);
```

## 性能优化技巧

### 并行处理流

```javascript
const { Transform } = require('stream');
const { pipeline } = require('stream/promises');

class ParallelProcessor extends Transform {
  constructor(concurrency) {
    super({ objectMode: true });
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = [];
  }

  _transform(chunk, encoding, callback) {
    this.queue.push({ chunk, callback });
    this._process();
  }

  async _process() {
    while (this.running < this.concurrency && this.queue.length > 0) {
      const { chunk, callback } = this.queue.shift();
      this.running++;
      
      this.processChunk(chunk)
        .then(result => {
          this.push(result);
          this.running--;
          this._process();
          callback();
        })
        .catch(err => {
          this.running--;
          this._process();
          callback(err);
        });
    }
  }

  // 子类需要实现这个方法
  async processChunk(chunk) {
    return chunk;
  }
}

// 使用示例
const processor = new ParallelProcessor(5);
processor.on('data', chunk => console.log('处理结果:', chunk));
```

### 错误处理与恢复

```javascript
const { Transform } = require('stream');

class RobustProcessor extends Transform {
  constructor(options) {
    super(options);
    this.errors = 0;
    this.maxErrors = 10;
  }

  _transform(chunk, encoding, callback) {
    try {
      // 处理数据
      const result = this.process(chunk);
      this.push(result);
      callback();
    } catch (err) {
      this.errors++;
      
      if (this.errors >= this.maxErrors) {
        callback(new Error('超过最大错误次数，停止处理'));
        return;
      }
      
      // 记录错误但继续处理
      this.emit('error', err);
      callback();
    }
  }

  process(chunk) {
    // 具体处理逻辑
    return chunk;
  }
}

// 使用带错误处理的流
const processor = new RobustProcessor();
processor.on('error', err => console.error('处理错误:', err.message));
```

## 实际应用场景

### 日志处理管道

```javascript
const { pipeline } = require('stream/promises');
const fs = require('fs');

async function processLogPipeline() {
  const files = [
    'logs/app-1.log',
    'logs/app-2.log',
    'logs/app-3.log'
  ];

  const readStreams = files.map(file => fs.createReadStream(file, { encoding: 'utf8' }));
  const parser = new LogParser();
  const filter = new FilterStream();
  const stats = new StatsStream();
  const writer = fs.createWriteStream('aggregate-report.json', { encoding: 'utf8' });

  await pipeline(
    ...readStreams,
    parser,
    filter,
    stats,
    writer
  );

  console.log('日志处理完成！');
}

processLogPipeline().catch(console.error);
```

### 实时数据处理

```javascript
const { Readable } = require('stream');
const WebSocket = require('ws');

// 模拟实时数据源
class RealTimeDataStream extends Readable {
  constructor(source) {
    super({ objectMode: true });
    this.source = source;
  }

  _read(size) {
    const data = this.source.next();
    if (data) {
      this.push(data);
    } else {
      this.push(null);
    }
  }
}

// 处理实时数据
async function processRealTimeData() {
  const dataGenerator = {
    next() {
      return { timestamp: Date.now(), value: Math.random() * 100 };
    }
  };

  const stream = new RealTimeDataStream(dataGenerator);
  const processor = new RealTimeProcessor();
  const ws = new WebSocket('wss://api.example.com/stream');

  stream.pipe(processor);

  processor.on('data', async (data) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  });
}

processRealTimeData();
```

## 最佳实践

1. **使用pipeline代替pipe**：`pipeline`会自动处理错误和清理资源
2. **设置合理的缓冲区大小**：避免内存溢出
3. **考虑背压处理**：当写入速度慢于读取速度时，流会自动暂停
4. **监控流状态**：及时处理错误和异常情况
5. **合理使用对象模式**：处理JSON数据时使用`objectMode: true`

流式处理是Node.js处理大数据的核心技术，掌握它能让你的应用更加高效、可靠。通过合理使用流，你可以轻松处理从几MB到几GB的数据，而不会耗尽内存资源。

## 总结

Node.js的流式API提供了一套强大而灵活的机制来处理数据流。通过理解不同类型的流、掌握高级操作技巧，以及遵循最佳实践，开发者可以构建出高性能的数据处理管道。无论是日志处理、实时数据流还是批量文件转换，流式处理都能提供优雅的解决方案。
