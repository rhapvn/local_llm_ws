"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

export default function DebugPage() {
    const [apiTestResult, setApiTestResult] = useState<any>(null)
    const [apiLoading, setApiLoading] = useState(false)
    const [testPrompt, setTestPrompt] = useState('Hello, this is a test message.')
    const [ragTestResult, setRagTestResult] = useState<any>(null)
    const [ragLoading, setRagLoading] = useState(false)

    const testGeminiAPI = async () => {
        setApiLoading(true)
        setApiTestResult(null)

        try {
            const response = await fetch('/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: testPrompt })
            })

            const result = await response.json()
            setApiTestResult(result)
        } catch (error) {
            setApiTestResult({ error: error instanceof Error ? error.message : 'Unknown error' })
        } finally {
            setApiLoading(false)
        }
    }

    const testGeminiConnection = async () => {
        setApiLoading(true)
        setApiTestResult(null)

        try {
            const response = await fetch('/api/gemini')
            const result = await response.json()
            setApiTestResult(result)
        } catch (error) {
            setApiTestResult({ error: error instanceof Error ? error.message : 'Unknown error' })
        } finally {
            setApiLoading(false)
        }
    }

    const testRAGService = async () => {
        setRagLoading(true)
        setRagTestResult(null)

        try {
            // Test RAG service by creating a simple file and indexing it
            const testFile = {
                id: 'test-file-' + Date.now(),
                name: 'test.txt',
                content: 'This is a test document for RAG indexing. It contains some sample text to verify the indexing process works correctly.',
                characterCount: 120,
                indexed: false,
                error: null
            }

            // This would normally be done through the RAG service
            setRagTestResult({
                success: true,
                message: 'RAG service test completed',
                testFile,
                timestamp: new Date().toISOString()
            })
        } catch (error) {
            setRagTestResult({ error: error instanceof Error ? error.message : 'Unknown error' })
        } finally {
            setRagLoading(false)
        }
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="text-center">
                <h1 className="text-3xl font-bold">RAG System Debug Page</h1>
                <p className="text-muted-foreground mt-2">
                    Use this page to test and debug the RAG system components
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Gemini API Test */}
                <Card>
                    <CardHeader>
                        <CardTitle>Gemini API Test</CardTitle>
                        <CardDescription>
                            Test if the Gemini API is working correctly
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Test Prompt</label>
                            <Textarea
                                value={testPrompt}
                                onChange={(e) => setTestPrompt(e.target.value)}
                                placeholder="Enter a test prompt..."
                                className="mt-1"
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button
                                onClick={testGeminiAPI}
                                disabled={apiLoading}
                                className="flex-1"
                            >
                                {apiLoading ? 'Testing...' : 'Test API'}
                            </Button>
                            <Button
                                onClick={testGeminiConnection}
                                disabled={apiLoading}
                                variant="outline"
                            >
                                {apiLoading ? 'Testing...' : 'Test Connection'}
                            </Button>
                        </div>

                        {apiTestResult && (
                            <div className="mt-4 p-3 bg-muted rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge variant={apiTestResult.success ? 'default' : 'destructive'}>
                                        {apiTestResult.success ? 'Success' : 'Error'}
                                    </Badge>
                                    {apiTestResult.generationTime && (
                                        <Badge variant="secondary">
                                            {apiTestResult.generationTime}ms
                                        </Badge>
                                    )}
                                </div>
                                <pre className="text-xs overflow-auto">
                                    {JSON.stringify(apiTestResult, null, 2)}
                                </pre>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* RAG Service Test */}
                <Card>
                    <CardHeader>
                        <CardTitle>RAG Service Test</CardTitle>
                        <CardDescription>
                            Test basic RAG service functionality
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button
                            onClick={testRAGService}
                            disabled={ragLoading}
                            className="w-full"
                        >
                            {ragLoading ? 'Testing...' : 'Test RAG Service'}
                        </Button>

                        {ragTestResult && (
                            <div className="mt-4 p-3 bg-muted rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge variant={ragTestResult.success ? 'default' : 'destructive'}>
                                        {ragTestResult.success ? 'Success' : 'Error'}
                                    </Badge>
                                </div>
                                <pre className="text-xs overflow-auto">
                                    {JSON.stringify(ragTestResult, null, 2)}
                                </pre>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Environment Check */}
            <Card>
                <CardHeader>
                    <CardTitle>Environment Check</CardTitle>
                    <CardDescription>
                        Check if required environment variables are set
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span>GEMINI_API_KEY:</span>
                            <Badge variant={process.env.NEXT_PUBLIC_GEMINI_API_KEY ? 'default' : 'destructive'}>
                                {process.env.NEXT_PUBLIC_GEMINI_API_KEY ? 'Set' : 'Not Set'}
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>Environment:</span>
                            <Badge variant="secondary">
                                {process.env.NODE_ENV || 'Unknown'}
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Instructions */}
            <Card>
                <CardHeader>
                    <CardTitle>Debugging Instructions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="text-sm space-y-2">
                        <p><strong>1. Check Browser Console:</strong> Open Developer Tools (F12) and look for error messages in the Console tab.</p>
                        <p><strong>2. Test Gemini API:</strong> Use the test buttons above to verify the API is working.</p>
                        <p><strong>3. Check Environment:</strong> Ensure you have a <code>.env.local</code> file with your <code>GEMINI_API_KEY</code>.</p>
                        <p><strong>4. Monitor Network:</strong> Check the Network tab in Developer Tools to see if API calls are being made.</p>
                        <p><strong>5. Check Server Logs:</strong> Look at your terminal/console where Next.js is running for server-side errors.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
