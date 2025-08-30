# powershell 
Get-Process | findstr ollama

# APIとしてテスト
curl http://localhost:11434/api/tags

# ollamaにモデルがダウンロードされているかどうか
ollama list
