import os
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

# 1. Training Dataset: Hostel maintenance reports
DATASET = [
    # --- URGENT (Immediately / Within 2 hours) ---
    ("Sparks coming out of the electrical outlet", "Urgent"),
    ("Fire in a hostel room", "Urgent"),
    ("Spark coming from an electrical outlet", "Urgent"),
    ("Short circuit in the electrical wiring", "Urgent"),
    ("Smoke filling the room", "Urgent"),
    ("Flood in a hostel room", "Urgent"),
    ("Water leak inside the room", "Urgent"),
    ("Resident has an injury needing immediate medical attention", "Urgent"),
    ("Shattered glass with sharp edges", "Urgent"),
    ("Water pipe burst, room is flooding", "Urgent"),
    ("Smell of burning plastic near the switchboard", "Urgent"),
    ("Main door lock failure leaves the room unsecured", "Urgent"),
    ("Ceiling plaster fell down on bed", "Urgent"),
    ("Exposed live wire touching the metal bed frame", "Urgent"),
    ("Gas smell coming from pantry area", "Urgent"),
    ("Severe water leakage from the ceiling directly on power outlets", "Urgent"),
    ("Aircond leaking water drops on the floor", "Urgent"),
    ("Shattered window glass with sharp edges hanging", "Urgent"),
    ("Smoke coming from air conditioner unit", "Urgent"),
    ("Fire alarm beeping and smell of smoke in corridor", "Urgent"),
    ("Toilet sewage overflowing onto bathroom floor", "Urgent"),
    ("Total electrical blackout in the entire unit", "Urgent"),
    ("Room keycard lock malfunctioning, locked outside at midnight", "Urgent"),
    ("Power socket exploded when plugging in laptop charger", "Urgent"),
    ("Heavy water pouring from upper floor ceiling", "Urgent"),

    # --- MEDIUM (Within 24 hours) ---
    ("Broken", "Medium"),
    ("A broken chair that cannot be used", "Medium"),
    ("Broken drawer handle on the study desk", "Medium"),
    ("Broken cupboard door hinge", "Medium"),
    ("Air conditioner is blowing warm air", "Medium"),
    ("Room Wi-Fi router stopped working", "Medium"),
    ("Toilet flush is stuck and won't stop running water", "Medium"),
    ("Bathroom sink drain is completely clogged", "Medium"),
    ("Water heater geyser is not producing hot water", "Medium"),
    ("Window latch is broken, window won't stay closed", "Medium"),
    ("Fridge in the common room is completely dead", "Medium"),
    ("Room ceiling fan is running at extremely slow speed", "Medium"),
    ("No water pressure in bathroom shower", "Medium"),
    ("Study table lamp outlet has no power", "Medium"),
    ("Microwave oven in pantry not heating food", "Medium"),
    ("Water dispenser is not cooling or heating water", "Medium"),
    ("Washing machine won't spin or drain water", "Medium"),
    ("Induction cooker tripping electricity when turned on", "Medium"),
    ("Mattress cover zipper is broken", "Medium"),

    # --- NORMAL (Within 48 hours) ---
    ("Study desk drawer handle is loose", "Normal"),
    ("Ceiling light bulb fused, room is slightly dim", "Normal"),
    ("Study chair wheel is jammed", "Normal"),
    ("Door hinges are squeaking loudly when opening", "Normal"),
    ("Cupboard door does not align properly", "Normal"),
    ("Mirror frame in bathroom is loose", "Normal"),
    ("Curtain rod fell off on one side", "Normal"),
    ("Paint peeling off near the balcony door", "Normal"),
    ("Window mosquito mesh has a small tear", "Normal"),
    ("Wardrobe shelf peg is missing and shelf is tilted", "Normal"),
    ("Balcony sliding door roller feels stiff", "Normal"),
    ("Wall sticker residue needs cleaning by facility crew", "Normal"),
    ("Study desk surface scratch and minor laminate peeling", "Normal"),
    ("Clothes drying rack hinge is slightly bent", "Normal"),
]

def build_model():
    """Build the Machine Learning Pipeline (TF-IDF Vectorizer + Logistic Regression)."""
    return Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), stop_words="english", lowercase=True)),
        ("clf", LogisticRegression(class_weight="balanced", max_iter=1000, random_state=42))
    ])

def train_and_save_model(model_filename="hostel_urgency_model.joblib", dataset=None):
    """
    Trains the urgency classification model and saves it to disk as a joblib artifact.
    Returns: (trained_model, accuracy_report)
    """
    if dataset is None:
        dataset = DATASET

    texts, labels = zip(*dataset)
    model = build_model()
    model.fit(texts, labels)

    # Save to directory of this script or working directory
    base_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(base_dir, model_filename)

    joblib.dump(model, output_path)
    print(f"[OK] Model successfully trained on {len(texts)} samples and saved to: {output_path}")
    return model, output_path

if __name__ == "__main__":
    train_and_save_model()
