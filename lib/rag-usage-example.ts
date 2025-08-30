/**
 * RAG API Usage Examples
 *
 * This file shows how to use the RAG API endpoints.
 * All API calls should be made from the client side to /api/rag
 */

// Example: How to add files to RAG
export const addFilesExample = async (files: Array<{ name: string; content: string }>) => {
  const response = await fetch("/api/rag", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "addFiles",
      data: { files },
    }),
  });

  return response.json();
};

// Example: How to index files
export const indexFilesExample = async () => {
  const response = await fetch("/api/rag", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "indexFiles",
    }),
  });

  return response.json();
};

// Example: How to ask a RAG question
export const askRAGQuestionExample = async (question: string) => {
  const response = await fetch("/api/rag", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "ragAnswer",
      data: { query: question },
    }),
  });

  return response.json();
};

// Example: How to search for content
export const searchContentExample = async (query: string, topK: number = 5) => {
  const response = await fetch("/api/rag", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "search",
      data: { query, topK },
    }),
  });

  return response.json();
};

// Example: How to get RAG status
export const getRAGStatusExample = async () => {
  const response = await fetch("/api/rag");
  return response.json();
};

// Example: Complete workflow
export const completeRAGWorkflowExample = async () => {
  // 1. Add sample files
  const sampleFiles = [
    {
      name: "sample.txt",
      content: "This is a sample document about artificial intelligence and machine learning.",
    },
  ];

  await addFilesExample(sampleFiles);

  // 2. Index the files
  await indexFilesExample();

  // 3. Ask a question
  const result = await askRAGQuestionExample("What is artificial intelligence?");

  return result;
};
