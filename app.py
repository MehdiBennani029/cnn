# app.py - FastAPI backend for Pneumonia CNN with Metrics and Batch Prediction (final)

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import List, Optional, Dict

import numpy as np
from PIL import Image
import io
import time
import os
import glob
import math  # for NaN/inf checks

from tensorflow.keras.models import load_model
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, roc_curve, auc
)

# -------------------------------------------------
# CONFIG
# -------------------------------------------------
MODEL_PATH = r"C:\Users\mehdi\Desktop\CNN Project\pneumonia1.h5"

# Structure: test_dir/NORMAL/* and test_dir/PNEUMONIA/*
TEST_DATA_DIR = r"C:\Users\mehdi\Desktop\CNN Project\Dataset\test"

CLASS_NAMES = ["Normal", "Pneumonia"]

# -------------------------------------------------
# LOAD MODEL ONCE
# -------------------------------------------------
print(f"Loading model from: {MODEL_PATH}")
load_start = time.time()
model = load_model(MODEL_PATH)
load_time = time.time() - load_start
print(f"Model loaded in {load_time:.2f} seconds")

input_shape = model.input_shape
output_shape = model.output_shape
print(f"Model input shape:  {input_shape}")
print(f"Model output shape: {output_shape}")

if len(input_shape) == 4:
    _, IMG_HEIGHT, IMG_WIDTH, CHANNELS = input_shape
else:
    IMG_HEIGHT, IMG_WIDTH, CHANNELS = 224, 224, 3  # fallback

if isinstance(output_shape, (list, tuple)) and len(output_shape) >= 2:
    num_outputs = output_shape[-1]
else:
    num_outputs = 1

print(f"Inferred HxW: {IMG_HEIGHT}x{IMG_WIDTH}, channels: {CHANNELS}")
print(f"Number of outputs: {num_outputs}")

# -------------------------------------------------
# CACHED METRICS
# -------------------------------------------------
cached_metrics: Optional["MetricsResponse"] = None

# -------------------------------------------------
# FASTAPI APP
# -------------------------------------------------
app = FastAPI(
    title="Pneumonia CNN Inference Microservice",
    description="API for pneumonia detection with metrics and batch prediction",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------
# SCHEMAS
# -------------------------------------------------
class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_path: str
    load_time_sec: float
    input_shape: tuple
    output_shape: tuple
    num_outputs: int

    # Avoid pydantic warnings on fields named model_*
    model_config = {"protected_namespaces": ()}


class PredictionResponse(BaseModel):
    predicted_class: str
    predicted_confidence: float
    class_probabilities: Dict[str, float]


class BatchPredictionItem(BaseModel):
    filename: str
    predicted_class: str
    predicted_confidence: float
    class_probabilities: Dict[str, float]


class BatchPredictionResponse(BaseModel):
    results: List[BatchPredictionItem]
    total_processed: int
    processing_time_sec: float


class ConfusionMatrixSchema(BaseModel):
    true_negative: int
    false_positive: int
    false_negative: int
    true_positive: int


class ROCCurveSchema(BaseModel):
    fpr: List[float]
    tpr: List[float]
    thresholds: List[float]


class MetricsResponse(BaseModel):
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    specificity: float
    auc: float
    confusion_matrix: ConfusionMatrixSchema
    roc_curve: ROCCurveSchema

# -------------------------------------------------
# UTILS
# -------------------------------------------------
def safe_float(x: float) -> float:
    """Convert to regular float and avoid NaN/inf for JSON."""
    if x is None:
        return 0.0
    if isinstance(x, (np.floating,)):
        x = float(x)
    try:
        if math.isnan(x) or math.isinf(x):
            return 0.0
    except TypeError:
        return 0.0
    return float(x)

# -------------------------------------------------
# IMAGE PREPROCESSING
# -------------------------------------------------
def preprocess_image(image: Image.Image) -> np.ndarray:
    """Preprocess for single-image prediction (returns batch of 1)."""
    if CHANNELS == 1:
        image = image.convert("L")
        image = image.resize((IMG_WIDTH, IMG_HEIGHT))
        img_array = np.array(image).astype("float32") / 255.0
        img_array = np.expand_dims(img_array, axis=-1)
    else:
        image = image.convert("RGB")
        image = image.resize((IMG_WIDTH, IMG_HEIGHT))
        img_array = np.array(image).astype("float32") / 255.0

    img_array = np.expand_dims(img_array, axis=0)
    return img_array


def preprocess_image_for_metrics(image: Image.Image) -> np.ndarray:
    """Preprocess for metrics (no batch dimension)."""
    if CHANNELS == 1:
        image = image.convert("L")
        image = image.resize((IMG_WIDTH, IMG_HEIGHT))
        img_array = np.array(image).astype("float32") / 255.0
        img_array = np.expand_dims(img_array, axis=-1)
    else:
        image = image.convert("RGB")
        image = image.resize((IMG_WIDTH, IMG_HEIGHT))
        img_array = np.array(image).astype("float32") / 255.0
    return img_array  # shape (H, W, C)


def predict_single(image: Image.Image) -> tuple:
    """Returns (predicted_class, confidence, probabilities_dict, raw_prob)"""
    input_batch = preprocess_image(image)
    raw_preds = model.predict(input_batch, verbose=0)[0]
    preds = np.array(raw_preds, dtype="float32").ravel()

    # Binary case
    if num_outputs == 1 or preds.shape[0] == 1:
        p_pneumonia = safe_float(float(preds[0]))
        p_pneumonia = max(0.0, min(1.0, p_pneumonia))  # clamp
        p_normal = safe_float(1.0 - p_pneumonia)

        if p_pneumonia >= 0.5:
            predicted_class = CLASS_NAMES[1]
            predicted_confidence = p_pneumonia
        else:
            predicted_class = CLASS_NAMES[0]
            predicted_confidence = p_normal

        probs = {
            CLASS_NAMES[0]: p_normal,
            CLASS_NAMES[1]: p_pneumonia
        }
        return predicted_class, predicted_confidence, probs, p_pneumonia

    # Multi-class (not your case but keep robust)
    preds = np.array([safe_float(float(x)) for x in preds])
    idx = int(np.argmax(preds))
    predicted_class = CLASS_NAMES[idx]
    predicted_confidence = float(preds[idx])
    probs = {
        name: float(preds[i]) if i < len(preds) else 0.0
        for i, name in enumerate(CLASS_NAMES)
    }
    raw_prob = float(preds[1]) if len(preds) > 1 else float(preds[0])
    return predicted_class, predicted_confidence, probs, raw_prob

# -------------------------------------------------
# METRICS CALCULATION (BATCHED)
# -------------------------------------------------
def calculate_metrics_from_test_data() -> Optional[MetricsResponse]:
    """Calculate metrics using the test dataset in a batched, fast way."""
    global cached_metrics

    if not os.path.exists(TEST_DATA_DIR):
        print(f"Test data directory not found: {TEST_DATA_DIR}")
        return None

    normal_dir = os.path.join(TEST_DATA_DIR, "NORMAL")
    pneumonia_dir = os.path.join(TEST_DATA_DIR, "PNEUMONIA")

    if not os.path.exists(normal_dir) or not os.path.exists(pneumonia_dir):
        print("NORMAL or PNEUMONIA subdirectories not found in test data")
        return None

    normal_images = glob.glob(os.path.join(normal_dir, "*.*"))
    pneumonia_images = glob.glob(os.path.join(pneumonia_dir, "*.*"))

    print(f"Found {len(normal_images)} Normal and {len(pneumonia_images)} Pneumonia test images")

    if len(normal_images) == 0 or len(pneumonia_images) == 0:
        print("No test images found")
        return None

    X = []
    y_true = []

    # Normal = 0
    print("Processing Normal images (batched)...")
    for img_path in normal_images:
        try:
            img = Image.open(img_path)
            arr = preprocess_image_for_metrics(img)
            X.append(arr)
            y_true.append(0)
        except Exception as e:
            print(f"Error processing {img_path}: {e}")

    # Pneumonia = 1
    print("Processing Pneumonia images (batched)...")
    for img_path in pneumonia_images:
        try:
            img = Image.open(img_path)
            arr = preprocess_image_for_metrics(img)
            X.append(arr)
            y_true.append(1)
        except Exception as e:
            print(f"Error processing {img_path}: {e}")

    if len(X) == 0:
        print("No valid test samples processed")
        return None

    X = np.stack(X, axis=0)  # shape (N, H, W, C)
    y_true = np.array(y_true)

    print(f"Running model.predict on {len(X)} images...")
    y_raw = model.predict(X, batch_size=32, verbose=0).ravel()

    y_prob = np.array([safe_float(float(p)) for p in y_raw])
    y_prob = np.clip(y_prob, 0.0, 1.0)
    y_pred = (y_prob >= 0.5).astype(int)

    # Metrics
    acc = safe_float(accuracy_score(y_true, y_pred))
    prec = safe_float(precision_score(y_true, y_pred, zero_division=0))
    rec = safe_float(recall_score(y_true, y_pred, zero_division=0))
    f1 = safe_float(f1_score(y_true, y_pred, zero_division=0))

    cm = confusion_matrix(y_true, y_pred)
    if cm.size == 4:
        tn, fp, fn, tp = cm.ravel()
    else:
        tn = fp = fn = tp = 0

    specificity = safe_float(tn / (tn + fp)) if (tn + fp) > 0 else 0.0

    # Safe ROC / AUC
    unique_classes = np.unique(y_true)
    if len(unique_classes) < 2:
        fpr = np.array([0.0, 1.0])
        tpr = np.array([0.0, 1.0])
        thresholds = np.array([1.0, 0.0])
        roc_auc = 0.0
    else:
        fpr, tpr, thresholds = roc_curve(y_true, y_prob)
        roc_auc = safe_float(auc(fpr, tpr))

    fpr_list = [safe_float(float(x)) for x in fpr]
    tpr_list = [safe_float(float(x)) for x in tpr]
    thr_list = [safe_float(float(x)) for x in thresholds]

    cached_metrics = MetricsResponse(
        accuracy=acc,
        precision=prec,
        recall=rec,
        f1_score=f1,
        specificity=specificity,
        auc=roc_auc,
        confusion_matrix=ConfusionMatrixSchema(
            true_negative=int(tn),
            false_positive=int(fp),
            false_negative=int(fn),
            true_positive=int(tp)
        ),
        roc_curve=ROCCurveSchema(
            fpr=fpr_list,
            tpr=tpr_list,
            thresholds=thr_list
        )
    )

    print(f"Metrics calculated - Accuracy: {acc:.4f}, AUC: {roc_auc:.4f}")
    return cached_metrics

# -------------------------------------------------
# ENDPOINTS
# -------------------------------------------------
@app.get("/health", response_model=HealthResponse)
def health():
    return HealthResponse(
        status="ok",
        model_loaded=True,
        model_path=os.path.abspath(MODEL_PATH),
        load_time_sec=load_time,
        input_shape=input_shape,
        output_shape=output_shape,
        num_outputs=num_outputs,
    )


@app.get("/info")
def info():
    return {
        "service": "Pneumonia CNN Inference Microservice",
        "version": "2.0.0",
        "num_classes": len(CLASS_NAMES),
        "class_names": CLASS_NAMES,
        "img_height": IMG_HEIGHT,
        "img_width": IMG_WIDTH,
        "channels": CHANNELS,
        "output_shape": output_shape,
        "num_outputs": num_outputs,
    }


@app.post("/predict", response_model=PredictionResponse)
async def predict(file: UploadFile = File(...)):
    contents = await file.read()
    try:
        image = Image.open(io.BytesIO(contents))
    except Exception:
        return PredictionResponse(
            predicted_class="error",
            predicted_confidence=0.0,
            class_probabilities={"error": 1.0},
        )

    predicted_class, predicted_confidence, probs, _ = predict_single(image)

    return PredictionResponse(
        predicted_class=predicted_class,
        predicted_confidence=safe_float(predicted_confidence),
        class_probabilities={k: safe_float(v) for k, v in probs.items()},
    )


@app.post("/batch-predict", response_model=BatchPredictionResponse)
async def batch_predict(files: List[UploadFile] = File(...)):
    """Process multiple images at once."""
    start_time = time.time()
    results: List[BatchPredictionItem] = []

    for file in files:
        contents = await file.read()
        try:
            image = Image.open(io.BytesIO(contents))
            predicted_class, predicted_confidence, probs, _ = predict_single(image)
            results.append(BatchPredictionItem(
                filename=file.filename,
                predicted_class=predicted_class,
                predicted_confidence=safe_float(predicted_confidence),
                class_probabilities={k: safe_float(v) for k, v in probs.items()}
            ))
        except Exception as e:
            print(f"Error in batch-predict for {file.filename}: {e}")
            results.append(BatchPredictionItem(
                filename=file.filename,
                predicted_class="error",
                predicted_confidence=0.0,
                class_probabilities={"error": 1.0}
            ))

    processing_time = time.time() - start_time

    return BatchPredictionResponse(
        results=results,
        total_processed=len(results),
        processing_time_sec=safe_float(processing_time)
    )


@app.get("/metrics", response_model=MetricsResponse)
def get_metrics():
    """
    First call: compute metrics from test data (batched) and cache them.
    Next calls: return cached metrics instantly.
    """
    global cached_metrics

    if cached_metrics is None:
        print("No cached metrics, calculating now...")
        metrics = calculate_metrics_from_test_data()
        if metrics is None:
            # Fallback zeros if something goes wrong
            return MetricsResponse(
                accuracy=0.0,
                precision=0.0,
                recall=0.0,
                f1_score=0.0,
                specificity=0.0,
                auc=0.0,
                confusion_matrix=ConfusionMatrixSchema(
                    true_negative=0, false_positive=0,
                    false_negative=0, true_positive=0
                ),
                roc_curve=ROCCurveSchema(
                    fpr=[0.0, 1.0],
                    tpr=[0.0, 1.0],
                    thresholds=[1.0, 0.0]
                )
            )
        return metrics

    return cached_metrics


@app.post("/metrics/recalculate", response_model=MetricsResponse)
def recalculate_metrics():
    """Force recalculation of metrics from test dataset."""
    metrics = calculate_metrics_from_test_data()
    if metrics is None:
        return MetricsResponse(
            accuracy=0.0,
            precision=0.0,
            recall=0.0,
            f1_score=0.0,
            specificity=0.0,
            auc=0.0,
            confusion_matrix=ConfusionMatrixSchema(
                true_negative=0, false_positive=0,
                false_negative=0, true_positive=0
            ),
            roc_curve=ROCCurveSchema(
                fpr=[0.0, 1.0],
                tpr=[0.0, 1.0],
                thresholds=[1.0, 0.0]
            )
        )
    return metrics

# -------------------------------------------------
# SIMPLE WEB UI
# -------------------------------------------------
@app.get("/", response_class=HTMLResponse)
async def index():
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Pneumonia CNN API UI</title>
        <meta charset="UTF-8" />
        <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto; text-align: center; }
            .container { border: 1px solid #ddd; padding: 20px; border-radius: 8px; }
            input[type="file"] { margin: 20px 0; }
            button { padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; background: #4CAF50; color: white; }
            .result { margin-top: 20px; font-size: 18px; font-weight: bold; }
            img { max-width: 100%; margin-top: 10px; border-radius: 4px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Pneumonia CNN Inference</h1>
            <p>Upload a chest X-ray image.</p>
            <input type="file" id="fileInput" accept="image/*" />
            <br />
            <button onclick="sendRequest()">Predict</button>
            <div class="result" id="result"></div>
            <img id="preview" src="" alt="" />
            <p>
                <a href="/docs">API Docs</a> |
                <a href="/metrics" target="_blank">View Metrics</a>
            </p>
        </div>
        <script>
            function sendRequest() {
                const fileInput = document.getElementById('fileInput');
                const resultDiv = document.getElementById('result');
                const previewImg = document.getElementById('preview');
                if (!fileInput.files.length) { resultDiv.innerHTML = "Choose an image first."; return; }
                const file = fileInput.files[0];
                const reader = new FileReader();
                reader.onload = e => previewImg.src = e.target.result;
                reader.readAsDataURL(file);
                const formData = new FormData();
                formData.append('file', file);
                resultDiv.innerHTML = "Predicting...";
                fetch('/predict', { method: 'POST', body: formData })
                    .then(r => r.json())
                    .then(data => {
                        if (data.predicted_class === "error") { resultDiv.innerHTML = "Error reading image."; return; }
                        resultDiv.innerHTML = `Prediction: ${data.predicted_class} (${(data.predicted_confidence * 100).toFixed(2)}%)`;
                    })
                    .catch(() => resultDiv.innerHTML = "Request failed.");
            }
        </script>
    </body>
    </html>
    """
    return html_content

# -------------------------------------------------
# MAIN
# -------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
