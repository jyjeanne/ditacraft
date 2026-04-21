## list of keyspace bugs to fix

1. Bug 1 — HIGH (Logic): Wrong followKeyrefChain scope prefix for peer map keys
resolveKey calls followKeyrefChain(peerDef, peerKeySpace.keys, '') for all peer resolutions. When the peer key lives
  inside a named scope (e.g. inner.someKey), the chain follower needs scopePrefix = 'inner' to find inner.nextKey before
   falling back to the unqualified name. Passing '' means any keyref chain within a scoped peer section silently
  resolves against the wrong scope.

2.  Bug 2 — HIGH (Performance): new XMLParser() on every extractKeyDefinitions call
  parseMapElements instantiates a fresh XMLParser on every map file and every inline-scope block. The parser is
  stateless; it should be a class-level singleton.

3.  Bug 3 — MEDIUM (Correctness): extractMetadataFromNode doesn't guard against topicmeta as an array
  When fxp encounters multiple <topicmeta> elements (invalid DITA but parseable), it returns an array. The check typeof
  raw !== 'object' passes for arrays, so the array is cast as Record<string, unknown> and every property access returns
  undefined — silently losing all metadata.

4.  Bug 4 — MEDIUM (Cleanliness): collectXmlElements recurses unnecessarily into XML PI nodes (?xml)
  The ?xml pseudo-key emitted by fxp for the XML declaration is not an element but gets treated as one, causing
  unnecessary object traversal and a spurious entry in the output array.