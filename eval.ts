import type { Lexer, TokenType } from './lexer'
import type {
  BlockStatement,
  BooleanLiteral,
  ExpressionStatement,
  Identifier,
  IfExpression,
  InfixExpression,
  IntegerLiteral,
  LetStatement,
  Node,
  Parser,
  PrefixExpression,
  Program,
  ReturnStatement,
  Statement,
} from './parser'
import type { Divide, EQ, GT, IsTruthy, LT, Minus, Multiply, NEQ, OR, Plus } from './utils'

type ReturnValue<T = any> = { value: T } & '_returnValue'

interface Context<TVars extends Record<string, any> = any, TParent extends Context | undefined = undefined> {
  vars: TVars
  parent: TParent
}

// eslint-disable-next-line ts/no-empty-object-type
export type Eval<TNode extends Node, TContext extends Context = { vars: {}, parent: undefined }> = {
  Program: TNode extends Program<infer TStatements> ? EvalProgramStatements<TStatements, TContext> : never
  LetStatement: TNode extends LetStatement<infer TName, infer TValue> ? [TValue, TContext & { vars: TContext['vars'] & { [P in TName['value']]: Eval<TValue, TContext>[0] } }] : never
  ReturnStatement: TNode extends ReturnStatement<infer TReturnValue> ? Eval<TReturnValue, TContext> extends [infer TValue, infer TContext2] ? [ ReturnValue<TValue>, TContext2 ] : never : never
  ExpressionStatement: TNode extends ExpressionStatement<any, infer TExpression> ? Eval<TExpression, TContext> : never
  BlockStatement: TNode extends BlockStatement<any, infer TStatements> ? EvalStatements<TStatements, TContext> : never
  Identifier: TNode extends Identifier<infer TName> ? [Extract<TContext['vars'], { [P in TName]: any }>[TName], TContext] : never
  IntegerLiteral: TNode extends IntegerLiteral<infer TValue> ? [TValue, TContext] : never
  BooleanLiteral: TNode extends BooleanLiteral<infer TValue> ? [TValue, TContext] : never
  PrefixExpression: TNode extends PrefixExpression<infer TPrefix, infer TRight> ? EvalPrefixExpression<TPrefix, Eval<TRight, TContext>[0], TContext> : never
  InfixExpression: TNode extends InfixExpression<infer TInfixTokenType, infer TLeft, infer TRight> ? EvalInfixExpression<TInfixTokenType, Eval<TLeft, TContext>[0], Eval<TRight, TContext>[0], TContext> : never
  IfExpression: TNode extends IfExpression<infer TCondition, infer TConsequence extends Node, infer TAlternative extends BlockStatement | undefined>
    ? IsTruthy<Eval<TCondition, TContext>[0]> extends true
      ? Eval<TConsequence, TContext>
      : TAlternative extends Node ? Eval<TAlternative, TContext> : undefined
    : never
  FunctionLiteral: 9
  CallExpression: 10
} extends { [T in TNode['type']]: infer TR extends [any, Context] } ? TR : never

type EvalProgramStatements<TStatements extends Statement[], TContext extends Context> = TStatements extends [
  infer TStatement extends Statement,
  ...infer TRest extends Statement[],
]
  ? Eval<TStatement, TContext> extends [infer TResult, infer TContext2 extends Context]
    ? OR<EQ<TRest['length'], 0>, TResult extends ReturnValue ? true : false> extends true
      ? TResult extends ReturnValue<infer TReturnValue> ? [TReturnValue, TContext2] : [TResult, TContext2]
      : EvalProgramStatements<TRest, TContext2>
    : never
  : undefined

type EvalStatements<TStatements extends Statement[], TContext extends Context> = TStatements extends [
  infer TStatement extends Statement,
  ...infer TRest extends Statement[],
]
  ? Eval<TStatement, TContext> extends [infer TResult, infer TContext2 extends Context]
    ? TResult extends ReturnValue ? [TResult, TContext2] : EvalStatements<TRest, TContext2>
    : EvalStatements<TRest, TContext>
  : [void, TContext]

type EvalPrefixExpression<TPrefixTokenType extends TokenType, TValue, TContext extends Context> = {
  [TokenType.BAND]: IsTruthy<TValue> extends true ? false : true
} extends { [T in TPrefixTokenType]: infer TR } ? [TR, TContext] : never

type EvalInfixExpression<TInfixTokenType extends TokenType, TLeft, TRight, TContext extends Context> = {
  [TokenType.PLUS]: Plus<TLeft & number, TRight & number>
  [TokenType.MINUS]: Minus<TLeft & number, TRight & number>
  [TokenType.SLASH]: Divide<TLeft & number, TRight & number>
  [TokenType.ASTERISK]: Multiply<TLeft & number, TRight & number>
  [TokenType.EQ]: EQ<TLeft, TRight>
  [TokenType.NEQ]: NEQ<TLeft, TRight>
  [TokenType.LT]: LT<TLeft & number, TRight & number>
  [TokenType.GT]: GT<TLeft & number, TRight & number>
  [TokenType.LPAREN]: never
} extends { [T in TInfixTokenType]: infer TR } ? [TR, TContext] : never

type REPL<T extends string> = Eval<Parser<Lexer<T>>>[0]

type _E1 = REPL<'a + b'>
type _E2 = REPL<'!!!!!!!!0'>
type _E3 = REPL<'(3 + 2) * 5 == 25'>
type _E4 = REPL<'(3 > 2) != (2 > 3)'>
type _E5 = REPL<`if (4 > 4) {
  4 + 8
  3 * 3
} else {
  9 + 9
}`>
type _E6 = REPL<`
3 * 3
return 4 * 4
5 * 5
`>

type _E7 = REPL<`
if (4 > 2) {
  if (4 < 3) {
    return 4
  }
  
  return 2
}
`>

type _E8 = REPL<`
let a = 27

if(a < 5) {
  return a
} else {
 3
}

a * a
`>
