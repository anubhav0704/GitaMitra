# Bhagavad Gita Dataset

This directory contains the canonical Bhagavad Gita knowledge base used by the GitaMitra application.

## Provenance and Licensing
- **Source:** The original dataset is sourced from the public domain or open-licensed repositories (such as the `bhagavad-gita-api` or `gita.api`). 
- **License:** The Sanskrit verses are thousands of years old and in the public domain. The English and Hindi translations chosen for this default dataset are generally accepted to be public domain or provided under open licenses (e.g., MIT, CC0).
- **Disclaimer:** Do NOT overwrite or substitute translations with copyrighted material unless you have explicit permission to do so. The schema is designed to allow custom translation additions without mutating the original verse text.

## Directory Structure
- `raw/`: Contains the originally downloaded JSON datasets (e.g. `chapters.json`, `verses.json`).
- `processed/`: Any temporary parsed or cleaned formats before they are inserted into the database.

## Import Workflow
To update or seed this dataset into the database:
1. Fetch dataset: `python scripts/download_dataset.py`
2. Validate dataset: `python scripts/validate_gita.py`
3. Seed database: `python scripts/seed_gita.py`

This process is strictly idempotent; running it multiple times will safely skip existing records or update them based on primary keys without creating duplicates.
