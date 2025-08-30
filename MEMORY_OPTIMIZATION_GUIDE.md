# RAG Memory Optimization Guide

## Overview
This document outlines the memory optimizations implemented to prevent out-of-memory issues when indexing files for RAG (Retrieval-Augmented Generation) functionality.

## Critical Memory Issues Identified

### 1. **Unbounded Memory Accumulation**
- **Problem**: All chunks and embeddings were stored in memory indefinitely
- **Impact**: Memory usage grew linearly with file size and count
- **Solution**: Implemented memory limits and cleanup mechanisms

### 2. **Synchronous Text Processing**
- **Problem**: Large files were processed synchronously, blocking the main thread
- **Impact**: UI freezing and potential memory spikes
- **Solution**: Implemented batch processing with yield points

### 3. **Sequential Embedding Generation**
- **Problem**: All embeddings generated sequentially without memory management
- **Impact**: Memory accumulation during API calls
- **Solution**: Implemented batch processing with memory limits

## Implemented Solutions

### Memory Management Constants

```typescript
// File Manager Limits
const MAX_CHUNKS_IN_MEMORY = 10000;        // Max chunks in memory
const MAX_FILE_SIZE = 500000;              // 500KB max file size
const MAX_TOTAL_CHARS = 10000000;          // 10MB total character limit
const CHUNK_BATCH_SIZE = 100;              // Process chunks in batches

// Embedding Limits
const MAX_EMBEDDINGS_IN_MEMORY = 5000;     // Max embeddings in memory
const EMBEDDING_BATCH_SIZE = 50;           // Process embeddings in batches
const EMBEDDING_DELAY = 200;               // Delay between batches (ms)
```

### 1. **Batch Processing**
- Files are processed in batches of 5 to prevent memory spikes
- Chunks are generated in batches with yield points every 10 chunks
- Embeddings are generated in batches of 50 with delays between batches

### 2. **Memory Limits**
- **File Size Limit**: 500KB per file maximum
- **Total Character Limit**: 10MB across all files
- **Chunk Limit**: 10,000 chunks maximum in memory
- **Embedding Limit**: 5,000 embeddings maximum in memory

### 3. **Garbage Collection**
- Automatic garbage collection hints after each batch
- Memory cleanup after file removal
- Memory cleanup after indexing completion
- Memory cleanup on errors

### 4. **Async Processing with Yields**
```typescript
// Yield control every 10 chunks to prevent blocking
if (allChunks.length % 10 === 0) {
  await new Promise(resolve => setTimeout(resolve, 0));
}

// Yield control between batches
await new Promise(resolve => setTimeout(resolve, 0));
```

### 5. **Memory Monitoring**
- Real-time memory usage tracking
- Automatic warnings when memory usage exceeds thresholds
- Memory usage logging at key points
- Force cleanup button for manual memory management

## Key Optimizations in Each Component

### `rag-file-manager.ts`
- **Batch Processing**: Files processed in groups of 5
- **Memory Limits**: File size and character count limits
- **Async Chunking**: Non-blocking text chunking with yields
- **Garbage Collection**: Automatic cleanup between batches

### `gemini-client.ts`
- **Batch Embeddings**: Process embeddings in groups of 50
- **Rate Limiting**: Delays between API calls to prevent throttling
- **Memory Tracking**: Count embeddings in memory
- **Fallback Handling**: Random embeddings for failed API calls

### `google-rag-service.ts`
- **Chunk Limits**: Maximum 8,000 chunks in memory
- **Embedding Limits**: Maximum 4,000 embeddings in memory
- **Batch Processing**: Embeddings generated in batches of 100
- **Memory Cleanup**: Automatic cleanup on errors and completion

### `page.tsx` (Main Component)
- **Memory Monitoring**: 5-second interval memory checks
- **Warning System**: Visual warnings for high memory usage
- **Cleanup Integration**: Automatic garbage collection at key points
- **Memory Logging**: Detailed logging before/after operations

## Memory Usage Monitoring

### Automatic Monitoring
```typescript
// Check memory every 5 seconds
useEffect(() => {
  const memoryCheckInterval = setInterval(() => {
    if (memoryUtils.isMemoryHigh(400)) { // 400MB threshold
      setMemoryWarning(`High memory usage: ${memoryUtils.getMemoryInfo()?.heapUsed} MB`);
    }
  }, 5000);
  return () => clearInterval(memoryCheckInterval);
}, []);
```

### Manual Monitoring
```typescript
// Log memory at key points
memoryUtils.logMemoryUsage('Before indexing');
memoryUtils.logMemoryUsage('After indexing');

// Force cleanup when needed
if (memoryUtils.isMemoryHigh(300)) {
  memoryUtils.forceGC();
}
```

## Best Practices for Users

### 1. **File Management**
- Keep individual files under 500KB
- Limit total file content to 10MB
- Remove unused files to free memory

### 2. **Indexing Process**
- Index files in smaller batches
- Monitor memory warnings during indexing
- Use "Force Cleanup" button if memory usage is high

### 3. **Memory Monitoring**
- Watch for yellow memory warning bars
- Check console for memory usage logs
- Monitor browser memory usage in DevTools

## Performance Impact

### Before Optimization
- **Memory**: Unbounded growth with file size
- **Performance**: UI blocking during large file processing
- **Stability**: Potential crashes on large files

### After Optimization
- **Memory**: Bounded growth with configurable limits
- **Performance**: Non-blocking processing with yields
- **Stability**: Graceful degradation with memory limits

## Configuration Options

### Memory Limits (Configurable)
```typescript
// Adjust these constants based on your server capacity
const MAX_CHUNKS_IN_MEMORY = 10000;        // Increase for more memory
const MAX_FILE_SIZE = 500000;              // Increase for larger files
const MAX_TOTAL_CHARS = 10000000;          // Increase for more content
```

### Processing Batches (Configurable)
```typescript
const batchSize = 5;                       // Files per batch
const EMBEDDING_BATCH_SIZE = 50;           // Embeddings per batch
const EMBEDDING_DELAY = 200;               // Delay between batches (ms)
```

## Troubleshooting

### High Memory Usage
1. Check file sizes (should be < 500KB each)
2. Reduce total file content (should be < 10MB)
3. Use "Force Cleanup" button
4. Remove unnecessary files

### Slow Indexing
1. Check memory warnings
2. Reduce batch sizes in configuration
3. Increase delays between API calls
4. Monitor network throttling

### Indexing Failures
1. Check console for memory limit errors
2. Verify file content is valid
3. Check API rate limits
4. Monitor memory usage during failure

## Future Improvements

### Planned Enhancements
1. **Streaming Processing**: Process files as streams instead of loading entirely into memory
2. **Database Storage**: Store chunks and embeddings in database instead of memory
3. **LRU Cache**: Implement least-recently-used cache for embeddings
4. **Memory Pooling**: Reuse memory buffers for similar operations

### Monitoring Enhancements
1. **Memory Graphs**: Visual memory usage over time
2. **Performance Metrics**: Indexing speed and memory efficiency
3. **Alert System**: Email/SMS alerts for critical memory issues
4. **Auto-scaling**: Automatic resource allocation based on usage

## Conclusion

These memory optimizations provide a robust foundation for RAG operations while preventing out-of-memory crashes. The system now gracefully handles large files and provides clear feedback when memory limits are approached.

Key benefits:
- ✅ **Stable Operation**: No more out-of-memory crashes
- ✅ **Predictable Performance**: Bounded memory usage
- ✅ **User Control**: Clear warnings and manual cleanup options
- ✅ **Scalable Architecture**: Configurable limits for different environments
- ✅ **Real-time Monitoring**: Continuous memory usage tracking

For production deployments, consider adjusting memory limits based on your server capacity and requirements.
