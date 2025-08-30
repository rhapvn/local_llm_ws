import requests

def chat_ollama(prompt, model="phi3"):
    response = requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": model,
            "prompt": prompt,
            "stream": False
        }
    )
    response.raise_for_status()
    res_json = response.json()
    return res_json.get("response", "").strip()

if __name__ == "__main__":
    prompt = input("ユーザー: ")
    answer = chat_ollama(prompt)
    print("AI:", answer)
