# Reflectify - PR Roadmap

## Current Status (Completed)

✅ **Phase 1: Foundation**
- Next.js 15 app with Supabase Auth
- PostgreSQL database with 13 tables + pgvector
- Drizzle ORM setup
- Database migrations applied

✅ **Phase 2: Entry CRUD**
- Entry creation and listing
- Timeline view with infinite scroll
- Authentication flow (sign-in/sign-up)

✅ **Phase 3: AI Extraction Pipeline**
- OpenAI GPT-4o integration with structured outputs
- Entity extraction (people, places, organizations, food, activities)
- Event extraction with confidence scores
- Sentiment analysis
- Topic detection
- Provenance tracking (character offsets)

✅ **Phase 4: Integration**
- Automatic background AI processing
- Parse run tracking
- Status badges (pending → processing → completed/failed)
- Entity and mention persistence

---

## PR Roadmap - Remaining Features

### PR #1: Fix UI Polling & Status Updates
**Priority: HIGH** | **Estimated Time: 2-3 hours**

**Problem**: Entries show "Extracting..." forever because the UI doesn't poll for updates.

**Tasks**:
- [ ] Add React Query polling to `useEntries` hook with 2-second interval when entries are processing
- [ ] Stop polling when all entries are completed/failed
- [ ] Add optimistic UI updates for better UX
- [ ] Show toast notification when extraction completes

**Files to Modify**:
- `hooks/useEntries.ts` - Add `refetchInterval` based on processing status
- `components/entries/Timeline.tsx` - Add toast notifications
- `package.json` - Add `react-hot-toast` or similar

**Acceptance Criteria**:
- Entry status updates automatically without manual refresh
- UI stops polling when no entries are processing
- User sees notification when extraction completes

---

### PR #2: Entry Detail Page with Extracted Data
**Priority: HIGH** | **Estimated Time: 4-6 hours**

**Goal**: Allow users to view and verify AI-extracted entities and events.

**Tasks**:
- [ ] Create entry detail page at `/entries/[id]`
- [ ] Display raw entry text with highlighted entity mentions
- [ ] Show extracted entities grouped by type (People, Places, etc.)
- [ ] Show extracted events with participants and locations
- [ ] Display sentiment analysis (mood, energy, emotions)
- [ ] Show confidence scores for all extractions
- [ ] Add "Edit" mode for correcting AI mistakes

**Files to Create**:
- `src/app/(auth)/entries/[id]/page.tsx` - Detail page
- `components/entries/EntryDetail.tsx` - Main layout
- `components/entries/HighlightedText.tsx` - Text with entity highlights
- `components/entities/EntityList.tsx` - Grouped entity display
- `components/events/EventList.tsx` - Event cards
- `components/sentiment/SentimentDisplay.tsx` - Mood/energy visualization

**Database Queries Needed**:
- `getEntryWithExtractions(entryId, userId)` - Join entries + mentions + entities + events

**Acceptance Criteria**:
- User can click an entry to see full details
- Entities are highlighted in the original text
- Confidence scores are visible
- All extracted data is displayed clearly

---

### PR #3: Manual Retry & Re-extraction
**Priority: MEDIUM** | **Estimated Time: 2-3 hours**

**Goal**: Allow users to retry failed extractions or re-extract with updated AI.

**Tasks**:
- [ ] Add "Retry" button to failed entries
- [ ] Add "Re-extract" button to completed entries
- [ ] Prevent duplicate parse runs for same entry
- [ ] Show extraction history (all parse runs)

**Files to Modify**:
- `components/entries/Timeline.tsx` - Add retry button
- `components/entries/EntryDetail.tsx` - Add re-extract button
- `lib/db/queries/entries.ts` - Add `retryExtraction()` function

**API Routes**:
- Already exists: `POST /api/entries/[id]/extract`

**Acceptance Criteria**:
- Failed entries can be retried
- Users can re-run extraction on completed entries
- No duplicate simultaneous extractions

---

### PR #4: People Directory
**Priority: HIGH** | **Estimated Time: 6-8 hours**

**Goal**: Browse all people mentioned across all entries.

**Tasks**:
- [ ] Create `/people` page with searchable list
- [ ] Create `/people/[id]` page for person profile
- [ ] Show all entries mentioning this person
- [ ] Display relationship timeline (first mention, last mention, frequency)
- [ ] Add ability to merge duplicate people ("Sarah" vs "Sarah Johnson")
- [ ] Add manual entity creation

**Files to Create**:
- `src/app/(auth)/people/page.tsx` - People directory
- `src/app/(auth)/people/[id]/page.tsx` - Person profile
- `components/people/PeopleGrid.tsx` - Grid/list of people
- `components/people/PersonCard.tsx` - Individual person card
- `components/people/MergeDialog.tsx` - Merge duplicates UI
- `lib/db/queries/people.ts` - People-specific queries

**Database Queries**:
- `getAllPeople(userId)` - Get all person entities
- `getPersonDetails(personId, userId)` - Get person + all mentions
- `mergePeople(sourceId, targetId, userId)` - Merge duplicates

**API Routes to Create**:
- `GET /api/people` - List all people
- `GET /api/people/[id]` - Get person details
- `POST /api/people/[id]/merge` - Merge duplicates

**Acceptance Criteria**:
- User can see all people they've mentioned
- Clicking a person shows all related entries
- Duplicate people can be merged
- Merge is tracked in `entity_merges` table

---

### PR #5: Search (Keyword & Semantic)
**Priority: HIGH** | **Estimated Time: 8-10 hours**

**Goal**: Find entries by keyword or meaning using full-text and vector search.

**Tasks**:
- [ ] Create `/search` page with search bar
- [ ] Implement keyword search (PostgreSQL full-text search)
- [ ] Implement semantic search (pgvector similarity)
- [ ] Generate embeddings for all entries
- [ ] Add search filters (date range, entities, sentiment)
- [ ] Show mixed results (keyword + semantic)
- [ ] Highlight search matches in results

**Files to Create**:
- `src/app/(auth)/search/page.tsx` - Search page
- `components/search/SearchBar.tsx` - Debounced search input
- `components/search/SearchResults.tsx` - Results display
- `components/search/SearchFilters.tsx` - Filter UI
- `lib/db/queries/search.ts` - Search queries
- `lib/ai/generate-embeddings.ts` - Embedding generation

**Database Setup**:
- [ ] Create GIN index on `entries.content` for full-text search
- [ ] Create IVFFLAT index on `entries.embedding` for vector search
- [ ] Add tsvector column to entries table

**Migration Needed**:
```sql
-- Add full-text search
ALTER TABLE entries ADD COLUMN content_tsv tsvector;
CREATE INDEX entries_content_tsv_idx ON entries USING GIN(content_tsv);

-- Add vector search (already has embedding column)
CREATE INDEX entries_embedding_idx ON entries
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

**API Routes to Create**:
- `POST /api/search/keyword` - Full-text search
- `POST /api/search/semantic` - Vector similarity search
- `POST /api/search/combined` - Hybrid search

**Acceptance Criteria**:
- User can search by keywords
- User can search by meaning (semantic)
- Results are ranked by relevance
- Search is fast (<500ms)

---

### PR #6: Entity Resolution & Deduplication
**Priority: MEDIUM** | **Estimated Time: 6-8 hours**

**Goal**: Automatically detect and suggest merging duplicate entities.

**Tasks**:
- [ ] Implement fuzzy string matching (Jaro-Winkler algorithm)
- [ ] Implement embedding-based similarity
- [ ] Create background job to detect duplicates
- [ ] Show "Suggested Merges" in People directory
- [ ] Allow users to confirm/reject suggestions
- [ ] Track merge decisions to improve future suggestions

**Files to Create**:
- `lib/ai/resolution/fuzzy-match.ts` - String similarity
- `lib/ai/resolution/embedding-match.ts` - Vector similarity
- `lib/ai/resolution/entity-resolver.ts` - Main resolution logic
- `components/people/MergeSuggestions.tsx` - UI for suggestions

**Algorithm**:
```typescript
// Two-phase matching:
// 1. Fuzzy string (fast filter): similarity > 0.8
// 2. Embedding similarity (semantic): cosine > 0.85
// Result: High-confidence duplicates
```

**Database Changes**:
- Use existing `entity_merges` table to track decisions
- Store rejected merges to avoid re-suggesting

**Acceptance Criteria**:
- System suggests likely duplicates
- User can confirm or reject
- Confirmed merges update all mentions
- Rejected suggestions aren't shown again

---

### PR #7: Threads Feature
**Priority: MEDIUM** | **Estimated Time: 10-12 hours**

**Goal**: Group related entries into long-running story arcs.

**Tasks**:
- [ ] Create thread creation UI
- [ ] AI-suggested thread connections (similarity-based)
- [ ] Manual thread linking
- [ ] Thread timeline view
- [ ] Thread summary generation

**Files to Create**:
- `src/app/(auth)/threads/page.tsx` - All threads
- `src/app/(auth)/threads/[id]/page.tsx` - Thread detail
- `components/threads/ThreadCard.tsx` - Thread preview
- `components/threads/CreateThreadDialog.tsx` - Create UI
- `lib/db/queries/threads.ts` - Thread queries

**Database Tables (Already Exist)**:
- `threads` - Thread metadata
- `thread_links` - Entry-to-thread connections

**AI Features**:
- Use embedding similarity to suggest related entries
- Generate thread summary from all linked entries

**Acceptance Criteria**:
- User can create threads manually
- System suggests related entries
- Thread shows timeline of connected entries
- AI generates thread summaries

---

### PR #8: Weekly Review & Insights
**Priority: LOW** | **Estimated Time: 8-10 hours**

**Goal**: AI-generated weekly summaries and insights.

**Tasks**:
- [ ] Create background job for weekly summary generation
- [ ] Analyze week's entries for patterns
- [ ] Generate insights (people met, places visited, sentiment trends)
- [ ] Create email digest (optional)
- [ ] Show weekly review page

**Files to Create**:
- `src/app/(auth)/reviews/page.tsx` - All reviews
- `src/app/(auth)/reviews/[week]/page.tsx` - Weekly review detail
- `lib/ai/weekly-summary.ts` - Summary generation
- `components/reviews/WeeklySummary.tsx` - Summary display
- `components/reviews/InsightsChart.tsx` - Visualizations

**AI Prompting**:
```typescript
// Prompt GPT-4o to analyze week's entries and generate:
// - Top people, places, activities
// - Sentiment trend (line chart)
// - Key events
// - Relationship moments
// - Recommendations
```

**Acceptance Criteria**:
- Weekly summaries generated automatically
- User can view past weeks
- Insights include charts and visualizations
- Optional email digest

---

### PR #9: Data Export & Privacy
**Priority: MEDIUM** | **Estimated Time: 4-6 hours**

**Goal**: Allow users to export their data and delete account.

**Tasks**:
- [ ] Export all data as JSON
- [ ] Export as Markdown files (one per entry)
- [ ] Export as PDF (formatted journal)
- [ ] Account deletion with cascade
- [ ] GDPR compliance features

**Files to Create**:
- `src/app/(auth)/settings/export/page.tsx` - Export options
- `lib/export/json.ts` - JSON export
- `lib/export/markdown.ts` - Markdown export
- `lib/export/pdf.ts` - PDF generation
- `src/app/api/export/route.ts` - Export endpoint

**API Routes**:
- `POST /api/export/json` - Download JSON
- `POST /api/export/markdown` - Download ZIP of MD files
- `POST /api/export/pdf` - Download PDF
- `DELETE /api/account` - Delete account

**Acceptance Criteria**:
- User can export in multiple formats
- Export includes all entries, entities, events
- Account deletion removes all data
- Exported data is portable

---

### PR #10: Performance Optimizations
**Priority: MEDIUM** | **Estimated Time: 6-8 hours**

**Goal**: Optimize for scale and speed.

**Tasks**:
- [ ] Add database indexes for common queries
- [ ] Implement cursor-based pagination for timeline
- [ ] Add Redis caching for frequently accessed data
- [ ] Optimize AI extraction (batch processing)
- [ ] Add database query logging and slow query monitoring

**Optimizations**:
```sql
-- Indexes for performance
CREATE INDEX entries_user_id_occurred_at_idx ON entries(user_id, occurred_at DESC);
CREATE INDEX mentions_user_id_entity_id_idx ON mentions(user_id, entity_id);
CREATE INDEX entities_user_id_type_idx ON entities(user_id, entity_type);
CREATE INDEX events_user_id_occurred_at_idx ON events(user_id, occurred_at DESC);
```

**Caching Strategy**:
- Cache user's entity list (invalidate on new entity)
- Cache weekly summaries (generate once, cache 7 days)
- Cache search results (5-minute TTL)

**Acceptance Criteria**:
- Timeline loads <1s for 100+ entries
- Search returns results <500ms
- No N+1 query issues
- Slow queries logged

---

### PR #11: Mobile Responsiveness & PWA
**Priority: MEDIUM** | **Estimated Time: 6-8 hours**

**Goal**: Make app work great on mobile devices.

**Tasks**:
- [ ] Responsive design for all pages
- [ ] Touch-friendly UI elements
- [ ] PWA manifest and service worker
- [ ] Offline support (cache entries)
- [ ] Mobile-optimized timeline

**Files to Modify**:
- All component files - Add responsive Tailwind classes
- `public/manifest.json` - PWA manifest
- `src/app/sw.ts` - Service worker

**Acceptance Criteria**:
- App works on mobile (iOS/Android)
- Can be installed as PWA
- Basic offline functionality
- Touch gestures work smoothly

---

### PR #12: Error Handling & Monitoring
**Priority: HIGH** | **Estimated Time: 4-6 hours**

**Goal**: Production-ready error handling and monitoring.

**Tasks**:
- [ ] Add Sentry for error tracking
- [ ] Add LogRocket for session replay
- [ ] Improve error messages for users
- [ ] Add error boundaries in React
- [ ] Log all API errors with context
- [ ] Add health check endpoint

**Files to Create**:
- `lib/monitoring/sentry.ts` - Sentry setup
- `lib/monitoring/logrocket.ts` - LogRocket setup
- `components/ErrorBoundary.tsx` - React error boundary
- `src/app/api/health/route.ts` - Health check

**API Routes**:
- `GET /api/health` - Health check (DB, OpenAI, etc.)

**Acceptance Criteria**:
- Errors are logged to Sentry
- User sees helpful error messages
- Critical errors trigger alerts
- Health checks pass in production

---

### PR #13: Testing & CI/CD
**Priority: MEDIUM** | **Estimated Time: 8-10 hours**

**Goal**: Comprehensive test coverage and automated deployment.

**Tasks**:
- [ ] Unit tests for AI extraction
- [ ] Integration tests for database queries
- [ ] E2E tests for critical flows (Playwright)
- [ ] Set up GitHub Actions CI/CD
- [ ] Deploy to Vercel with preview deployments

**Test Files to Create**:
- `tests/unit/extraction.test.ts` - AI extraction tests
- `tests/integration/queries.test.ts` - Database query tests
- `tests/e2e/journal-flow.spec.ts` - E2E critical flow
- `.github/workflows/ci.yml` - CI pipeline

**E2E Test Coverage**:
- User sign-up → Create entry → View extraction
- Search entries → Click result → View detail
- Browse people → Click person → See entries
- Create thread → Link entries → View timeline

**Acceptance Criteria**:
- 80%+ code coverage
- E2E tests cover critical flows
- CI runs on every PR
- Deployment is automated

---

## Implementation Priority

### Must Have (MVP Launch):
1. **PR #1** - Fix UI Polling (without this, app feels broken)
2. **PR #2** - Entry Detail Page (core value proposition)
3. **PR #4** - People Directory (key feature)
4. **PR #5** - Search (essential for usability)
5. **PR #12** - Error Handling (production requirement)

### Should Have (Post-MVP):
6. **PR #3** - Manual Retry
7. **PR #6** - Entity Resolution
8. **PR #10** - Performance Optimizations
9. **PR #13** - Testing & CI/CD

### Nice to Have (v1.1+):
10. **PR #7** - Threads
11. **PR #8** - Weekly Reviews
12. **PR #9** - Data Export
13. **PR #11** - Mobile/PWA

---

## Estimated Timeline

**With 2 developers working full-time:**
- Week 1-2: PRs #1-2 (UI fixes + Entry detail)
- Week 3-4: PRs #4-5 (People + Search)
- Week 5: PR #12 (Error handling + monitoring)
- Week 6: PR #13 (Testing + deployment)
- **MVP Launch: 6 weeks**

**Post-MVP (Weeks 7-10):**
- PRs #3, #6, #10 (Refinements + optimization)

**v1.1 (Weeks 11-14):**
- PRs #7, #8, #9, #11 (Advanced features)

---

## Success Metrics

**MVP Launch Ready When:**
- ✅ Entry creation → extraction → display works end-to-end
- ✅ Users can browse people and see all mentions
- ✅ Search returns relevant results
- ✅ Error rate < 1%
- ✅ 95% of extractions complete successfully
- ✅ E2E tests cover critical flows

**Post-Launch Metrics to Track:**
- User retention (week 1 → week 4)
- Average entries per active user per week
- Entity merge rate (quality indicator)
- Search success rate (clicks/searches)
- Time to extraction (< 10s target)

---

## Technical Debt to Address

1. **Current Issues**:
   - Remove verbose console logging from production
   - Clean up test entries and failed extractions from DB
   - Add proper TypeScript types for all API responses
   - Remove unused migration files (combined.sql, COMBINED_ALL.sql)

2. **Future Improvements**:
   - Move from fire-and-forget to proper job queue (Inngest/BullMQ)
   - Add rate limiting for OpenAI API calls
   - Implement retry logic with exponential backoff
   - Add database connection pooling optimization

---

## Notes

- Each PR should be independently deployable
- PRs should include documentation updates
- Follow existing code patterns and conventions
- All database changes require migrations
- All AI features should have manual override options
