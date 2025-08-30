# RAG (Retrieval-Augmented Generation) Chat Application

This is a chat application that uses RAG to provide context-aware responses based on uploaded documents.

## Features

### 1. Document Upload

- Drag and drop `.txt` and `.pdf` files into the sidebar
- Click "Select Files" to browse and select files
- Supports both text files and PDFs
- Shows file statistics (character count, file size, page count for PDFs)

### 2. Document Indexing

- Click "Index Files for RAG" to process uploaded documents
- Documents are automatically chunked into smaller pieces for better retrieval
- Chunks are created with overlap to preserve context
- Only valid files (no errors) are indexed

### 3. RAG-Enabled Chat

- Once documents are indexed, the chat automatically uses RAG
- Questions are searched against the indexed documents
- Relevant context is retrieved and sent to the AI model
- Responses are generated based on the document content
- RAG responses are marked with a "RAG" badge

### 4. Debug Panel

- Click "Debug RAG" button (bottom-right) to open debug panel
- View RAG service statistics
- See file indexing status
- Monitor chunk creation and search results

## How to Use

### Step 1: Upload Documents

1. Drag and drop text files or PDFs into the sidebar
2. Or click "Select Files" to browse and select files
3. Wait for files to be processed

### Step 2: Index Documents

1. Click "Index Files for RAG" button
2. Wait for indexing to complete
3. Check that files show "Indexed" status

### Step 3: Start Chatting

1. Ask questions about your uploaded documents
2. The system will automatically search for relevant context
3. Responses will be generated based on your documents
4. Look for the "RAG" badge to confirm RAG is being used

## Example Questions

Once you have documents uploaded and indexed, try asking:

- "What is artificial intelligence?"
- "Explain machine learning"
- "What are the key topics covered in the documents?"
- "Summarize the main points about NLP"
- "What is the RAG system?"

## Technical Details

### Chunking Strategy

- Default chunk size: 800 characters
- Overlap: 150 characters
- Sentence boundary detection for natural breaks
- Minimum chunk size: 50 characters

### Search Algorithm

- TF-IDF inspired scoring
- Exact word matches (3x score)
- Partial matches (1x score)
- Stemmed matches (1.5x score)
- Multi-word bonus scoring
- Content length bonus

### Context Retrieval

- Top 6 most relevant chunks
- Maximum context length: 2500 characters
- Source attribution for each chunk

## Troubleshooting

### Files Not Indexing

- Check browser console for errors
- Ensure files are valid (no processing errors)
- Try refreshing the page and re-uploading

### RAG Not Working

- Verify files show "Indexed" status
- Check debug panel for chunk count
- Ensure you've clicked "Index Files for RAG"

### Poor Search Results

- Try rephrasing your question
- Check that documents contain relevant information
- Use the debug panel to see what chunks are being found

## Browser Console

The application logs detailed information to the browser console:

- File processing status
- Indexing progress
- Search queries and results
- RAG context retrieval
- Error messages

Open Developer Tools (F12) to monitor the console for debugging information.

## Sample Document

A sample document (`sample-document.txt`) is included in the `public` folder for testing the RAG functionality.
