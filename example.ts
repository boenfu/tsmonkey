import type { Eval, Expression, Lexer, Parser, Program } from './index'

type _L1 = Lexer<`
let a = 8

if (a != b) {
  a = 10
}`>

type _L2 = Lexer<`
let a = "如果你要写年"
`>

type _L3 = Lexer<'1;'>

type _P1 = Parser<Lexer<'let a = 1; return a;a'>>
type _P2 = Parser<Lexer<'18;99'>>
type _P3 = Parser<Lexer<'-18'>>
type _P4 = Parser<Lexer<'!18'>>

type _P5 = Parser<Lexer<'a + b + c'>>
type _P5N = PN<Parser<Lexer<'a / b * c'>>, 0>

type _P6 = Parser<Lexer<'tre false true'>>

type _P7 = PN<Parser<Lexer<'(a + 1) * 2'>>, 0>

type _P8 = PN<Parser<Lexer<`
a + 1
if(a * b) {
  a + b
} else {
 a / b
}

8 + 8

`>>, 1>

type _P9 = PN<Parser<Lexer<`
a + 1
function(a, b) {
  a + b
}

8 + 8
`>>, 1>

type _P10 = PN<Parser<Lexer<`function(b, c){}(b, c);`>>, 0>

type _P11 = PN<Parser<Lexer<`let a = 1`>>, 0>
type _P12 = PN<Parser<Lexer<`return 8 + 9`>>, 0>

type PN<TP extends Program<any>, N extends number> = TP extends Program<infer TStatements> ? TStatements[N] : never

export interface Debug<V> extends Expression {
  v: V
}

type _E1 = Eval<'a + b'>
type _E2 = Eval<'!!!!!!!!0'>
type _E3 = Eval<'(3 + 2) * 5 == 25'>
type _E4 = Eval<'(3 > 2) != (2 > 3)'>
type _E5 = Eval<`if (4 > 4) {
  4 + 8
  3 * 3
} else {
  9 + 9
}`>
type _E6 = Eval<`
3 * 3
return 4 * 4
5 * 5
`>

type _E7 = Eval<`
if (4 > 2) {
  if (4 < 3) {
    return 4
  }
  
  return 2
}
`>

type _E8 = Eval<`
let a = 27

if(a < 5) {
  return a
} else {
 3
}

a * a
`>

type _E9 = Eval<`
let a = 5
let b = 10

function foo(a, b) {
  return a - b
}

foo(b, a)
`>

type _E10 = Eval<`
let a = "玛咖巴卡"

return a
`>

type Fibonacci_5 = Eval<`
function fibonacci(n) {
  if (n < 2) { return 0 } 
  if (n == 2) { return 1 }

  return fibonacci(n - 1) + fibonacci(n - 2)
}

fibonacci(5)
`>

type Fibonacci_6 = Eval<`
function fibonacci(n) {
  if (n < 2) { return 0 } 
  if (n == 2) { return 1 }

  return fibonacci(n - 1) + fibonacci(n - 2)
}

fibonacci(6)
`>

type LGE_7 = Eval<`
if(5 >= 14) {
  return 6 
} else {
  if(8 <= 9) {
    return 7
  } else {
    return 0
  }
}
`>

type AND_OR_false = Eval<`
if(5 && 0) {
  return 6 
} else {
  if(false || 12) {
    return false
  } else {
    return 0
  }
}
`>

type AND_OR_2 = Eval<`
if(5 && (0 || 8) && false) {
  return 6 
} else {
  if(false || (12 && 8)) {
    return false
  } else {
    return 0
  }
}
`>
