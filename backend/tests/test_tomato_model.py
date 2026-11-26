"""Safety tests for optional EfficientNet tomato model (labels are intentionally absent)."""
import io
import os
import tempfile
from pathlib import Path

from fastapi.testclient import TestClient
from PIL import Image

# Load the existing app's configured test database environment.
os.environ.setdefault('DATABASE_URL', 'sqlite:///'+str(Path(tempfile.gettempdir())/'krushak-tomato-model-tests.db'))
os.environ.setdefault('SECRET_KEY', 'test-secret-please-change-this-at-least-32-bytes-long')
from app.main import app
from app.tomato_inference import TomatoModelService


def test_missing_labels_never_generate_a_disease(tmp_path):
    fake_model = tmp_path / 'tomato_model.keras'
    fake_model.write_bytes(b'test-placeholder')
    service = TomatoModelService(fake_model, tmp_path / 'missing.json')
    result = service.predict(Image.new('RGB', (224,224), 'green'))
    assert result['status'] == 'model_unavailable'
    assert result['prediction'] is None
    assert result['confidence'] is None
    assert service.status()['status'] == 'pending_class_labels'


def test_explicit_tomato_model_without_labels_is_unavailable():
    image = Image.new('RGB', (224,224), 'green')
    for x in range(20,160):
        for y in range(20,160):
            image.putpixel((x,y),(180,65,34))
    stream = io.BytesIO(); image.save(stream,'PNG'); stream.seek(0)
    with TestClient(app) as client:
        r = client.post('/api/detect?crop=tomato&model=tomato_specialist',
                        files={'file':('tomato.png', stream, 'image/png')},
                        headers={'X-KH-Request':'web'})
        assert r.status_code == 200
        out = r.json()
        assert out['status'] == 'model_unavailable'
        assert out['prediction'] is None
        assert out['model_version'] is None


def test_cannot_use_tomato_model_for_other_crop():
    with TestClient(app) as client:
        r = client.post('/api/detect?crop=potato&model=tomato_specialist',
                        headers={'X-KH-Request':'web'})
        assert r.status_code == 422
