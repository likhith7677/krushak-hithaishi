"""Read-only, class-label-based metadata for the 15 trained image classes.

Never derive growth stage, disease severity, nutrient deficiency, or a chemical
recommendation from a disease label. A family is reference taxonomy, not a
separate model prediction or laboratory diagnosis.
"""

LABEL_FAMILIES = {'Pepper__bell___Bacterial_spot': 'bacterial', 'Pepper__bell___healthy': 'healthy', 'Potato___Early_blight': 'fungal', 'Potato___Late_blight': 'oomycete', 'Potato___healthy': 'healthy', 'Tomato_Bacterial_spot': 'bacterial', 'Tomato_Early_blight': 'fungal', 'Tomato_Late_blight': 'oomycete', 'Tomato_Leaf_Mold': 'fungal', 'Tomato_Septoria_leaf_spot': 'fungal', 'Tomato_Spider_mites_Two_spotted_spider_mite': 'mite', 'Tomato__Target_Spot': 'fungal', 'Tomato__Tomato_YellowLeaf__Curl_Virus': 'viral', 'Tomato__Tomato_mosaic_virus': 'viral', 'Tomato_healthy': 'healthy'}


def family_for_label(label: str | None) -> str | None:
    return LABEL_FAMILIES.get(label) if label else None


def annotate_result(result: dict) -> dict:
    """Use an existing model prediction only; never invent a second label."""
    label = result.get('prediction') if result.get('status') in ('predicted', 'low_confidence') else None
    result['class_label'] = label
    result['disease_group'] = family_for_label(label)
    result['analysis_basis'] = 'leaf_image_class_label_only'
    result['growth_stage'] = 'not_assessed'
    result['disease_severity'] = 'not_assessed'
    result['fertilizer_recommendation'] = 'not_assessed'
    result['crop_stage_used'] = False
    return result
