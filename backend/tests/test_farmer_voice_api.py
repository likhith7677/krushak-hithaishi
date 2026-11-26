"""Voice endpoints do not require real provider credentials in tests."""
from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.voice_ai import router

def test_optional_cloud_disabled(monkeypatch):
    monkeypatch.delenv('AZURE_SPEECH_KEY',raising=False)
    monkeypatch.delenv('OPENAI_API_KEY',raising=False)
    app=FastAPI();app.include_router(router)
    client=TestClient(app)
    r=client.get('/api/voice/config')
    assert r.status_code==200
    assert r.json()['neural_speech_enabled'] is False
    assert r.json()['open_questions_enabled'] is False
    assert client.post('/api/voice/synthesize',json={'lang':'te','text':'నమస్కారం'}).status_code==503
    assert client.post('/api/assistant/ask',json={'lang':'kn','question':'ನನ್ನ ಬೆಳೆ ಹೇಗಿದೆ?'}).status_code==503

def test_input_validation(monkeypatch):
    monkeypatch.delenv('AZURE_SPEECH_KEY',raising=False)
    app=FastAPI();app.include_router(router)
    client=TestClient(app)
    assert client.post('/api/voice/synthesize',json={'lang':'xx','text':'hello'}).status_code==422
    assert client.post('/api/voice/synthesize',json={'lang':'te','text':''}).status_code==422
    assert client.post('/api/assistant/ask',json={'lang':'kn','question':'x'*500}).status_code==422
