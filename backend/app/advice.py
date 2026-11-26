"""Source-linked general information for the 15 training labels.

This is *not* a verified plant diagnosis, recommendation engine, or approved
pesticide/treatment map. Only disease labels from the uploaded classifier are
accepted. The editorial text needs Indian agronomist review before field use.
"""
from pathlib import Path
import json
from fastapi import HTTPException
from .label_metadata import family_for_label

LABELS = set(json.loads((Path(__file__).resolve().parent.parent / 'model_artifacts' / 'class_names.json').read_text(encoding='utf-8')))

EARLY = 'https://extension.umn.edu/agriculture/specialty-crops/vegetable-farming/disease-management/early-blight-in-tomato-and-potato'
BACTERIAL = 'https://extension.umn.edu/agriculture/specialty-crops/vegetable-farming/disease-management/bacterial-spot-of-tomato-and-pepper'
VIRUSES = 'https://extension.umn.edu/agriculture/specialty-crops/vegetable-farming/disease-management/tomato-viruses'
LEAF_MOLD = 'https://extension.umn.edu/agriculture/specialty-crops/vegetable-farming/disease-management/tomato-leaf-mold'
SPIDER = 'https://extension.umn.edu/garden-and-home/yard-and-garden/yard-and-garden-insects/spider-mites'
LEAF_SPOT = 'https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/yard-and-garden-problems/tomato-leaf-spot-diseases'
LATE = 'https://apps.extension.umn.edu/garden/diagnose/plant/vegetable/tomato/stemsspots.html'

COMMON = [
    'Take clear photos of both sides of the leaf and nearby plants; watch whether symptoms spread.',
    'Avoid choosing a pesticide or chemical dose from an AI prediction. Check the registered product label and consult a local agriculture officer.',
]

# Symptoms should be phrased as checks, not asserted characteristics of the photographed leaf.
BY_DISEASE = {
    'Bacterial_spot': (
        'Bacterial spot may cause small dark lesions on leaves, sometimes with yellowing; other disorders can look similar.',
        ['Check for small round dark leaf spots and spots on fruit.', 'Use clean planting material and avoid unnecessarily handling wet foliage.'], BACTERIAL),
    'Early_blight': (
        'Early blight can cause dark leaf spots with target-like rings, often on older leaves.',
        ['Look for ring-shaped lesions with yellowing around them.', 'Keep leaves drier by watering near the base; maintain airflow and clean tools.'], EARLY),
    'Late_blight': (
        'Late blight can spread rapidly in wet conditions; water-soaked dark lesions can appear.',
        ['Check for rapidly spreading dark, water-soaked lesions and affected stems.', 'Seek advice from a local plant-health expert promptly; avoid moving possibly infected plant material between fields.'], LATE),
    'Leaf_Mold': (
        'Tomato leaf mold often occurs in humid, sheltered growing conditions.',
        ['Look for pale yellow patches on upper leaf surfaces and olive-colored growth underneath.', 'Improve ventilation and reduce leaf wetness where possible.'], LEAF_MOLD),
    'Septoria_leaf_spot': (
        'Septoria leaf spot can cause many small spots with dark edges and pale centers.',
        ['Inspect older leaves for numerous small circular spots.', 'Avoid splash irrigation and improve spacing and airflow.'], LEAF_SPOT),
    'Spider_mites_Two_spotted_spider_mite': (
        'Two-spotted spider mites can cause tiny pale speckles and fine webbing, particularly in hot, dry weather.',
        ['Check leaf undersides with a magnifying lens for mites and fine webbing.', 'Reduce plant water stress and seek advice on pest management that protects beneficial insects.'], SPIDER),
    'Target_Spot': (
        'Target spot can resemble other leaf-spot diseases. Image-based identification alone is uncertain.',
        ['Look for circular brown lesions and compare multiple affected leaves.', 'Improve airflow and avoid prolonged leaf wetness while seeking a local diagnosis.'], LEAF_SPOT),
    'Tomato_YellowLeaf__Curl_Virus': (
        'Yellow leaf curl symptoms may include curling, yellowing and stunted growth; several other causes can mimic them.',
        ['Look for upward curling and yellowing of newer leaves.', 'Ask an agriculture officer to inspect the plant and possible insect vectors; virus infections are not cured by fungicides.'], VIRUSES),
    'Tomato_mosaic_virus': (
        'Tomato mosaic virus may cause light-and-dark green mottling or distorted leaves.',
        ['Check for mosaic-like discoloration across multiple leaves.', 'Avoid moving sap between plants; wash hands and tools. There is no chemical cure for a plant virus.'], VIRUSES),
}

def get_guidance(label: str):
    if not label:
        return {'review_status':'general_educational_not_locally_reviewed', 'label':None,
                'summary':'Use clear leaf photographs and consult an agricultural expert to verify disease symptoms.', 'disease_group':None,
                'checks':COMMON, 'sources':[],
                'disclaimer':'For education only. No disease diagnosis or pesticide prescription.'}
    if label not in LABELS:
        raise HTTPException(404,'No guidance for this model label')
    if label.lower().endswith('healthy'):
        summary='The model suggested a healthy category, but one image cannot rule out disease, pests or nutrient stress.'
        checks=['Continue monitoring leaves and growth; photograph new changes.', 'Use suitable watering and crop care; consult a local agriculture officer if symptoms appear.']
        sources=[]
    else:
        key=next((k for k in BY_DISEASE if label.endswith(k)),None)
        if key:
            summary,checks,ref=BY_DISEASE[key]
            sources=[{'title':'University of Minnesota Extension – informational reference','url':ref}]
        else:
            summary='This predicted class can resemble several other leaf diseases. A photograph alone cannot confirm the cause.'
            checks=['Check multiple leaves and the whole plant for patterns.', 'Talk to a local agriculture officer before treatment.']
            sources=[]
    return {'review_status':'source_linked_general_information_not_indian_expert_reviewed',
            'label':label,'disease_group':family_for_label(label),'summary':summary,'checks':checks+COMMON,'sources':sources,
            'disclaimer':'Educational guidance, not field-validated identification or a prescription. Agriculture practices and approved inputs vary by location.'}
