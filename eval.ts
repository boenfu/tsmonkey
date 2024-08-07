import type { Lexer, TokenType } from './lexer'
import type {
  BlockStatement,
  BooleanLiteral,
  CallExpression,
  Expression,
  ExpressionStatement,
  FunctionLiteral,
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
  StringLiteral,
} from './parser'
import type { AND, Divide, EQ, GE, GT, IsTruthy, LE, LT, Minus, Multiply, NEQ, OR, Plus } from './utils'

declare const ReturnTypeTag: symbol

type ReturnValue<T = any> = { value: T } & typeof ReturnTypeTag

interface Context<TVars extends Record<string, any> = any, TParent extends Context | undefined = any> {
  vars: TVars
  parent: TParent
}

type EvalNode<TNode extends Node, TContext extends Context = { vars: {}, parent: undefined }> = {
  Program: TNode extends Program<infer TStatements> ? EvalProgramStatements<TStatements, TContext> : never
  LetStatement: TNode extends LetStatement<infer TName, infer TValue> ? [TValue, TContext & { vars: TContext['vars'] & { [P in TName['value']]: EvalNode<TValue, TContext>[0] } }] : never
  ReturnStatement: TNode extends ReturnStatement<infer TReturnValue> ? EvalNode<TReturnValue, TContext> extends [infer TValue, infer TContext2] ? [ ReturnValue<TValue>, TContext2 ] : never : never
  ExpressionStatement: TNode extends ExpressionStatement<any, infer TExpression> ? EvalNode<TExpression, TContext> : never
  BlockStatement: TNode extends BlockStatement<any, infer TStatements> ? EvalStatements<TStatements, TContext> : never
  Identifier: [EvalIdentifier<TNode, TContext>, TContext]
  IntegerLiteral: TNode extends IntegerLiteral<infer TValue> ? [TValue, TContext] : never
  StringLiteral: TNode extends StringLiteral<infer TValue> ? [TValue, TContext] : never
  BooleanLiteral: TNode extends BooleanLiteral<infer TValue> ? [TValue, TContext] : never
  PrefixExpression: TNode extends PrefixExpression<infer TPrefix, infer TRight> ? EvalPrefixExpression<TPrefix, EvalNode<TRight, TContext>[0], TContext> : never
  InfixExpression: TNode extends InfixExpression<infer TInfixTokenType, infer TLeft, infer TRight> ? EvalInfixExpression<TInfixTokenType, EvalNode<TLeft, TContext>[0], EvalNode<TRight, TContext>[0], TContext> : never
  IfExpression: TNode extends IfExpression<infer TCondition, infer TConsequence extends Node, infer TAlternative extends BlockStatement | undefined>
    ? IsTruthy<EvalNode<TCondition, TContext>[0]> extends true
      ? EvalNode<TConsequence, TContext>
      : TAlternative extends Node ? EvalNode<TAlternative, TContext> : [void, TContext]
    : never
  FunctionLiteral: TNode extends FunctionLiteral<infer TName, infer TParameters, infer TBody>
    ? [TName, TContext & { vars: TContext['vars'] & { [P in TName['value']]: FunctionLiteral<TName, TParameters, TBody> } }] : never
  CallExpression: TNode extends CallExpression<infer TFunction, infer TArguments>
    ? EvalNode<TFunction, TContext>[0] extends FunctionLiteral<any, infer TParameters, infer TBody>
      ? [EvalReturnValue<EvalNode<TBody, EvalFunctionContext<TParameters, TArguments, { vars: {}, parent: TContext }>>[0]>, TContext]
      : never
    : never
} extends { [T in TNode['type']]: infer TR extends [any, Context] } ? TR : never

type EvalFunctionContext<TParameters extends Identifier<any>[], TArguments extends Expression[], TContext extends Context> =
TParameters extends [Identifier<infer TParameter>, ...infer TRestParameters extends Identifier<any>[]]
  ? TArguments extends [infer TArgument extends Node, ...infer TRestArguments extends Expression[]]
    ? EvalFunctionContext<TRestParameters, TRestArguments, TContext & { vars: TContext['vars'] & { [P in TParameter]: EvalNode<TArgument, TContext['parent']>[0] } }>
    : never
  : TContext

type EvalReturnValue<TValue> = TValue extends ReturnValue<infer TReturnValue> ? TReturnValue : TValue

type EvalIdentifier<TIdentifier extends Node, TContext extends Context> = TIdentifier extends Identifier<infer TName>
  ? TName extends keyof TContext['vars']
    ? TContext['vars'][TName]
    : TContext['parent'] extends undefined
      ? undefined
      : EvalIdentifier<TIdentifier, TContext['parent']>
  : never

type EvalProgramStatements<TStatements extends Statement[], TContext extends Context> = TStatements extends [
  infer TStatement extends Statement,
  ...infer TRest extends Statement[],
]
  ? EvalNode<TStatement, TContext> extends [infer TResult, infer TContext2 extends Context]
    ? OR<EQ<TRest['length'], 0>, TResult extends ReturnValue ? true : false> extends true
      ? [EvalReturnValue<TResult>, TContext2]
      : EvalProgramStatements<TRest, TContext2>
    : never
  : undefined

type EvalStatements<TStatements extends Statement[], TContext extends Context> = TStatements extends [
  infer TStatement extends Statement,
  ...infer TRest extends Statement[],
]
  ? EvalNode<TStatement, TContext> extends [infer TResult, infer TContext2 extends Context]
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
  [TokenType.LE]: LE<TLeft & number, TRight & number>
  [TokenType.GE]: GE<TLeft & number, TRight & number>
  [TokenType.AND]: AND<TLeft, TRight>
  [TokenType.OR]: OR<TLeft, TRight>
  [TokenType.LPAREN]: never
} extends { [T in TInfixTokenType]: infer TR } ? [TR, TContext] : never

export type Eval<T extends string> = EvalNode<Parser<Lexer<T>>>[0]
