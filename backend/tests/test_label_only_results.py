"""Verification of new class-label-only result handling without loading model weights."""
import io
import json
from pathlib import Path
from fastapi.testclient import TestClient
from PIL import Image
from app.main import app
from app.inference import MODEL_SERVICE
from app.label_metadata import LABEL_FAMILIES, annotate_result, family_for_label


def test_metadata_exactly_covers_model_labels():
    labels = json.loads((Path(__file__).parents[1] / 'model_artifacts' / 'class_names.json').read_text())
    assert len(labels) == 15
    assert set(labels) == set(LABEL_FAMILIES)
    assert family_for_label('Tomato___Anything') is None
    assert family_for_label('Tomato_Late_blight') == 'oomycete'
    assert family_for_label('Tomato_Spider_mites_Two_spotted_spider_mite') == 'mite'
    assert family_for_label('Pepper__bell___healthy') == 'healthy'
    assert family_for_label('Tomato__Tomato_mosaic_virus') == 'viral'


def test_no_invented_stage_or_chemical_recommendation():
    result = annotate_result({'status':'predicted','prediction':'Tomato_Early_blight','confidence':.85})
    assert result['class_label'] == 'Tomato_Early_blight'
    assert result['disease_group'] == 'fungal'
    assert result['growth_stage'] == result['disease_severity'] == 'not_assessed'
    assert result['fertilizer_recommendation'] == 'not_assessed'
    assert result['crop_stage_used'] is False
    for status in ('crop_mismatch','image_quality_issue','model_unavailable','inference_error'):
        r=annotate_result({'status':status,'prediction':None,'raw_label':'Tomato_Early_blight'})
        assert r['class_label'] is None and r['disease_group'] is None


def test_crop_scan_ignores_legacy_growth_stage(monkeypatch):
    def predictable_prediction(image, crop):
        return {'status':'predicted','prediction':'Tomato_Early_blight','raw_label':'Tomato_Early_blight',
            'predicted_crop':'tomato','disease_name':'Early blight','healthy':False,
            'confidence':0.87,'heatmap':None,'message':'Model suggestion only.'}
    monkeypatch.setattr(MODEL_SERVICE,'predict',predictable_prediction)
    im=Image.new('RGB',(150,150),'#8ca32e')
    for x in range(30,100):
        for y in range(20,130):
            im.putpixel((x,y),(x%180,y%200,75))
    f=io.BytesIO();im.save(f,'PNG');data=f.getvalue()
    with TestClient(app) as client:
        outcomes=[]
        for stage in ('seedling','fruiting'):
            resp=client.post(f'/api/detect?crop=tomato&stage={stage}',
                files={'file':('leaf.png',io.BytesIO(data),'image/png')},
                headers={'X-KH-Request':'web'})
            assert resp.status_code == 200, resp.text
            outcomes.append(resp.json())
        assert outcomes[0] == outcomes[1]
        assert outcomes[0]['class_label'] == 'Tomato_Early_blight'
        assert outcomes[0]['disease_group'] == 'fungal'
        assert outcomes[0]['growth_stage'] == 'not_assessed'
        assert outcomes[0]['crop_stage_used'] is False
        guidance=client.get('/api/advisory?label=Tomato_Early_blight')
        assert guidance.status_code == 200
        assert guidance.json()['disease_group'] == 'fungal'
