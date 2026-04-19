#!/usr/bin/env python3
"""
MS Garments Chatbot - Simple NLP Training
Natural Language Processing without external downloads
"""

import pandas as pd
import numpy as np
import json
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import pickle
import os
import re

print("🧠 MS Garments Chatbot - Simple NLP Training")
print("=" * 60)

# Simple but effective lemmatization rules
LEMMA_RULES = {
    'leggings': 'legging',
    'products': 'product',
    'orders': 'order',
    'payments': 'payment',
    'deliveries': 'delivery',
    'reviews': 'review',
    'available': 'avail',
    'pricing': 'price',
}

# Synonym expansion for natural language understanding  
SYNONYMS = {
    'hi': ['hello', 'hey', 'greetings', 'good morning', 'good evening', 'hiya'],
    'product': ['item', 'article', 'goods', 'merchandise', 'stock'],
    'price': ['cost', 'rate', 'charge', 'pricing', 'how much'],
    'order': ['purchase', 'buy', 'booking', 'placing'],
    'available': ['in stock', 'ready', 'present', 'have'],
    'show': ['display', 'list', 'view', 'see', 'give'],
    'delivery': ['shipping', 'dispatch', 'courier', 'send'],
    'payment': ['pay', 'transaction', 'billing', 'paying'],
    'how': ['what is the way', 'tell me how', 'can you tell'],
}

def simple_lemmatize(word):
    """Simple lemmatization"""
    return LEMMA_RULES.get(word, word)

def preprocess_nlp(text):
    """Simple but effective NLP preprocessing"""
    # Lowercase and clean
    text = text.lower().strip()
    text = re.sub(r'[^a-z0-9\s]', '', text)
    text = ' '.join(text.split())
    
    # Apply lemmatization
    words = text.split()
    lemmatized = [simple_lemmatize(w) for w in words]
    
    return ' '.join(lemmatized)

def expand_synonyms(text):
    """Expand text with synonyms for better matching"""
    words = text.lower().split()
    expanded = set(words)  # Start with original words
    
    for word in words:
        # Add synonyms
        for key, syns in SYNONYMS.items():
            if word == key or word in syns:
                expanded.update([key] + syns)
    
    return ' '.join(expanded)

def load_training_data(csv_path):
    """Load and process training data"""
    print(f"📚 Loading training data from {csv_path}...")
    df = pd.read_csv(csv_path)
    
    # Apply NLP
    df['question_nlp'] = df['question'].apply(preprocess_nlp)
    df['question_expanded'] = df['question_nlp'].apply(expand_synonyms)
    df['response'] = df['response'].str.strip()
    
    print(f"✅ Loaded {len(df)} examples")
    print(f"📊 Intents: {', '.join(df['intent'].unique())}\n")
    
    return df

def train_nlp_model(questions):
    """Train NLP-enhanced TF-IDF model"""
    print("🔧 Training NLP TF-IDF vectorizer...")
    
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 3),
        max_features=2500,
        min_df=1,
        strip_accents='unicode',
        lowercase=True,
        sublinear_tf=True,
        analyzer='word'
    )
    
    tfidf_matrix = vectorizer.fit_transform(questions)
    
    print(f"✅ Trained with {len(vectorizer.vocabulary_)} NLP features\n")
    
    return vectorizer, tfidf_matrix

def classify_intent(query):
    """Simple intent classification"""
    q = query.lower()
    
    if any(w in q for w in ['hello', 'hi', 'hey', 'good morning', 'good evening']):
        return 'greeting'
    elif any(w in q for w in ['price', 'cost', 'how much', 'rate']):
        return 'product_price'
    elif any(w in q for w in ['product', 'legging', 'available', 'stock', 'item']):
        return 'product_inquiry'
    elif any(w in q for w in ['order status', 'track', 'my order']):
        return 'order_status'
    elif any(w in q for w in ['how to order', 'place order', 'buy']):
        return 'place_order'
    elif any(w in q for w in ['payment', 'pay', 'method']):
        return 'payment_methods'
    elif any(w in q for w in ['delivery', 'shipping', 'courier']):
        return 'delivery'
    elif any(w in q for w in ['review', 'feedback', 'rating']):
        return 'reviews'
    else:
        return 'general'

def find_best_match(query, vectorizer, tfidf_matrix, df, threshold=0.12):
    """Find best match with NLP"""
    query_nlp = preprocess_nlp(query)
    query_expanded = expand_synonyms(query_nlp)
    
    query_vec = vectorizer.transform([query_expanded])
    similarities = cosine_similarity(query_vec, tfidf_matrix).flatten()
    
    best_idx = np.argmax(similarities)
    best_score = similarities[best_idx]
    
    # Intent boost
    predicted_intent = classify_intent(query)
    if df.iloc[best_idx]['intent'] == predicted_intent:
        best_score *= 1.25
    
    if best_score >= threshold:
        return df.iloc[best_idx], best_score
    
    return None, best_score

def test_nlp_model(vectorizer, tfidf_matrix, df):
    """Test NLP model with natural queries"""
    print("🧪 Testing NLP with natural language...\n")
    
    tests = [
        "hey",
        "what items can i buy",
        "how much does cotton legging cost",
        "i want to make a purchase",
        "where's my order",
        "how do i pay",
        "when will it ship",
        "how many products do you have"
    ]
    
    for query in tests:
        match, score = find_best_match(query, vectorizer, tfidf_matrix, df)
        intent = classify_intent(query)
        
        if match is not None:
            print(f"Query: '{query}'")
            print(f"  Intent: {intent}")
            print(f"  Matched: '{match['question']}' ({score:.3f})")
            print(f"  Response: {match['response']}\n")
        else:
            print(f"Query: '{query}' - No match ({score:.3f})\n")

def save_everything(vectorizer, tfidf_matrix, df):
    """Save all outputs"""
    # Save model
    os.makedirs('models/nlp', exist_ok=True)
    
    with open('models/nlp/vectorizer.pkl', 'wb') as f:
        pickle.dump(vectorizer, f)
    
    with open('models/nlp/tfidf_matrix.pkl', 'wb') as f:
        pickle.dump(tfidf_matrix, f)
    
    df.to_pickle('models/nlp/training_data.pkl')
    
    # Export for frontend
    training_data = []
    for _, row in df.iterrows():
        training_data.append({
            'intent': row['intent'],
            'question': row['question'],
            'question_nlp': row['question_nlp'],
            'response': row['response']
        })
    
    with open('public/chatbot_nlp_model.json', 'w', encoding='utf-8') as f:
        json.dump(training_data, f, indent=2, ensure_ascii=False)
    
    print(f"\n💾 Saved:")
    print(f"   - NLP model: models/nlp/")
    print(f"   - Frontend JSON: public/chatbot_nlp_model.json")

def main():
    csv_path = "public/ms_garments_chatbot_dataset.csv"
    
    df = load_training_data(csv_path)
    vectorizer, tfidf_matrix = train_nlp_model(df['question_expanded'].tolist())
    test_nlp_model(vectorizer, tfidf_matrix, df)
    save_everything(vectorizer, tfidf_matrix, df)
    
    print("\n" + "=" * 60)
    print("🎉 NLP Training Complete!")
    print(f"📊 Statistics:")
    print(f"   - Examples: {len(df)}")
    print(f"   - Intents: {df['intent'].nunique()}")
    print(f"   - NLP Features: {len(vectorizer.vocabulary_)}")
    print(f"   - Techniques: Lemmatization, Synonym Expansion, Intent Classification")

if __name__ == "__main__":
    main()
