import type { Lexer, Token, TokenType } from './lexer'
import type { LT, StringToNumber } from './utils'

interface Node {
  token: TokenType
}

interface Statement extends Node { }

interface Expression extends Node { }

interface Program<TStatement extends Statement[]> extends Node {
  statements: TStatement
}

interface LetStatement<TName extends Identifier<any>, TValue extends Expression> extends Statement {
  token: TokenType.LET
  name: TName
  value: TValue
}

interface ReturnStatement<TValue extends Expression> extends Statement {
  token: TokenType.RETURN
  value: TValue
}

interface ExpressionStatement<TToken extends TokenType, TValue extends Expression> extends Statement {
  token: TToken
  value: TValue
}

interface BlockStatement<TToken extends TokenType, TStatement extends Statement[]> extends Statement {
  token: TToken
  statements: TStatement
}

interface Identifier<TValue> extends Expression {
  token: TokenType.IDENT
  value: TValue
}

interface IntegerLiteral<TValue extends number> extends Expression {
  token: TokenType.INT
  value: TValue
}

interface BooleanLiteral<TValue extends boolean> extends Expression {
  token: TValue extends true ? TokenType.TRUE : TokenType.FALSE
  value: TValue
}

interface PrefixExpression<TToken extends TokenType, TRight extends Expression> extends Expression {
  token: TToken
  right: TRight
}

interface InfixExpression<TToken extends TokenType, TLeft extends Expression, TRight extends Expression> extends Expression {
  token: TToken
  left: TLeft
  right: TRight
}

interface IfExpression<TCondition extends Expression, TConsequence, TAlternative extends BlockStatement<any, any> | undefined> extends Expression {
  token: TokenType.IF
  condition: TCondition
  consequence: TConsequence
  alternative: TAlternative
}

type _Parser<TTokens extends Token<TokenType, any>[], TStatements extends Statement[] = []> = TTokens extends [infer TCur extends Token<any, any>, ...infer TRest extends Token<TokenType, any>[]]
  ? ParseStatement<TCur, TRest> extends [infer TStatement extends Statement, infer TRestTokens extends Token<any, any>[]] ? _Parser<TRestTokens, [...TStatements, TStatement]> : _Parser<TRest, TStatements>
  : TStatements

type ParseStatement<TToken extends Token<TokenType, any>, TTokens extends Token<TokenType, any>[]> = {
  [TokenType.LET]: TTokens extends [infer TNextToken extends Token<TokenType, any>, ...infer TRest extends Token<TokenType, any>[]]
    ? ParseLetStatement<TNextToken, TRest> : never
  [TokenType.RETURN]: TTokens extends [infer TNextToken extends Token<TokenType, any>, ...infer TRest extends Token<TokenType, any>[]]
    ? ParseReturnStatement<TNextToken, TRest> : never
} extends { [T in TToken['type']]: [infer TStatement, infer TRest] }
  ? [TStatement, TRest]
  : ParseExpressionStatement<TToken, TTokens>

type ParseLetStatement<TToken extends Token<TokenType, any>, TTokens extends Token<TokenType, any>[]> = {
  [TokenType.IDENT]: TTokens extends [Token<TokenType.ASSIGN, any>, ...infer TRest extends Token<TokenType, any>[]]
    ? [LetStatement<Identifier<TToken['literal']>, Expression>, TRest] : never
} extends { [T in TToken['type']]: [infer TStatement, infer TRest] } ? [TStatement, TRest] : []

type ParseReturnStatement<TToken extends Token<TokenType, any>, TTokens extends Token<TokenType, any>[]> = {
  [TokenType.IDENT]: []
} extends { [T in TToken['type']]: [infer TStatement, infer TRest] } ? [TStatement, TRest] : [ReturnStatement<Expression>, TTokens]

type ParseBlockStatement<TToken extends Token<TokenType, any>, TTokens extends Token<TokenType, any>[], TStatements extends Statement[]> = {
  [TokenType.RBRACE]: true
  [TokenType.EOF]: true
} extends { [T in TToken['type']]: true }
  ? [
      BlockStatement<TToken['type'], TStatements>,
      TTokens,
    ]
  : ParseStatement<TToken, TTokens> extends [
    infer TStatement extends Statement,
    infer TRest extends Token<TokenType, any>[],
  ]
    ? ParseBlockStatement2<TRest, [...TStatements, TStatement]>
    : [
        BlockStatement<TToken['type'], TStatements>,
        TTokens,
      ]

type ParseBlockStatement2<TTokens extends Token<TokenType, any>[], TStatements extends Statement[] = []> = TTokens extends
[
  infer TToken extends Token<TokenType, any>,
  ...infer TRest extends Token<TokenType, any>[],
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

interface Precedences {
  [TokenType.EQ]: Priority.EQUALS
  [TokenType.NEQ]: Priority.EQUALS
  [TokenType.LT]: Priority.LESSGREATER
  [TokenType.GT]: Priority.LESSGREATER
  [TokenType.PLUS]: Priority.SUM
  [TokenType.MINUS]: Priority.SUM
  [TokenType.SLASH]: Priority.PRODUCT
  [TokenType.ASTERISK]: Priority.PRODUCT
}

type GetPriority<TToken extends TokenType> = Precedences extends { [P in TToken]: infer TPriority extends number } ? TPriority : Priority.LOWEST

type ParseExpressionStatement<TToken extends Token<TokenType, any>, TTokens extends Token<TokenType, any>[]> =
ParseExpression<Priority.LOWEST, TToken, TTokens> extends [infer TExpression extends Expression, infer TRest extends Token<any, any>[]]
  ? [ExpressionStatement<TToken['type'], TExpression>, TRest]
  : []

type ParseExpression<TPriority extends Priority, TToken extends Token<TokenType, any>, TTokens extends Token<TokenType, any>[]> =
ParsePrefixParseFn<TToken, TTokens> extends [infer TLeft extends Expression, [infer TNextToken extends Token<TokenType, any>, ...infer TRest extends Token<TokenType, any>[]]]
  ? ParseInfixParseLoop<TPriority, TLeft, TNextToken, TRest>
  : never

type ParseInfixParseLoop<TPriority extends Priority, TLeft extends Expression, TToken extends Token<TokenType, any>, TTokens extends Token<TokenType, any>[]> =
LT<TPriority, GetPriority<TToken['type']>> extends true
  ? ParseInfixParseFn< TLeft, TToken, TTokens> extends [infer TExpression extends Expression, [infer TNextToken extends Token<TokenType, any>, ...infer TRest extends Token<TokenType, any>[]]]
    ? ParseInfixParseLoop<TPriority, TExpression, TNextToken, TRest>
    : [TLeft, [TToken, ...TTokens]]
  : [TLeft, [TToken, ...TTokens]]

type ParseExpression2<TPriority extends Priority, TTokens extends Token<TokenType, any>[]> = TTokens extends
[infer TToken extends Token<TokenType, any>, ...infer TRest extends Token<TokenType, any>[]]
  ? ParseExpression<TPriority, TToken, TRest>
  : never

type ParseIfExpression<TTokens extends Token<TokenType, any>[]> = TTokens extends [Token<TokenType.LPAREN, any>, ...infer TRest extends Token<TokenType, any>[]]
  ? ParseExpression2< Priority.LOWEST, TRest> extends
  [
    infer TCondition extends Expression,
    [
      Token<TokenType.RPAREN, any>,
      Token<TokenType.LBRACE, any>,
      infer TNextToken extends Token<TokenType, any>,
      ...infer TRest2 extends Token<TokenType, any>[],
    ],
  ]
    ? ParseBlockStatement<TNextToken, TRest2, []> extends
    [
      infer TConsequence extends BlockStatement<any, any>,
      infer TRest3 extends Token<TokenType, any>[],
    ]
      ? TRest3 extends [
        // 有 else 分支
        Token<TokenType.ELSE, any>,
        ...infer TRest4 extends Token<TokenType, any>[],
      ]
        ? TRest4 extends [
          Token<TokenType.LBRACE, any>,
          infer TNextToken2 extends Token<TokenType, any>,
          ...infer TRest5 extends Token<TokenType, any>[],
        ]
          ? ParseBlockStatement<TNextToken2, TRest5, []> extends
          [
            infer TAlternative extends BlockStatement<any, any>,
            infer TRest6 extends Token<TokenType, any>[],
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

type ParsePrefixParseFn<TToken extends Token<TokenType, any>, TTokens extends Token<TokenType, any>[]> = {
  [TokenType.IDENT]: [Identifier<TToken['literal']>, TTokens]
  [TokenType.INT]: [IntegerLiteral<StringToNumber<TToken['literal']>>, TTokens]
  [TokenType.TRUE]: [BooleanLiteral<true>, TTokens]
  [TokenType.FALSE]: [BooleanLiteral<false>, TTokens]
  [TokenType.BAND]: ParseExpression2<Priority.PREFIX, TTokens> extends [infer TExpression extends Expression, infer TRest]
    ? [PrefixExpression<TokenType.BAND, TExpression>, TRest] : never
  [TokenType.MINUS]: ParseExpression2<Priority.PREFIX, TTokens> extends [infer TExpression extends Expression, infer TRest]
    ? [PrefixExpression<TokenType.MINUS, TExpression>, TRest] : never
  [TokenType.LPAREN]: ParseExpression2<Priority.LOWEST, TTokens> extends [infer TExpression extends Expression, [Token<TokenType.RPAREN, any>, ...infer TRest]]
    ? [TExpression, TRest] : never
  [TokenType.IF]: ParseIfExpression<TTokens>
} extends { [T in TToken['type']]: [infer TExpression extends Expression, infer TRest] } ? [TExpression, TRest] : []

type ParseInfixParseFn< TLeft extends Expression, TToken extends Token<TokenType, any>, TTokens extends Token<TokenType, any>[]> = {
  [TokenType.PLUS]: ParseExpression2<Precedences[TokenType.PLUS], TTokens> extends [infer TRight extends Expression, infer TRest extends Token<TokenType, any>[]]
    ? [InfixExpression<TokenType.PLUS, TLeft, TRight>, TRest]
    : never
  [TokenType.MINUS]: ParseExpression2<Precedences[TokenType.MINUS], TTokens> extends [infer TRight extends Expression, infer TRest extends Token<TokenType, any>[]]
    ? [InfixExpression<TokenType.MINUS, TLeft, TRight>, TRest]
    : never
  [TokenType.SLASH]: ParseExpression2<Precedences[TokenType.SLASH], TTokens> extends [infer TRight extends Expression, infer TRest extends Token<TokenType, any>[]]
    ? [InfixExpression<TokenType.SLASH, TLeft, TRight>, TRest]
    : never
  [TokenType.ASTERISK]: ParseExpression2<Precedences[TokenType.ASTERISK], TTokens> extends [infer TRight extends Expression, infer TRest extends Token<TokenType, any>[]]
    ? [InfixExpression<TokenType.ASTERISK, TLeft, TRight>, TRest]
    : never
  [TokenType.EQ]: ParseExpression2<Precedences[TokenType.EQ], TTokens> extends [infer TRight extends Expression, infer TRest extends Token<TokenType, any>[]]
    ? [InfixExpression<TokenType.EQ, TLeft, TRight>, TRest]
    : never
  [TokenType.NEQ]: ParseExpression2<Precedences[TokenType.NEQ], TTokens> extends [infer TRight extends Expression, infer TRest extends Token<TokenType, any>[]]
    ? [InfixExpression<TokenType.NEQ, TLeft, TRight>, TRest]
    : never
  [TokenType.LT]: ParseExpression2<Precedences[TokenType.LT], TTokens> extends [infer TRight extends Expression, infer TRest extends Token<TokenType, any>[]]
    ? [InfixExpression<TokenType.LT, TLeft, TRight>, TRest]
    : never
  [TokenType.GT]: ParseExpression2<Precedences[TokenType.GT], TTokens> extends [infer TRight extends Expression, infer TRest extends Token<TokenType, any>[]]
    ? [InfixExpression<TokenType.GT, TLeft, TRight>, TRest]
    : never
} extends { [T in TToken['type']]: [infer TExpression extends Expression, infer TRest] } ? [TExpression, TRest] : []

type Parser<TTokens extends Token<TokenType, any>[]> = Program<_Parser<TTokens>>

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

type PN<TP extends Program<any>, N extends number> = TP extends Program<infer TStatements> ? TStatements[N] : never

export interface Debug<V> extends Expression {
  v: V
}
