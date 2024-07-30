import type { Lexer, Token, TokenType } from './lexer'
import type { LT, StringToNumber } from './utils'

export interface Node {
  type: string
  token: TokenType
}

export interface Statement extends Node { }

export interface Expression extends Node { }

export interface Program<TStatement extends Statement[]> extends Node {
  type: 'Program'
  statements: TStatement
}

export interface LetStatement<TName extends Identifier<any>, TValue extends Expression> extends Statement {
  type: 'LetStatement'
  token: TokenType.LET
  name: TName
  value: TValue
}

export interface ReturnStatement<TValue extends Expression> extends Statement {
  type: 'ReturnStatement'
  token: TokenType.RETURN
  value: TValue
}

export interface ExpressionStatement<TToken extends TokenType, TValue extends Expression> extends Statement {
  type: 'ExpressionStatement'
  token: TToken
  value: TValue
}

export interface BlockStatement<TToken extends TokenType = TokenType, TStatement extends Statement[] = any> extends Statement {
  type: 'BlockStatement'
  token: TToken
  statements: TStatement
}

export interface Identifier<TValue extends string> extends Expression {
  type: 'Identifier'
  token: TokenType.IDENT
  value: TValue
}

export interface IntegerLiteral<TValue extends number> extends Expression {
  type: 'IntegerLiteral'
  token: TokenType.INT
  value: TValue
}

export interface BooleanLiteral<TValue extends boolean> extends Expression {
  type: 'BooleanLiteral'
  token: TValue extends true ? TokenType.TRUE : TokenType.FALSE
  value: TValue
}

export interface PrefixExpression<TToken extends TokenType, TRight extends Expression> extends Expression {
  type: 'PrefixExpression'
  token: TToken
  right: TRight
}

export interface InfixExpression<TToken extends TokenType, TLeft extends Expression, TRight extends Expression> extends Expression {
  type: 'InfixExpression'
  token: TToken
  left: TLeft
  right: TRight
}

export interface IfExpression<TCondition extends Expression, TConsequence, TAlternative extends BlockStatement<any> | undefined> extends Expression {
  type: 'IfExpression'
  token: TokenType.IF
  condition: TCondition
  consequence: TConsequence
  alternative: TAlternative
}

export interface FunctionLiteral<TName extends Identifier<any>, TParameters extends Identifier<any>[], TBody extends BlockStatement<any>> extends Expression {
  type: 'FunctionLiteral'
  token: TokenType.FUNCTION
  name: TName
  parameters: TParameters
  body: TBody
}

export interface CallExpression<TFunction extends Expression, TArguments extends Expression[]> extends Expression {
  type: 'CallExpression'
  token: TokenType.LPAREN
  function: TFunction
  arguments: TArguments
}

type _Parser<TTokens extends Token[], TStatements extends Statement[] = []> = TTokens extends [infer TCur extends Token<any>, ...infer TRest extends Token[]]
  ? ParseStatement<TCur, TRest> extends [infer TStatement extends Statement, infer TRestTokens extends Token<any>[]]
    ? _Parser<TRestTokens, [...TStatements, TStatement]>
    : _Parser<TRest, TStatements>
  : TStatements

type ParseStatement<TToken extends Token, TTokens extends Token[]> = {
  [TokenType.LET]: TTokens extends [infer TNextToken extends Token, ...infer TRest extends Token[]]
    ? ParseLetStatement<TNextToken, TRest> : never
  [TokenType.RETURN]: ParseReturnStatement<TTokens>
  [TokenType.EOF]: never
} extends { [T in TToken['type']]: [infer TStatement, infer TRest] }
  ? [TStatement, TRest]
  : ParseExpressionStatement<TToken, TTokens>

type ParseLetStatement<TToken extends Token, TTokens extends Token[]> = {
  [TokenType.IDENT]: TTokens extends [Token<TokenType.ASSIGN>, ...infer TRest extends Token[]]
    ? ParseExpression2<Priority.LOWEST, TRest> extends [infer TExpression extends Expression, infer TRest2 extends Token[]]
      ? [LetStatement<Identifier<TToken['literal']>, TExpression>, TRest2]
      : never
    : never
} extends { [T in TToken['type']]: [infer TStatement, infer TRest] } ? [TStatement, TRest] : []

type ParseReturnStatement<TTokens extends Token[]> =
ParseExpression2<Priority.LOWEST, TTokens> extends [infer TExpression extends Expression, infer TRest extends Token[]]
  ? [ReturnStatement<TExpression>, TRest]
  : [ReturnStatement<Expression>, TTokens]

type ParseBlockStatement<TToken extends Token, TTokens extends Token[], TStatements extends Statement[]> = {
  [TokenType.RBRACE]: true
  [TokenType.EOF]: true
} extends { [T in TToken['type']]: true }
  ? [
      BlockStatement<TToken['type'], TStatements>,
      TTokens,
    ]
  : ParseStatement<TToken, TTokens> extends [
    infer TStatement extends Statement,
    infer TRest extends Token[],
  ]
    ? ParseBlockStatement2<TRest, [...TStatements, TStatement]>
    : [
        BlockStatement<TToken['type'], TStatements>,
        TTokens,
      ]

type ParseBlockStatement2<TTokens extends Token[], TStatements extends Statement[] = []> = TTokens extends
[
  infer TToken extends Token,
  ...infer TRest extends Token[],
]
  ? ParseBlockStatement<TToken, TRest, TStatements>
  : never

declare enum Priority {
  LOWEST = 1,
  EQUALS = 2, // ==
  LESSGREATER = 3, // > or <
  SUM = 4, // +
  PRODUCT = 5, // *
  PREFIX = 6, // -X or !X
  CALL = 7, // myFunction(X)
  INDEX = 8, // array[index], map[key]
}

interface PriorityMap {
  [TokenType.EQ]: Priority.EQUALS
  [TokenType.NEQ]: Priority.EQUALS
  [TokenType.LT]: Priority.LESSGREATER
  [TokenType.GT]: Priority.LESSGREATER
  [TokenType.PLUS]: Priority.SUM
  [TokenType.MINUS]: Priority.SUM
  [TokenType.SLASH]: Priority.PRODUCT
  [TokenType.ASTERISK]: Priority.PRODUCT
  [TokenType.LPAREN]: Priority.CALL
}

type GetPriority<TToken extends TokenType> = PriorityMap extends { [P in TToken]: infer TPriority extends number } ? TPriority : Priority.LOWEST

type ParseExpressionStatement<TToken extends Token, TTokens extends Token[]> =
ParseExpression<Priority.LOWEST, TToken, TTokens> extends [infer TExpression extends Expression, infer TRest extends Token<any>[]]
  ? [ExpressionStatement<TToken['type'], TExpression>, TRest]
  : []

type ParseExpression<TPriority extends Priority, TToken extends Token, TTokens extends Token[]> =
ParsePrefixParseFn<TToken, TTokens> extends [infer TLeft extends Expression, [infer TNextToken extends Token, ...infer TRest extends Token[]]]
  ? ParseInfixParseLoop<TPriority, TLeft, TNextToken, TRest>
  : never

type ParseInfixParseLoop<TPriority extends Priority, TLeft extends Expression, TToken extends Token, TTokens extends Token[]> =
LT<TPriority, GetPriority<TToken['type']>> extends true
  ? ParseInfixParseFn< TLeft, TToken, TTokens> extends [infer TExpression extends Expression, [infer TNextToken extends Token, ...infer TRest extends Token[]]]
    ? ParseInfixParseLoop<TPriority, TExpression, TNextToken, TRest>
    : [TLeft, [TToken, ...TTokens]]
  : [TLeft, [TToken, ...TTokens]]

type ParseExpression2<TPriority extends Priority, TTokens extends Token[]> = TTokens extends
[infer TToken extends Token, ...infer TRest extends Token[]]
  ? ParseExpression<TPriority, TToken, TRest>
  : never

type ParseIfExpression<TTokens extends Token[]> = TTokens extends [
  Token<TokenType.LPAREN>,
  ...infer TRest extends Token[],
]
  ? ParseExpression2< Priority.LOWEST, TRest> extends
  [
    infer TCondition extends Expression,
    [
      Token<TokenType.RPAREN>,
      Token<TokenType.LBRACE>,
      infer TNextToken extends Token,
      ...infer TRest2 extends Token[],
    ],
  ]
    ? ParseBlockStatement<TNextToken, TRest2, []> extends
    [
      infer TConsequence extends BlockStatement<any>,
      infer TRest3 extends Token[],
    ]
      ? TRest3 extends [
        // 有 else 分支
        Token<TokenType.ELSE>,
        ...infer TRest4 extends Token[],
      ]
        ? TRest4 extends [
          Token<TokenType.LBRACE>,
          infer TNextToken2 extends Token,
          ...infer TRest5 extends Token[],
        ]
          ? ParseBlockStatement<TNextToken2, TRest5, []> extends
          [
            infer TAlternative extends BlockStatement<any>,
            infer TRest6 extends Token[],
          ]
            ?
              [
                IfExpression<TCondition, TConsequence, TAlternative>,
                TRest6,
              ]
            : never
          : never
        : [
            IfExpression<TCondition, TConsequence, undefined>,
            TRest3,
          ]
      : never
    : never
  : never

type ParseFunctionExpression<TTokens extends Token[]> = TTokens extends [
  Token<TokenType.IDENT, infer TName extends string>,
  Token<TokenType.LPAREN>,
  infer TNextToken extends Token,
  ...infer TRest extends Token[],
]
  ? ParseFunctionParameters<TNextToken, TRest, []> extends
  [
    infer TParameters extends Identifier<any>[],
    [
      Token<TokenType.LBRACE>,
      infer TNextToken2 extends Token,
      ...infer TRest2 extends Token[],
    ],
  ]
    ?
    ParseBlockStatement<TNextToken2, TRest2, []> extends
    [
      infer TBody extends BlockStatement<any>,
      infer TRest3 extends Token[],
    ]
      ? [
          FunctionLiteral<Identifier<TName>, TParameters, TBody>,
          TRest3,
        ]
      : never
    : never
  : never

type ParseFunctionParameters<TToken extends Token, TTokens extends Token[], TParameters extends Identifier<any>[]> = {
  [TokenType.IDENT]: TTokens extends [infer TNextToken extends Token, ...infer TRest extends Token[]]
    ? ParseFunctionParameters<TNextToken, TRest, [...TParameters, Identifier<TToken['literal']>]>
    : never
  [TokenType.COMMA]: TTokens extends [infer TNextToken extends Token, ...infer TRest extends Token[]]
    ? ParseFunctionParameters<TNextToken, TRest, TParameters>
    : never
  [TokenType.RPAREN]: [TParameters, TTokens]
} extends { [T in TToken['type']]: [infer TResult extends Identifier<any>[], infer TRest] } ? [TResult, TRest] : []

type ParsePrefixParseFn<TToken extends Token, TTokens extends Token[]> = {
  [TokenType.IDENT]: [Identifier<TToken['literal']>, TTokens]
  [TokenType.INT]: [IntegerLiteral<StringToNumber<TToken['literal']>>, TTokens]
  [TokenType.TRUE]: [BooleanLiteral<true>, TTokens]
  [TokenType.FALSE]: [BooleanLiteral<false>, TTokens]
  [TokenType.BAND]: ParseExpression2<Priority.PREFIX, TTokens> extends [infer TExpression extends Expression, infer TRest]
    ? [PrefixExpression<TokenType.BAND, TExpression>, TRest] : never
  [TokenType.MINUS]: ParseExpression2<Priority.PREFIX, TTokens> extends [infer TExpression extends Expression, infer TRest]
    ? [PrefixExpression<TokenType.MINUS, TExpression>, TRest] : never
  [TokenType.LPAREN]: ParseExpression2<Priority.LOWEST, TTokens> extends [infer TExpression extends Expression, [Token<TokenType.RPAREN>, ...infer TRest]]
    ? [TExpression, TRest] : never
  [TokenType.IF]: ParseIfExpression<TTokens>
  [TokenType.FUNCTION]: ParseFunctionExpression<TTokens>
} extends { [T in TToken['type']]: [infer TExpression extends Expression, infer TRest] } ? [TExpression, TRest] : []

type ParseCallExpression<TLeft extends Expression, TToken extends Token, TTokens extends Token[]> =
ParseCallArguments<TToken, TTokens, []> extends [infer TArguments extends Expression[], infer TRest extends Token[]]
  ? [CallExpression<TLeft, TArguments>, TRest]
  : never

type ParseCallArguments<TToken extends Token, TTokens extends Token[], TArguments extends Expression[]> = {
  [TokenType.COMMA]: TTokens extends [infer TNextToken extends Token, ...infer TRest extends Token[]]
    ? ParseCallArguments<TNextToken, TRest, TArguments>
    : never
  [TokenType.RPAREN]: [TArguments, TTokens]
} extends { [T in TToken['type']]: [infer TResult extends Expression[], infer TRest] }
  ? [TResult, TRest]
  : ParseExpression<Priority.LOWEST, TToken, TTokens> extends [
    infer TArgument extends Expression,
    [infer TNextToken extends Token, ...infer TRest2 extends Token[]],
  ]
    ? ParseCallArguments<TNextToken, TRest2, [...TArguments, TArgument]>
    : []

type ParseInfixParseFn<TLeft extends Expression, TToken extends Token, TTokens extends Token[]> = {
  [TokenType.PLUS]: ParseExpression2<PriorityMap[TokenType.PLUS], TTokens> extends [infer TRight extends Expression, infer TRest extends Token[]]
    ? [InfixExpression<TokenType.PLUS, TLeft, TRight>, TRest]
    : never
  [TokenType.MINUS]: ParseExpression2<PriorityMap[TokenType.MINUS], TTokens> extends [infer TRight extends Expression, infer TRest extends Token[]]
    ? [InfixExpression<TokenType.MINUS, TLeft, TRight>, TRest]
    : never
  [TokenType.SLASH]: ParseExpression2<PriorityMap[TokenType.SLASH], TTokens> extends [infer TRight extends Expression, infer TRest extends Token[]]
    ? [InfixExpression<TokenType.SLASH, TLeft, TRight>, TRest]
    : never
  [TokenType.ASTERISK]: ParseExpression2<PriorityMap[TokenType.ASTERISK], TTokens> extends [infer TRight extends Expression, infer TRest extends Token[]]
    ? [InfixExpression<TokenType.ASTERISK, TLeft, TRight>, TRest]
    : never
  [TokenType.EQ]: ParseExpression2<PriorityMap[TokenType.EQ], TTokens> extends [infer TRight extends Expression, infer TRest extends Token[]]
    ? [InfixExpression<TokenType.EQ, TLeft, TRight>, TRest]
    : never
  [TokenType.NEQ]: ParseExpression2<PriorityMap[TokenType.NEQ], TTokens> extends [infer TRight extends Expression, infer TRest extends Token[]]
    ? [InfixExpression<TokenType.NEQ, TLeft, TRight>, TRest]
    : never
  [TokenType.LT]: ParseExpression2<PriorityMap[TokenType.LT], TTokens> extends [infer TRight extends Expression, infer TRest extends Token[]]
    ? [InfixExpression<TokenType.LT, TLeft, TRight>, TRest]
    : never
  [TokenType.GT]: ParseExpression2<PriorityMap[TokenType.GT], TTokens> extends [infer TRight extends Expression, infer TRest extends Token[]]
    ? [InfixExpression<TokenType.GT, TLeft, TRight>, TRest]
    : never
  [TokenType.LPAREN]: TTokens extends [infer TNextToken extends Token, ...infer TRest extends Token[]]
    ? ParseCallExpression<TLeft, TNextToken, TRest>
    : never
} extends { [T in TToken['type']]: [infer TExpression extends Expression, infer TRest] } ? [TExpression, TRest] : []

export type Parser<TTokens extends Token[]> = Program<_Parser<TTokens>>

type _L1 = Lexer<'1;'>
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
