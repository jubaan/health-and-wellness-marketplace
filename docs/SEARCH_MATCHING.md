# Search & Matching

## Inputs
- Location: city (string) and optional lat/lng + radius (km)
- Interests: controlled specialties and free-form tags (comma-separated)

## Process
- Fetch candidates by city (case-insensitive contains)
- Compute distance via Haversine when lat/lng provided
- Terms match if any term appears in specialties or tags

## Ranking
- Sort by ratingAverage (desc), then distance (asc), then displayName

## Notes
- Geospatial: move to PostGIS `ST_DWithin` for robust radius queries later
- Text search: consider pg_trgm or tsquery for fuzzy matches
- Compliance: avoid storing medical records; treat diagnoses as tags only

