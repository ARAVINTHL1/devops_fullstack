#!/usr/bin/env python3
"""
MS Garments Chatbot ML Training Script
Uses TF-IDF and cosine similarity for intelligent question matching
"""

import pandas as pd
import numpy as np
import json
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import pickle
import os

# Preprocessing function
def preprocess_text(text):
    """Clean and normalize text"""
    import re
    text = text.lower().strip()
    # Remove special characters but keep spaces
    text = re.sub(r'[^a-z0-9\s]', '', text)
    # Remove extra spaces
    text = ' '.join(text.split())
    return text

# Load training data
def load_training_data(csv_path):
    """Load and prepare training data from CSV"""
    print(f"📚 Loading training data from {csv_path}...")
    df = pd.read_csv(csv_path)
    
    # Clean data
    df['question'] = df['question'].apply(preprocess_text)
    df['response'] = df['response'].str.strip()
    
    print(f"✅ Loaded {len(df)} training examples")
    print(f"📊 Intents: {df['intent'].unique().tolist()}")
    
    return df

# Train TF-IDF model
def train_tfidf_model(questions):
    """Train TF-IDF vectorizer on questions"""
    print("\n🔧 Training TF-IDF vectorizer...")
    
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 3),  # Use unigrams, bigrams, and trigrams
        max_features=1000,   # More features for better accuracy
        min_df=1,            # Include all terms
        strip_accents='unicode',
        lowercase=True,
        analyzer='word',
        token_pattern=r'\b\w+\b'
    )
    
    tfidf_matrix = vectorizer.fit_transform(questions)
    
    print(f"✅ TF-IDF trained with {len(vectorizer.vocabulary_)} features")
    
    return vectorizer, tfidf_matrix

# Find best match using ML
def find_best_match(query, vectorizer, tfidf_matrix, df, threshold=0.2):
    """Find best matching question using cosine similarity"""
    query_vec = vectorizer.transform([preprocess_text(query)])
    similarities = cosine_similarity(query_vec, tfidf_matrix).flatten()
    
    best_idx = np.argmax(similarities)
    best_score = similarities[best_idx]
    
    if best_score >= threshold:
        return df.iloc[best_idx], best_score
    
    return None, best_score

# Export model for frontend
def export_for_frontend(df, vectorizer, output_path):
    """Export trained data in JSON format for frontend"""
    print(f"\n💾 Exporting model to {output_path}...")
    
    # Prepare data for frontend
    training_data = []
    for _, row in df.iterrows():
        training_data.append({
            'intent': row['intent'],
            'question': row['question'],
            'response': row['response']
        })
    
    # Save as JSON
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(training_data, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Exported {len(training_data)} examples to JSON")

# Save pickle model
def save_model(vectorizer, tfidf_matrix, df, model_dir):
    """Save trained model as pickle files"""
    os.makedirs(model_dir, exist_ok=True)
    
    print(f"\n💾 Saving model to {model_dir}...")
    
    with open(f'{model_dir}/vectorizer.pkl', 'wb') as f:
        pickle.dump(vectorizer, f)
    
    with open(f'{model_dir}/tfidf_matrix.pkl', 'wb') as f:
        pickle.dump(tfidf_matrix, f)
    
    df.to_pickle(f'{model_dir}/training_data.pkl')
    
    print("✅ Model saved successfully")

# Test the model
def test_model(vectorizer, tfidf_matrix, df):
    """Test the trained model with sample queries"""
    print("\n🧪 Testing model with sample queries...\n")
    
    test_queries = [
        "hello",
        "what products are available",
        "price of leggings",
        "how to place order",
        "show my orders",
        "payment methods",
        "contact number"
    ]
    
    for query in test_queries:
        match, score = find_best_match(query, vectorizer, tfidf_matrix, df)
        if match is not None:
            print(f"Query: '{query}'")
            print(f"Match: '{match['question']}' (score: {score:.3f})")
            print(f"Response: {match['response']}")
            print()
        else:
            print(f"Query: '{query}' - No good match found (score: {score:.3f})\n")

def main():
    """Main training pipeline"""
    print("🤖 MS Garments Chatbot ML Training")
    print("=" * 50)
    
    # Paths
    csv_path = "public/ms_garments_chatbot_dataset.csv"
    json_output = "public/chatbot_trained_model.json"
    model_dir = "models"
    
    # Load data
    df = load_training_data(csv_path)
    
    # Train TF-IDF
    vectorizer, tfidf_matrix = train_tfidf_model(df['question'].tolist())
    
    # Test model
    test_model(vectorizer, tfidf_matrix, df)
    
    # Save models
    save_model(vectorizer, tfidf_matrix, df, model_dir)
    
    # Export for frontend
    export_for_frontend(df, vectorizer, json_output)
    
    print("\n" + "=" * 50)
    print("🎉 Training completed successfully!")
    print(f"📊 Model Statistics:")
    print(f"   - Training examples: {len(df)}")
    print(f"   - Unique intents: {df['intent'].nunique()}")
    print(f"   - TF-IDF features: {len(vectorizer.vocabulary_)}")
    print(f"\n📁 Output files:")
    print(f"   - Frontend JSON: {json_output}")
    print(f"   - Model files: {model_dir}/")

if __name__ == "__main__":
    main()
