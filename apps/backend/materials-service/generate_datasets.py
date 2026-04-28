#!/usr/bin/env python3
"""
Générateur de datasets pour le système de prédiction de matériaux
Génère 2 fichiers CSV :
1. stock-prediction.csv - Pour prédire la rupture de stock
2. anomaly-detection.csv - Pour détecter vol/gaspillage
"""

import csv
import random
from datetime import datetime, timedelta

# Configuration
NUM_ROWS = 1000
START_DATE = datetime(2024, 1, 1)

# Matériaux disponibles
MATERIALS = [
    {"id": "MAT001", "name": "Ciment Portland", "initial_stock": 1000, "normal_rate": 25},
    {"id": "MAT002", "name": "Sable de construction", "initial_stock": 2000, "normal_rate": 45},
    {"id": "MAT003", "name": "Briques rouges", "initial_stock": 5000, "normal_rate": 120},
    {"id": "MAT004", "name": "Acier de construction", "initial_stock": 800, "normal_rate": 15},
    {"id": "MAT005", "name": "Béton prêt à l'emploi", "initial_stock": 1500, "normal_rate": 30},
    {"id": "MAT006", "name": "Gravier", "initial_stock": 3000, "normal_rate": 80},
    {"id": "MAT007", "name": "Parpaings", "initial_stock": 1200, "normal_rate": 28},
    {"id": "MAT008", "name": "Tuiles", "initial_stock": 800, "normal_rate": 12},
    {"id": "MAT009", "name": "Isolant thermique", "initial_stock": 600, "normal_rate": 16},
    {"id": "MAT010", "name": "Plâtre", "initial_stock": 400, "normal_rate": 14},
]

# Sites disponibles
SITES = [
    {"id": "SITE001", "name": "Chantier Nord", "type": "residential"},
    {"id": "SITE002", "name": "Chantier Sud", "type": "commercial"},
    {"id": "SITE003", "name": "Chantier Est", "type": "industrial"},
    {"id": "SITE004", "name": "Chantier Ouest", "type": "residential"},
    {"id": "SITE005", "name": "Chantier Centre", "type": "commercial"},
]

# Conditions météo
WEATHER_CONDITIONS = ["sunny", "cloudy", "rainy", "stormy", "snowy", "windy"]

# Niveaux d'activité
ACTIVITY_LEVELS = ["low", "medium", "high"]

def generate_stock_prediction_dataset():
    """
    Génère le dataset pour la prédiction de rupture de stock
    Format: timestamp, materialId, materialName, siteId, siteName, stockLevel, consumption, 
            hourOfDay, dayOfWeek, weather, projectType, siteActivityLevel, daysUntilOutOfStock
    """
    print("🔄 Génération du dataset de prédiction de stock...")
    
    rows = []
    rows.append([
        "timestamp", "materialId", "materialName", "siteId", "siteName", 
        "stockLevel", "consumption", "hourOfDay", "dayOfWeek", "weather", 
        "projectType", "siteActivityLevel", "daysUntilOutOfStock"
    ])
    
    for i in range(NUM_ROWS):
        # Sélectionner un matériau et un site aléatoires
        material = random.choice(MATERIALS)
        site = random.choice(SITES)
        
        # Générer un timestamp
        days_offset = i // 24  # 24 heures par jour
        hour = i % 24
        timestamp = START_DATE + timedelta(days=days_offset, hours=hour)
        
        # Calculer le stock actuel (décroissant)
        base_stock = material["initial_stock"] - (days_offset * material["normal_rate"] * 10)
        base_stock = max(0, base_stock)
        
        # Météo et activité
        weather = random.choice(WEATHER_CONDITIONS)
        
        # Activité selon l'heure
        if 0 <= hour < 7 or hour >= 18:
            activity = "low"
            consumption_multiplier = 0
        elif 7 <= hour < 8 or 17 <= hour < 18:
            activity = "medium"
            consumption_multiplier = 0.3
        elif 12 <= hour < 13:
            activity = "medium"
            consumption_multiplier = 0.5
        else:
            activity = "high"
            consumption_multiplier = 1.0
        
        # Ajustement selon la météo
        weather_multiplier = {
            "sunny": 1.0,
            "cloudy": 1.1,
            "rainy": 1.3,
            "stormy": 1.5,
            "snowy": 1.4,
            "windy": 1.1
        }[weather]
        
        # Consommation horaire
        consumption = int(material["normal_rate"] * consumption_multiplier * weather_multiplier)
        consumption += random.randint(-5, 5)  # Variation aléatoire
        consumption = max(0, consumption)
        
        # Stock après consommation
        stock_level = base_stock - consumption
        stock_level = max(0, stock_level)
        
        # Calculer les jours avant rupture
        if consumption > 0:
            hours_until_out = stock_level / (consumption + 0.1)
            days_until_out = hours_until_out / 24
        else:
            days_until_out = 999
        
        days_until_out = min(999, max(0, days_until_out))
        
        # Jour de la semaine (1=Lundi, 7=Dimanche)
        day_of_week = timestamp.weekday() + 1
        
        rows.append([
            timestamp.strftime("%Y-%m-%dT%H:%M:%SZ"),
            material["id"],
            material["name"],
            site["id"],
            site["name"],
            stock_level,
            consumption,
            hour,
            day_of_week,
            weather,
            site["type"],
            activity,
            round(days_until_out, 2)
        ])
    
    # Écrire le fichier
    with open("stock-prediction.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerows(rows)
    
    print(f"✅ Dataset de prédiction créé : stock-prediction.csv ({len(rows)-1} lignes)")


def generate_anomaly_detection_dataset():
    """
    Génère le dataset pour la détection d'anomalies (vol/gaspillage)
    Format: timestamp, materialId, materialName, siteId, siteName, expectedConsumption, 
            actualConsumption, deviation, hourOfDay, dayOfWeek, weather, projectType, 
            siteActivityLevel, isAnomaly, anomalyType, anomalySeverity
    """
    print("🔄 Génération du dataset de détection d'anomalies...")
    
    rows = []
    rows.append([
        "timestamp", "materialId", "materialName", "siteId", "siteName", 
        "expectedConsumption", "actualConsumption", "deviation", "hourOfDay", 
        "dayOfWeek", "weather", "projectType", "siteActivityLevel", 
        "isAnomaly", "anomalyType", "anomalySeverity"
    ])
    
    for i in range(NUM_ROWS):
        # Sélectionner un matériau et un site aléatoires
        material = random.choice(MATERIALS)
        site = random.choice(SITES)
        
        # Générer un timestamp
        days_offset = i // 24
        hour = i % 24
        timestamp = START_DATE + timedelta(days=days_offset, hours=hour)
        
        # Météo et activité
        weather = random.choice(WEATHER_CONDITIONS)
        
        # Activité selon l'heure
        if 0 <= hour < 7 or hour >= 18:
            activity = "low"
            consumption_multiplier = 0
        elif 7 <= hour < 8 or 17 <= hour < 18:
            activity = "medium"
            consumption_multiplier = 0.3
        elif 12 <= hour < 13:
            activity = "medium"
            consumption_multiplier = 0.5
        else:
            activity = "high"
            consumption_multiplier = 1.0
        
        # Ajustement selon la météo
        weather_multiplier = {
            "sunny": 1.0,
            "cloudy": 1.1,
            "rainy": 1.3,
            "stormy": 1.5,
            "snowy": 1.4,
            "windy": 1.1
        }[weather]
        
        # Consommation attendue
        expected_consumption = int(material["normal_rate"] * consumption_multiplier * weather_multiplier)
        expected_consumption = max(0, expected_consumption)
        
        # Déterminer si c'est une anomalie (20% de chance)
        is_anomaly = random.random() < 0.20
        
        if is_anomaly:
            # Type d'anomalie
            anomaly_type_choice = random.random()
            
            if anomaly_type_choice < 0.5:  # 50% vol
                anomaly_type = "THEFT"
                # Vol = consommation excessive (150% à 300% de la normale)
                multiplier = random.uniform(1.5, 3.0)
                actual_consumption = int(expected_consumption * multiplier)
                severity = "HIGH" if multiplier > 2.0 else "MEDIUM"
                
            elif anomaly_type_choice < 0.8:  # 30% gaspillage
                anomaly_type = "WASTE"
                # Gaspillage = consommation excessive (120% à 180% de la normale)
                multiplier = random.uniform(1.2, 1.8)
                actual_consumption = int(expected_consumption * multiplier)
                severity = "MEDIUM" if multiplier > 1.5 else "LOW"
                
            else:  # 20% sur-consommation
                anomaly_type = "OVER_CONSUMPTION"
                # Sur-consommation = légèrement au-dessus (110% à 150%)
                multiplier = random.uniform(1.1, 1.5)
                actual_consumption = int(expected_consumption * multiplier)
                severity = "LOW"
        else:
            # Consommation normale avec petite variation
            anomaly_type = "NONE"
            severity = "NONE"
            variation = random.uniform(0.9, 1.1)
            actual_consumption = int(expected_consumption * variation)
        
        # Calculer la déviation en pourcentage
        if expected_consumption > 0:
            deviation = ((actual_consumption - expected_consumption) / expected_consumption) * 100
        else:
            deviation = 0
        
        deviation = round(deviation, 2)
        
        # Jour de la semaine
        day_of_week = timestamp.weekday() + 1
        
        rows.append([
            timestamp.strftime("%Y-%m-%dT%H:%M:%SZ"),
            material["id"],
            material["name"],
            site["id"],
            site["name"],
            expected_consumption,
            actual_consumption,
            deviation,
            hour,
            day_of_week,
            weather,
            site["type"],
            activity,
            1 if is_anomaly else 0,
            anomaly_type,
            severity
        ])
    
    # Écrire le fichier
    with open("anomaly-detection.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerows(rows)
    
    print(f"✅ Dataset d'anomalies créé : anomaly-detection.csv ({len(rows)-1} lignes)")
    
    # Statistiques
    anomalies = sum(1 for row in rows[1:] if row[13] == 1)
    theft = sum(1 for row in rows[1:] if row[14] == "THEFT")
    waste = sum(1 for row in rows[1:] if row[14] == "WASTE")
    over_consumption = sum(1 for row in rows[1:] if row[14] == "OVER_CONSUMPTION")
    
    print(f"\n📊 Statistiques des anomalies :")
    print(f"   - Total anomalies : {anomalies} ({anomalies/NUM_ROWS*100:.1f}%)")
    print(f"   - Vol (THEFT) : {theft}")
    print(f"   - Gaspillage (WASTE) : {waste}")
    print(f"   - Sur-consommation (OVER_CONSUMPTION) : {over_consumption}")


if __name__ == "__main__":
    print("=" * 60)
    print("🚀 Générateur de Datasets pour Prédiction de Matériaux")
    print("=" * 60)
    print()
    
    generate_stock_prediction_dataset()
    print()
    generate_anomaly_detection_dataset()
    
    print()
    print("=" * 60)
    print("✅ Génération terminée avec succès!")
    print("=" * 60)
    print()
    print("📁 Fichiers générés :")
    print("   1. stock-prediction.csv - Prédiction de rupture de stock")
    print("   2. anomaly-detection.csv - Détection vol/gaspillage")
    print()
    print("🔧 Pour utiliser ces datasets :")
    print("   1. Copier les fichiers dans apps/backend/materials-service/")
    print("   2. Utiliser l'endpoint /api/materials/ml/train pour entraîner")
    print("   3. Les prédictions seront automatiquement améliorées")
