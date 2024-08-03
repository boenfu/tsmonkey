## 🐒 TSMonkey

```bash
npm install @boenfu/tsmonkey
```

### Eval
```typescript
import type { Eval } from '@boenfu/tsmonkey'

Eval<'4 + 8'> // 12
Eval<'2 * (4 + 8)'> // 24
Eval<'!99'> // false

Eval<'(3 + 2) * 5 == 25'> // true
Eval<'(3 > 2) != (2 > 3)'> // true

Eval<'7 && 9'> // 9
Eval<'false || 0'> // 0
```

variable declaration
```typescript
Eval<`
let a = 2
let b = 3
let c = a * b
c * c
`> // 36
```

if else
```typescript
Eval<`
let a = 2
let b = 3

if(a >= b) {
  return "a is greater than b"
} else {
  return "a is less than b"
}
`> // "a is less than b"
```

function
```typescript
Eval<`
let a = 5
let b = 10

function foo(a, b) {
  return a - b
}

foo(b, a)
`> // 5
```

fibonacci
```typescript
Eval<`
function fibonacci(n) {
  if (n < 2) { return 0 }
  if (n == 2) { return 1 }

  return fibonacci(n-1) + fibonacci(n - 2)
}

fibonacci(6)
`> // 5
```
### Parser
```typescript
import type { Parser } from '@boenfu/tsmonkey'
Parser<'let a = "如果你要写年"'>
// Program<[LetStatement<Identifier<"a">, StringLiteral<"如果你要写年">>]>
```

### Lexer
```typescript
import type { Lexer } from '@boenfu/tsmonkey'
Lexer<'let a = "如果你要写年"'>
// [
//   Token<TokenType.LET, "let">,
//   Token<TokenType.IDENT, "a">,
//   Token<TokenType.ASSIGN, "=">,
//   Token<TokenType.STRING, "如果你要写年">,
//   Token<TokenType.EOF, "">
// ]
```

<a href="https://weread.qq.com/web/bookDetail/74d32120813ab6de0g019b0e" target="_blank"><img src="https://cdn.weread.qq.com/web/wrweb-next/_nuxt/img_logo.Egsq9YBR.png" height="18" /></a>
