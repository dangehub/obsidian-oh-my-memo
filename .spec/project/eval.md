---
scenarios:
  - name: location-based-mutation
    description: >
      Records parsed without block IDs (pure Markdown mode, enableBlockIds=false) must be
      editable and toggleable via file-path + lineStart/lineEnd location, without requiring
      a block ID. The repository's updateRecordByLocation and toggleTodoByLocation must
      correctly replace the targeted lines in the file, preserving the record's time, type,
      and multi-line structure on update, and flipping the - [ ] / - [x] marker on toggle.
    expected: >
      A record with id=undefined can be updated (content, type, body changed) and toggled
      (task state flipped) using only its filePath, lineStart, and lineEnd fields. The
      operation does not throw, and the resulting file content reflects the change at the
      correct location.
    tags:
      - backend-api
    code:
      - src/markdown/MarkdownRecordRepository.ts
    test:
      path: tests/MarkdownRecordRepository.test.ts
      name: updates a record without a block ID via location-based fallback
---
Measurement method: automated unit test via vitest. The test drives a FakeVault with known
content, parses records without block IDs, then calls updateRecordByLocation and
toggleTodoByLocation with the parsed record's location fields. The resulting file content
is read back and asserted to contain the changes at the expected line range. Both the
failing and passing readings are filed from the SAME test — the fail reading uses a
before-fix snapshot, the passing reading after the location-based methods are implemented.
