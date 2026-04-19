#!/usr/bin/env python3
"""
MS Garments Chatbot NLP Training Script
Uses Advanced NLP with NLTK for better natural language understanding
"""

import pandas as pd
import numpy as np
import json
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import pickle
import os
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
import re

# Download required NLTK data
print("📦 Downloading NLTK data...")
try:
    nltk.download('punkt_tab', quiet=True)
    nltk.download('stopwords', quiet=True)
    nltk.download('wordnet', quiet=True)
    nltk.download('omw-1.4', quiet=True)
    print("✅ NLTK data ready\n")
except:
    print("⚠️  NLTK download issue, using fallback...\n")

# Initialize NLP tools
lemmatizer = WordNetLemmatizer()

# Advanced NLP Preprocessing
def preprocess_with_nlp(text):
    """Advanced NLP preprocessing with lemmatization"""
    # Convert to lowercase
    text = text.lower().strip()
    
    # Remove special characters but keep spaces
    text = re.sub(r'[^a-z0-9\s]', '', text)
    
    # Simple tokenize by splitting on whitespace
    tokens = text.split()
    
    # Lemmatize (convert to root form: "leggings" -> "legging")
    try:
        lemmatized = [lemmatizer.lemmatize(token) for token in tokens]
        processed = ' '.join(lemmatized)
    except:
        # Fallback if lemmatization fails
        processed = ' '.join(tokens)
    
    return processed

# Synonym expansion for better matching
SYNONYMS = {
    'hi': ['hello', 'hey', 'greetings', 'good morning', 'good evening'],
    'product': ['item', 'article', 'goods', 'merchandise'],
    'price': ['cost', 'rate', 'charge', 'pricing'],
    'order': ['purchase', 'buy', 'booking'],
    'available': ['in stock', 'ready', 'present'],
    'show': ['display', 'list', 'view', 'see'],
    'delivery': ['shipping', 'dispatch', 'courier'],
    'payment': ['pay', 'transaction', 'billing'],
}

def expand_with_synonyms(text):
    """Expand text with synonyms for better matching"""
    words = text.lower().split()
    expanded_words = []
    
    for word in words:
        expanded_words.append(word)
        # Add synonyms
        for key, synonyms in SYNONYMS.items():
            if word == key or word in synonyms:
                expanded_words.extend(synonyms)
    
    return ' '.join(expanded_words)

# Load and process training data
def load_training_data(csv_path):
    """Load and prepare training data with NLP processing"""
    print(f"📚 Loading training data from {csv_path}...")
    df = pd.read_csv(csv_path)
    
    # Apply NLP preprocessing
    df['question_processed'] = df['question'].apply(preprocess_with_nlp)
    df['question_expanded'] = df['question_processed'].apply(expand_with_synonyms)
    df['response'] = df['response'].str.strip()
    
    print(f"✅ Loaded {len(df)} training examples")
    print(f"📊 Intents: {df['intent'].unique().tolist()}")
    
    return df

# Train NLP-enhanced TF-IDF model
def train_nlp_tfidf_model(questions):
    """Train NLP-enhanced TF-IDF vectorizer"""
    print("\n🧠 Training NLP-enhanced TF-IDF vectorizer...")
    
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 3),
        max_features=2000,
        min_df=1,
        strip_accents='unicode',
        lowercase=True,
        analyzer='word',
        token_pattern=r'\b\w+\b',
        sublinear_tf=True  # Use logarithmic TF scaling
    )
    
    tfidf_matrix = vectorizer.fit_transform(questions)
    
    print(f"✅ NLP TF-IDF trained with {len(vectorizer.vocabulary_)} features")
    
    return vectorizer, tfidf_matrix

# Intent classification
def classify_intent(query, df):
    """Classify the intent of a query using NLP"""
    query_lower = query.lower()
    
    # Intent patterns
    intent_keywords = {
        'greeting': ['hello', 'hi', 'hey', 'good morning', 'good evening'],
        'product_inquiry': ['product', 'legging', 'available', 'show', 'what', 'cotton', 'ankle'],
        'product_price': ['price', 'cost', 'how much', 'rate'],
        'order_status': ['order', 'status', 'track', 'my order', 'order history'],
        'place_order': ['how to order', 'place order', 'buy', 'purchase'],
        'payment_methods': ['payment', 'pay', 'method', 'upi', 'bank'],
        'delivery': ['delivery', 'shipping', 'courier', 'dispatch'],
        'reviews': ['review', 'feedback', 'rating'],
    }
    
    for intent, keywords in intent_keywords.items():
        if any(keyword in query_lower for keyword in keywords):
            return intent
    
    return 'general'

# Find best match with NLP
def find_best_match(query, vectorizer, tfidf_matrix, df, threshold=0.15):
    """Find best matching question using NLP and cosine similarity"""
    query_processed = preprocess_with_nlp(query)
    query_expanded = expand_with_synonyms(query_processed)
    
    query_vec = vectorizer.transform([query_expanded])
    similarities = cosine_similarity(query_vec, tfidf_matrix).flatten()
    
    best_idx = np.argmax(similarities)
    best_score = similarities[best_idx]
    
    # Get intent-based boost
    predicted_intent = classify_intent(query, df)
    if df.iloc[best_idx]['intent'] == predicted_intent:
        best_score *= 1.2  # Boost score if intent matches
    
    if best_score >= threshold:
        return df.iloc[best_idx], best_score
    
    return None, best_score

# Export for frontend
def export_for_frontend(df, output_path):
    """Export NLP-trained data for frontend"""
    print(f"\n💾 Exporting NLP model to {output_path}...")
    
    training_data = []
    for _, row in df.iterrows():
        training_data.append({
            'intent': row['intent'],
            'question': row['question'],
            'question_processed': row['question_processed'],
            'response': row['response']
        })
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(training_data, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Exported {len(training_data)} NLP-enhanced examples")

# Save model
def save_model(vectorizer, tfidf_matrix, df, model_dir):
    """Save NLP-trained model"""
    os.makedirs(model_dir, exist_ok=True)
    
    print(f"\n💾 Saving NLP model to {model_dir}...")
    
    with open(f'{model_dir}/nlp_vectorizer.pkl', 'wb') as f:
        pickle.dump(vectorizer, f)
    
    with open(f'{model_dir}/nlp_tfidf_matrix.pkl', 'wb') as f:
        pickle.dump(tfidf_matrix, f)
    
    df.to_pickle(f'{model_dir}/nlp_training_data.pkl')
    
    print("✅ NLP Model saved successfully")

# Test NLP model
def test_model(vectorizer, tfidf_matrix, df):
    """Test the NLP-trained model"""
    print("\n🧪 Testing NLP model with natural language queries...\n")
    
    test_queries = [
        "hey there",
        "what items do you have",
        "how much does it cost",
        "i want to buy something",
        "where is my purchase",
        "how can i pay",
        "when will it arrive",
        "show me cotton leggings stock"
    ]
    
    for query in test_queries:
        match, score = find_best_match(query, vectorizer, tfidf_matrix, df)
        intent = classify_intent(query, df)
        
        if match is not None:
            print(f"Query: '{query}'")
            print(f"Intent: {intent}")
            print(f"Match: '{match['question']}' (score: {score:.3f})")
            print(f"Response: {match['response']}")
            print()
        else:
            print(f"Query: '{query}' - No match (score: {score:.3f}, intent: {intent})\n")

def main():
    """Main NLP training pipeline"""
    print("🧠 MS Garments Chatbot NLP Training")
    print("=" * 60)
    
    # Paths
    csv_path = "public/ms_garments_chatbot_dataset.csv"
    json_output = "public/chatbot_nlp_model.json"
    model_dir = "models/nlp"
    
    # Load data with NLP
    df = load_training_data(csv_path)
    
    # Train NLP-enhanced TF-IDF
    vectorizer, tfidf_matrix = train_nlp_tfidf_model(df['question_expanded'].tolist())
    
    # Test model
    test_model(vectorizer, tfidf_matrix, df)
    
    # Save models
    save_model(vectorizer, tfidf_matrix, df, model_dir)
    
    # Export for frontend
    export_for_frontend(df, json_output)
    
    print("\n" + "=" * 60)
    print("🎉 NLP Training completed successfully!")
    print(f"📊 Model Statistics:")
    print(f"   - Training examples: {len(df)}")
    print(f"   - Unique intents: {df['intent'].nunique()}")
    print(f"   - NLP features: {len(vectorizer.vocabulary_)}")
    print(f"   - NLP techniques: Lemmatization, Synonym Expansion, Intent Classification")
    print(f"\n📁 Output files:")
    print(f"   - Frontend JSON: {json_output}")
    print(f"   - NLP Model files: {model_dir}/")

if __name__ == "__main__":
    main()
