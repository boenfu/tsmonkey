import type { Lexer, TokenType } from './lexer'
import type {
  BlockStatement,
  BooleanLiteral,
  ExpressionStatement,
  IfExpression,
  InfixExpression,
  IntegerLiteral,
  Node,
  Parser,
  PrefixExpression,
  Program,
  ReturnStatement,
  Statement,
} from './parser'
import type { Divide, EQ, GT, IsTruthy, LT, Minus, Multiply, NEQ, OR, Plus } from './utils'

type ReturnValue<T = any> = { value: T } & '_returnValue'

export type Eval<TNode extends Node> = {
  Program: TNode extends Program<infer TStatements> ? EvalProgramStatements<TStatements> : never
  LetStatement: 1
  ReturnStatement: TNode extends ReturnStatement<infer TReturnValue> ? Eval<TReturnValue> : never
  ExpressionStatement: TNode extends ExpressionStatement<any, infer TExpression> ? Eval<TExpression> : never
  BlockStatement: TNode extends BlockStatement<any, infer TStatements> ? EvalStatements<TStatements> : never
  Identifier: 4
  IntegerLiteral: TNode extends IntegerLiteral<infer TValue> ? TValue : never
  BooleanLiteral: TNode extends BooleanLiteral<infer TValue> ? TValue : never
  PrefixExpression: TNode extends PrefixExpression<infer TPrefix, infer TRight> ? EvalPrefixExpression<TPrefix, Eval<TRight>> : never
  InfixExpression: TNode extends InfixExpression<infer TInfixTokenType, infer TLeft, infer TRight> ? EvalInfixExpression<TInfixTokenType, Eval<TLeft>, Eval<TRight>> : never
  IfExpression: TNode extends IfExpression<infer TCondition, infer TConsequence extends Node, infer TAlternative extends BlockStatement | undefined>
    ? IsTruthy<Eval<TCondition>> extends true
      ? Eval<TConsequence>
      : TAlternative extends Node ? Eval<TAlternative> : undefined
    : never
  FunctionLiteral: 9
  CallExpression: 10
} extends { [T in TNode['type']]: infer TR } ? TR : never

type EvalProgramStatements<TStatements extends Statement[]> = TStatements extends [
  infer TStatement extends Statement,
  ...infer TRest extends Statement[],
]
  ? Eval<TStatement> extends infer TResult
    ? OR<OR<EQ<TRest['length'], 0>, TResult extends ReturnValue ? true : false>, TResult extends ReturnValue ? true : false> extends true
      ? TResult extends ReturnValue<infer TReturnValue> ? TReturnValue : TResult
      : EvalProgramStatements<TRest>
    : never
  : undefined

type EvalStatements<TStatements extends Statement[]> = TStatements extends [
  infer TStatement extends Statement,
  ...infer TRest extends Statement[],
]
  ? Eval<TStatement> extends infer TResult
    ? OR<OR<EQ<TRest['length'], 0>, TResult extends ReturnValue ? true : false>, TResult extends ReturnValue ? true : false> extends true
      ? TResult extends ReturnValue ? TResult : ReturnValue<TResult>
      : EvalStatements<TRest>
    : never
  : undefined

type EvalPrefixExpression<TPrefixTokenType extends TokenType, TValue> = {
  [TokenType.BAND]: IsTruthy<TValue> extends true ? false : true
} extends { [T in TPrefixTokenType]: infer TR } ? TR : never

type EvalInfixExpression<TInfixTokenType extends TokenType, TLeft, TRight> = {
  [TokenType.PLUS]: Plus<TLeft & number, TRight & number>
  [TokenType.MINUS]: Minus<TLeft & number, TRight & number>
  [TokenType.SLASH]: Divide<TLeft & number, TRight & number>
  [TokenType.ASTERISK]: Multiply<TLeft & number, TRight & number>
  [TokenType.EQ]: EQ<TLeft, TRight>
  [TokenType.NEQ]: NEQ<TLeft, TRight>
  [TokenType.LT]: LT<TLeft & number, TRight & number>
  [TokenType.GT]: GT<TLeft & number, TRight & number>
  [TokenType.LPAREN]: never
} extends { [T in TInfixTokenType]: infer TR } ? TR : never

type _E1 = Eval<Parser<Lexer<'a + b'>>>
type _E2 = Eval<Parser<Lexer<'!!!!!!!!!0'>>>
type _E3 = Eval<Parser<Lexer<'(3 + 2) * 5 == 25'>>>
type _E4 = Eval<Parser<Lexer<'(3 > 2) != (2 > 3)'>>>
type _E5 = Eval<Parser<Lexer<`if (4 > 4) {
  4 + 8
  3 * 3
} else {
  9 + 9
}`>>>
type _E6 = Eval<Parser<Lexer<`
3 * 3
return 4 * 4
5 * 5
`>>>

type _E7 = Eval<Parser<Lexer<`
if (4 > 2) {
  if (4 > 3) {
    return 1
  }
  
  return 2
}
`>>>
