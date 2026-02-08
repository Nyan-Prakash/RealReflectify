# Search Feature - Testing Guide

## Quick Start Testing

### 1. Start the Development Server
```bash
npm run dev
```

### 2. Generate Embeddings for Existing Entries

Once you're logged in and on the Search page:

**Option A: Via UI**
1. Go to `/search`
2. Click the "Generate Embeddings" button
3. Wait for success notification

**Option B: Via API**
```bash
curl -X POST http://localhost:3000/api/search/generate-embeddings \
  -H "Content-Type: application/json" \
  -d '{"batchSize": 50}' \
  --cookie "your-session-cookie"
```

### 3. Test Search Functionality

#### Test Keyword Search
1. Navigate to `/search`
2. Select "Keyword" mode
3. Search for exact words from your entries (e.g., "coffee", "meeting", "Sarah")
4. Verify results show entries containing those exact words

#### Test Semantic Search
1. Select "Semantic" mode
2. Search for concepts/meanings (e.g., "feeling happy", "stressful day", "spending time with friends")
3. Verify results show entries with similar meaning, not just exact words

#### Test Combined Search
1. Select "Combined" mode
2. Try various queries
3. Should see results ranked by both keyword match and semantic similarity

### 4. Test Filters

#### Date Range Filter
1. Expand filters section
2. Set "From" and "To" dates
3. Verify only entries within date range appear

#### People Filter
1. Check some people from the list
2. Verify results only show entries mentioning selected people

#### Sentiment Filter
1. Select "Positive", "Neutral", or "Negative"
2. Verify results match the selected sentiment

#### Combined Filters
1. Try multiple filters together
2. Verify results satisfy all filter criteria

### 5. Test UI Features

#### Search Bar
- Type slowly - should debounce (wait 500ms before searching)
- Type quickly - should only search once you stop typing
- Click X button - should clear search

#### Results Display
- Verify search terms are highlighted in yellow
- Check relevance scores are displayed
- Verify mood badges show correct sentiment
- Click results - should navigate to entry detail page

#### Empty States
- No query: Should show "Start searching" message
- No results: Should show "No results found" message
- Loading: Should show skeleton loaders

## API Testing with curl

### Search with Different Modes

**Keyword Search:**
```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "coffee",
    "type": "keyword",
    "limit": 20
  }' \
  --cookie "your-session-cookie"
```

**Semantic Search:**
```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "feeling stressed about work",
    "type": "semantic",
    "limit": 20
  }' \
  --cookie "your-session-cookie"
```

**Combined Search:**
```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "meeting with Sarah",
    "type": "combined",
    "limit": 20
  }' \
  --cookie "your-session-cookie"
```

### Search with Filters
```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "happy",
    "type": "combined",
    "filters": {
      "dateFrom": "2024-01-01",
      "dateTo": "2024-12-31",
      "sentiment": "positive"
    },
    "limit": 20
  }' \
  --cookie "your-session-cookie"
```

### Get Filter Options
```bash
curl http://localhost:3000/api/search \
  --cookie "your-session-cookie"
```

### Generate Embeddings
```bash
curl -X POST http://localhost:3000/api/search/generate-embeddings \
  -H "Content-Type: application/json" \
  -d '{"batchSize": 50}' \
  --cookie "your-session-cookie"
```

## Expected Behavior

### Search Results Should Include:
- `id`: Entry UUID
- `content`: Entry text
- `occurredAt`: When the entry occurred
- `createdAt`: When the entry was created
- `parseStatus`: Status of AI processing
- `metadata`: Mood, energy, tags
- `relevanceScore`: 0-1 score (higher = more relevant)
- `searchType`: "keyword", "semantic", or "combined"

### Response Format:
```json
{
  "results": [
    {
      "id": "...",
      "content": "...",
      "occurredAt": "...",
      "createdAt": "...",
      "parseStatus": "completed",
      "metadata": { "mood": "positive", "energy": 8 },
      "relevanceScore": 0.89,
      "searchType": "combined"
    }
  ],
  "count": 5,
  "query": "coffee meeting",
  "type": "combined"
}
```

## Common Issues & Solutions

### Issue: Semantic search returns no results
**Solution**: Generate embeddings first
```bash
# Click "Generate Embeddings" button or use API
POST /api/search/generate-embeddings
```

### Issue: Search is slow
**Possible causes:**
1. First semantic search (index building) - normal
2. No database indexes - check migration applied
3. Large number of entries - consider pagination

### Issue: Filters not working
**Check:**
1. Entries have the required metadata (sentiment, etc.)
2. Entities exist in the database
3. Date format is correct (YYYY-MM-DD)

### Issue: No results for valid query
**Check:**
1. Entry has been processed (parseStatus = "completed")
2. For semantic: entry has embedding
3. For keyword: entry content is indexed
4. Try different search modes

## Database Verification

### Check if embeddings exist:
```sql
SELECT id, content, embedding IS NOT NULL as has_embedding
FROM entries
WHERE user_id = 'your-user-id'
LIMIT 10;
```

### Check search indexes:
```sql
-- Check full-text search index
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'entries'
AND indexname LIKE '%tsv%';

-- Check vector index
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'entries'
AND indexname LIKE '%embedding%';
```

### Count entries with embeddings:
```sql
SELECT
  COUNT(*) as total_entries,
  COUNT(embedding) as entries_with_embeddings,
  COUNT(embedding) * 100.0 / COUNT(*) as percentage
FROM entries
WHERE user_id = 'your-user-id';
```

## Performance Benchmarks

Expected performance (approximate):
- Keyword search: < 100ms
- Semantic search: < 500ms
- Combined search: < 600ms
- Embedding generation: ~1-2s per entry

## Next Steps After Testing

1. ✅ Verify all search modes work
2. ✅ Test all filters independently and combined
3. ✅ Generate embeddings for all existing entries
4. ✅ Test with various query types
5. ✅ Verify UI components render correctly
6. ✅ Check navigation works across pages
7. ✅ Test on different screen sizes (responsive)

## Success Criteria

- [x] Build completes without errors
- [ ] Keyword search returns relevant results
- [ ] Semantic search returns conceptually similar entries
- [ ] Combined search provides best results
- [ ] Filters work correctly
- [ ] UI is responsive and user-friendly
- [ ] New entries automatically get embeddings
- [ ] Navigation works across all pages
- [ ] No console errors during search operations

Happy Testing! 🔍
