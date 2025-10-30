import csv
import json
import re

def clean_perfume_data(csv_file_path, json_file_path):
    data = []
    
    with open(csv_file_path, 'r', encoding='utf-8') as csv_file:
        csv_reader = csv.DictReader(csv_file)
        
        for row in csv_reader:
            # Clean up the name field
            original_name = row['Name']
            
            # Remove gender phrases even if they're stuck to the name (e.g., "Afnanfor women")
            clean_name = re.sub(r'for\s*women\s*and\s*men$', '', original_name, flags=re.IGNORECASE)
            clean_name = re.sub(r'for\s*women$', '', clean_name, flags=re.IGNORECASE)
            clean_name = re.sub(r'for\s*men$', '', clean_name, flags=re.IGNORECASE)
            clean_name = re.sub(r'unisex$', '', clean_name, flags=re.IGNORECASE)
            
            # Also handle cases where it's stuck to the previous word (no space before "for")
            clean_name = re.sub(r'([a-zA-Z])for\s*women\s*and\s*men$', r'\1', clean_name, flags=re.IGNORECASE)
            clean_name = re.sub(r'([a-zA-Z])for\s*women$', r'\1', clean_name, flags=re.IGNORECASE)
            clean_name = re.sub(r'([a-zA-Z])for\s*men$', r'\1', clean_name, flags=re.IGNORECASE)
            clean_name = re.sub(r'([a-zA-Z])unisex$', r'\1', clean_name, flags=re.IGNORECASE)

            # Clean and trim name
            row['Name'] = clean_name.strip()
            
            # Normalize Gender capitalization
            gender_key = 'Gender' if 'Gender' in row else 'gender'
            if row[gender_key]:
                gender = row[gender_key].lower().strip()
                if gender == 'for men':
                    row[gender_key] = 'For Men'
                elif gender == 'for women':
                    row[gender_key] = 'For Women'
                elif gender == 'for women and men':
                    row[gender_key] = 'For Women and Men'
                elif gender == 'unisex':
                    row[gender_key] = 'Unisex'
            
            data.append(row)
    
    with open(json_file_path, 'w', encoding='utf-8') as json_file:
        json.dump(data, json_file, indent=4, ensure_ascii=False)
    
    print(f"✅ Successfully converted and cleaned {csv_file_path} to {json_file_path}")
    
    # Show examples of the cleaning
    print("\n=== Cleaning Examples ===")
    with open(csv_file_path, 'r', encoding='utf-8') as csv_file:
        csv_reader = csv.DictReader(csv_file)
        for i, row in enumerate(csv_reader):
            if i < 5:
                original_name = row['Name']
                test_clean = re.sub(r'([a-zA-Z]*)for\s*(women\s*and\s*men|women|men|unisex)$', r'\1', original_name, flags=re.IGNORECASE)
                print(f"Original Name: '{original_name}'")
                print(f"Cleaned Name:  '{test_clean.strip()}'\n")

# Usage
clean_perfume_data("C:/Users/aabou/Downloads/archive/fra_perfumes.csv", 'perfumes.json')
