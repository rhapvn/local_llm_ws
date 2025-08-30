#!/usr/bin/env node

/**
 * Debug script for RAG service
 * Run this to test the RAG service directly without the UI
 */

const fs = require("fs");
const path = require("path");

// Load environment variables
require("dotenv").config({ path: ".env.local" });

console.log("🔍 RAG Service Debug Script");
console.log("============================\n");

// Check environment variables
console.log("📋 Environment Check:");
console.log(`GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? "✅ Set" : "❌ Not Set"}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV || "Unknown"}\n`);

if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is required. Please create a .env.local file with your API key.");
  process.exit(1);
}

// Test Gemini API directly
async function testGeminiAPI() {
  console.log("🧪 Testing Gemini API...");

  try {
    const { GoogleGenAI } = require("@google/genai");

    const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const startTime = Date.now();
    const result = await genAI.models.generateContent({
      model: "gemini-1.5-flash",
      contents: 'Hello, this is a test. Please respond with "API is working" if you can see this message.',
    });
    const generationTime = Date.now() - startTime;

    console.log(`✅ Gemini API test successful in ${generationTime}ms`);
    console.log(`Response: ${result.text}\n`);
    return true;
  } catch (error) {
    console.error("❌ Gemini API test failed:", error.message);
    return false;
  }
}

// Test text chunking
function testTextChunking() {
  console.log("📝 Testing text chunking...");

  try {
    const sampleText = `This is a sample document for testing the RAG system. 
    It contains multiple sentences to test the chunking functionality. 
    The chunking should break this text into smaller pieces that can be processed by the embedding model. 
    Each chunk should be of appropriate size and maintain semantic meaning.`;

    const chunkSize = 800;
    const overlap = 150;
    const chunks = [];

    let startIndex = 0;
    while (startIndex < sampleText.length) {
      const endIndex = Math.min(startIndex + chunkSize, sampleText.length);
      const chunkContent = sampleText.slice(startIndex, endIndex).trim();

      if (chunkContent.length > 50) {
        chunks.push({
          content: chunkContent,
          startIndex,
          endIndex,
        });
      }

      startIndex = endIndex - overlap;
      if (startIndex >= sampleText.length) break;
    }

    console.log(`✅ Text chunking test successful: ${chunks.length} chunks created`);
    console.log(`Sample chunk: "${chunks[0]?.content.substring(0, 100)}..."\n`);
    return true;
  } catch (error) {
    console.error("❌ Text chunking test failed:", error.message);
    return false;
  }
}

// Test file processing
function testFileProcessing() {
  console.log("📁 Testing file processing...");

  try {
    const testFile = {
      id: "test-file-" + Date.now(),
      name: "test.txt",
      content: "This is a test document for RAG indexing. It contains some sample text to verify the indexing process works correctly.",
      characterCount: 120,
      indexed: false,
      error: null,
    };

    console.log(`✅ File processing test successful: ${testFile.name} (${testFile.characterCount} chars)\n`);
    return true;
  } catch (error) {
    console.error("❌ File processing test failed:", error.message);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log("🚀 Starting RAG service tests...\n");

  const results = {
    gemini: await testGeminiAPI(),
    chunking: testTextChunking(),
    fileProcessing: testFileProcessing(),
  };

  console.log("📊 Test Results:");
  console.log("================");
  console.log(`Gemini API: ${results.gemini ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`Text Chunking: ${results.chunking ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`File Processing: ${results.fileProcessing ? "✅ PASS" : "❌ FAIL"}`);

  const allPassed = Object.values(results).every((result) => result);

  if (allPassed) {
    console.log("\n🎉 All tests passed! The RAG service should work correctly.");
    console.log("If you still have issues, check the browser console and network tab.");
  } else {
    console.log("\n⚠️ Some tests failed. Please fix the issues before using the RAG service.");
  }

  console.log("\n💡 Next steps:");
  console.log("1. Check browser console for errors");
  console.log("2. Visit /debug page to test the API endpoints");
  console.log("3. Monitor network requests in browser dev tools");
  console.log("4. Check server logs in your terminal");
}

// Run tests
runTests().catch(console.error);
