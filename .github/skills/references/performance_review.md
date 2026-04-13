# Performance Review Heuristics

## Focus areas
- Latency-sensitive user journeys
- Throughput and concurrency assumptions
- Data growth and storage pressure
- Expensive reads, writes, joins, and aggregations
- Fan-out communication across services
- Queue, batch, and retry behavior

## Common risks
- N+1 queries or repetitive remote calls
- Unbounded scans, loops, or payload sizes
- Synchronous processing of work that should be asynchronous
- Shared hot rows, locks, or contention points
- No caching strategy for repeated expensive reads
- No backpressure, rate limiting, or load-shedding plan

## Review questions
- Which flows need explicit latency targets?
- What grows with number of users, tenants, or records?
- What happens during spikes or retries?
- Where can a single slow dependency degrade the whole flow?
- What acceptance criteria prove the design is fast enough?
