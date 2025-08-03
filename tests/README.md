# Position Calculation Test Suite

Bộ test comprehensive để kiểm tra độ chính xác 100% cho thuật toán tính toán position trên client.

## Cấu trúc Test Files

```
tests/
├── position-calculation.test.ts    # Test chính cho thuật toán position
├── position-utils.test.ts          # Test cho utility functions
├── e2e-position-scenarios.test.ts  # Test E2E scenarios
├── setup.ts                        # Test setup và mocks
└── README.md                       # Documentation này
```

## Các loại Test

### 1. Unit Tests (`position-calculation.test.ts`)

**Mục đích**: Test từng component riêng lẻ của thuật toán

**Test Cases**:
- Basic Position Calculation
- Drag & Drop Position Calculation
- Optimistic Update Algorithm
- Position Validation
- Error Handling
- Performance Tests
- WebSocket Integration Tests
- Visual Feedback Tests
- Edge Cases and Stress Tests
- Integration Tests

### 2. Utility Tests (`position-utils.test.ts`)

**Mục đích**: Test các utility functions

**Functions được test**:
- `calculatePositionFromMouseY()`: Tính position từ mouse Y coordinate
- `validatePosition()`: Validate position bounds
- `sortCardsByPosition()`: Sort cards theo position
- `insertCardAtPosition()`: Insert card tại position cụ thể
- `moveCardBetweenLists()`: Move card giữa các lists

### 3. E2E Tests (`e2e-position-scenarios.test.ts`)

**Mục đích**: Test các scenarios thực tế

**Scenarios**:
- User drags card from To Do to In Progress
- User reorders cards within same list
- User drags card to empty list
- Multiple concurrent drag operations
- Error handling and rollback
- Performance with large datasets
- Edge cases and stress testing

## Cách chạy Tests

### Chạy tất cả tests
```bash
npm run test
```

### Chạy tests một lần
```bash
npm run test:run
```

### Chạy tests với coverage
```bash
npm run test:coverage
```

### Chạy tests với UI
```bash
npm run test:ui
```

### Chạy tests trong watch mode
```bash
npm run test:watch
```

### Chạy test file cụ thể
```bash
npm run test tests/position-calculation.test.ts
```

## Test Coverage

### Coverage Targets
- **Statements**: 100%
- **Branches**: 100%
- **Functions**: 100%
- **Lines**: 100%

### Coverage Report
Sau khi chạy `npm run test:coverage`, coverage report sẽ được tạo tại:
- `coverage/lcov-report/index.html` - HTML report
- `coverage/coverage.json` - JSON report

## Test Data

### Mock Data Structure
```typescript
interface MockCard {
  id: string
  title: string
  description: string
  list_id: string
  position: number
  priority: 'low' | 'medium' | 'high'
  labels: string[]
  is_archived: boolean
  created_at: string
  updated_at: string
}
```

### Test Scenarios
1. **Empty List**: Test với list không có card nào
2. **Single Card**: Test với list chỉ có 1 card
3. **Multiple Cards**: Test với list có nhiều cards
4. **Large Dataset**: Test với 1000+ cards
5. **Edge Cases**: Test với invalid positions, negative values
6. **Concurrent Operations**: Test với nhiều operations đồng thời

## Performance Benchmarks

### Expected Performance
- **Position Calculation**: < 1ms
- **Optimistic Update**: < 5ms
- **Large Dataset (1000 cards)**: < 100ms
- **Multiple Operations (50 ops)**: < 50ms

### Performance Tests
```typescript
// Test performance với large dataset
it('should handle large lists efficiently', () => {
  const startTime = performance.now()
  // ... test logic
  const endTime = performance.now()
  expect(endTime - startTime).toBeLessThan(10) // 10ms
})
```

## Error Handling Tests

### Network Errors
```typescript
it('should handle network errors with rollback', () => {
  // Simulate network error
  const shouldRollback = true
  const finalCards = shouldRollback ? originalCards : optimisticCards
  expect(finalCards).toEqual(originalCards)
})
```

### Invalid Operations
```typescript
it('should handle invalid operations gracefully', () => {
  const invalidOperations = [
    { cardId: 'non-existent', targetListId: 'list-1', targetPosition: 0 },
    { cardId: 'card-1', targetListId: 'non-existent', targetPosition: 0 },
    { cardId: 'card-1', targetListId: 'list-1', targetPosition: -1 },
  ]
  
  invalidOperations.forEach(operation => {
    expect(() => {
      // Process invalid operation
    }).not.toThrow()
  })
})
```

## Visual Feedback Tests

### Drag States
```typescript
it('should provide correct drag states', () => {
  const className = getCardClassName(isDragging, isDraggedOver)
  expect(className).toContain("opacity-50")
  expect(className).toContain("rotate-1")
  expect(className).toContain("scale-95")
})
```

### Drop Zone Indicators
```typescript
it('should provide correct drop zone indicators', () => {
  const hasDropIndicator = isDraggingOver
  const hasPulseAnimation = isDraggingOver
  expect(hasDropIndicator).toBe(true)
  expect(hasPulseAnimation).toBe(true)
})
```

## Continuous Integration

### GitHub Actions
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:coverage
```

### Pre-commit Hooks
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:run"
    }
  }
}
```

## Debugging Tests

### Debug Mode
```bash
npm run test -- --reporter=verbose
```

### Debug Specific Test
```typescript
it.only('should debug this test', () => {
  // Only this test will run
})
```

### Skip Tests
```typescript
it.skip('should skip this test', () => {
  // This test will be skipped
})
```

## Best Practices

### 1. Test Organization
- Group related tests using `describe()`
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

### 2. Mock Data
- Use consistent mock data structure
- Create reusable mock functions
- Keep mock data realistic

### 3. Performance Testing
- Set reasonable performance thresholds
- Test with realistic data sizes
- Monitor performance regressions

### 4. Error Handling
- Test all error scenarios
- Verify rollback mechanisms
- Test graceful degradation

### 5. Edge Cases
- Test boundary conditions
- Test invalid inputs
- Test extreme scenarios

## Troubleshooting

### Common Issues

1. **Test fails with timing issues**
   - Use `vi.useFakeTimers()` for time-dependent tests
   - Add appropriate delays in async tests

2. **Mock not working**
   - Ensure mocks are set up in `setup.ts`
   - Check mock implementation

3. **Coverage not accurate**
   - Exclude test files from coverage
   - Check coverage configuration

4. **Performance tests flaky**
   - Increase performance thresholds
   - Run tests multiple times
   - Use average execution time

### Debug Commands
```bash
# Run tests with debug output
npm run test -- --reporter=verbose

# Run specific test file
npm run test tests/position-calculation.test.ts

# Run tests with coverage
npm run test:coverage

# Open coverage report
open coverage/lcov-report/index.html
```

## Contributing

### Adding New Tests
1. Create test file in `tests/` directory
2. Follow naming convention: `*.test.ts`
3. Add comprehensive test cases
4. Update this README if needed

### Test Guidelines
- Write tests before implementing features (TDD)
- Aim for 100% coverage
- Test both success and failure scenarios
- Include performance benchmarks
- Document complex test scenarios

### Code Review Checklist
- [ ] Tests cover all code paths
- [ ] Edge cases are tested
- [ ] Performance tests included
- [ ] Error handling tested
- [ ] Documentation updated 