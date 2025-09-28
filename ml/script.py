
from huggingface_hub import login
login(token="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")

import cv2
from PIL import Image
from transformers import AutoProcessor, VisionEncoderDecoderModel
import re
import pkg_resources
from symspellpy import SymSpell, Verbosity
import numpy as np
from paddleocr import PaddleOCR

# --- 1. INITIALIZE LIBRARIES (Run Once) ---
try:
    ocr = PaddleOCR(use_angle_cls=True, lang='en')
    print("PaddleOCR for text detection initialized.")

    model_name = "sastry3457/TrOCR_FineTuned"
    model = VisionEncoderDecoderModel.from_pretrained(model_name)
    processor = AutoProcessor.from_pretrained(model_name)
    print("TrOCR model and processor loaded.")

    sym_spell = SymSpell(max_dictionary_edit_distance=2, prefix_length=7)
    dictionary_path = pkg_resources.resource_filename("symspellpy", "frequency_dictionary_en_82_765.txt")
    sym_spell.load_dictionary(dictionary_path, term_index=0, count_index=1)
    print("SymSpell setup complete.")
except Exception as e:
    print(f"An error occurred during model setup: {e}")
    exit()

# --- 2. PIPELINE FUNCTION DEFINITIONS ---

def recognize_line(line_image_cv2):
    """Recognizes text in a single cropped image line using the TrOCR model."""
    if line_image_cv2 is None or line_image_cv2.size == 0:
        return ""
    try:
        pil_image = Image.fromarray(line_image_cv2).convert("RGB")
        pixel_values = processor(pil_image, return_tensors="pt").pixel_values
        generated_ids = model.generate(pixel_values)
        return processor.batch_decode(generated_ids, skip_special_tokens=True)[0]
    except Exception as e:
        print(f"Error during TrOCR recognition: {e}")
        return ""

def detect_lines(img_path):
    """
    Detects, crops, and sorts text lines from an image, correctly handling
    different output formats from PaddleOCR.
    """
    # Use the recommended 'predict' method for consistency
    results = ocr.predict(img_path)

    if not results or not results[0]:
        print(f"Warning: No text detected in {img_path}")
        return []

    ocr_data = results[0]

    # --- ROBUSTNESS FIX ---
    # Intelligently check the format of the OCR output
    if isinstance(ocr_data, dict) and 'dt_polys' in ocr_data:
        # Handle the detailed dictionary-like output
        detected_boxes = ocr_data['dt_polys']
    elif isinstance(ocr_data, list):
        # Handle the standard list-based output
        detected_boxes = [line[0] for line in ocr_data]
    else:
        print("Warning: Unrecognized PaddleOCR output format.")
        return []

    img = cv2.imread(img_path)
    if img is None:
        print(f"Error: Could not read image file at {img_path}")
        return []

    line_data = []
    for box in detected_boxes:
        try:
            x_coords = [float(pt[0]) for pt in box]
            y_coords = [float(pt[1]) for pt in box]
            x_min, x_max = int(min(x_coords)), int(max(x_coords))
            y_min, y_max = int(min(y_coords)), int(max(y_coords))

            if x_min < x_max and y_min < y_max:
                line_crop = img[y_min:y_max, x_min:x_max]
                line_data.append((y_min, line_crop))
        except (ValueError, TypeError) as e:
            print(f"Skipping a box due to invalid coordinate point: {box}. Error: {e}")
            continue

    line_data.sort(key=lambda item: item[0])
    return [crop for _, crop in line_data]

def prescription_ocr(img_path):
    """Full pipeline to get recognized lines from an image."""
    lines = detect_lines(img_path)
    recognized_lines = []
    for line in lines: # Removed enumeration as it wasn't used
        text = recognize_line(line)
        recognized_lines.append(text)
    return recognized_lines

def clean_and_merge_text(lines):
    """Joins and cleans a list of text lines."""
    full_text = " ".join(lines)
    full_text = re.sub(r'[\.\s,-]{2,}', ' ', full_text)
    full_text = re.sub(r'\s[^a-zA-Z0-9\s]+\s', ' ', full_text)
    full_text = re.sub(r'\s+', ' ', full_text).strip()
    return full_text

# --- 3. RUN THE FULL PIPELINE ---
print("\nStarting the full OCR and post-processing pipeline...")
image_file_path = "apollo.jpeg"

raw_lines = prescription_ocr(image_file_path)
print(f"-> OCR finished, found {len(raw_lines)} lines.")

merged_text = clean_and_merge_text(raw_lines)
print(f"-> Merged Text: '{merged_text}'")

# print("-> Applying spelling correction...")
# suggestions = sym_spell.lookup_compound(merged_text, max_edit_distance=2)
# final_text = suggestions[0].term if suggestions else merged_text

print(f"\n--- FINAL RESULT ---")
print(merged_text)
import requests
import json


prompt_text = f"""Analyze the provided patient data and output ONLY a concise summary and the corresponding FHIR resource(s).
Do not include any other explanations, notes, or conversational text. No Name,Age,Date of Birth is present in the given information. DO NOT Present it.
Format the output with clear headings for 'Summary' and 'FHIR'.

{merged_text}"""

api_key = "AIzaSyBKd-VhiOaBqvgCEopUi3vvWqKRRjMliDY"  # <-- Put your API key here
url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
# url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent"
payload = {
    "contents": [
        {
            "parts": [
                {"text": prompt_text}
            ]
        }
    ]
}

headers = {
    "Content-Type": "application/json",
    "X-goog-api-key": api_key
}

response = requests.post(url, headers=headers, data=json.dumps(payload))

if response.status_code == 200:
    try:
        results = response.json()

        if "candidates" in results and len(results["candidates"]) > 0:
            output_text = results["candidates"][0]["content"]["parts"][0]["text"]

            # Split the text to find the "Summary" and "FHIR" sections
            summary_start = output_text.find("Summary")
            fhir_start = output_text.find("FHIR")

            summary = ""
            fhir_resource = ""

            if summary_start != -1:
                summary_end = fhir_start if fhir_start != -1 else len(output_text)
                summary = output_text[summary_start:summary_end].strip()

            if fhir_start != -1:
                # Extract text from "FHIR" to the end of the text
                fhir_resource = output_text[fhir_start:].strip()

            print("--- Gemini Output ---")
            if summary:
                print(summary)
            if fhir_resource:
                print("\n" + fhir_resource)
        else:
            print("Error: No candidates found in the response.")
    except KeyError as e:
        print(f"Error: Missing key in JSON response - {e}")
else:
    print("Error:", response.status_code, response.text)