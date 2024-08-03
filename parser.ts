import type { Token, TokenType } from './lexer'
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

export interface StringLiteral<TValue extends string> extends Expression {
  type: 'StringLiteral'
  token: TokenType.STRING
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

type _Parser<TTokens extends Token[], TStatements extends Statement[] = []> = TTokens extends [infer TCur extends Token, ...infer TRest extends Token[]]
  ? ParseStatement<TCur, TRest> extends [infer TStatement extends Statement, infer TRestTokens extends Token[]]
    ? _Parser<TRestTokens, [...TStatements, TStatement]>
    : _Parser<TRest, TStatements>
  : TStatements

type ParseStatement<TToken extends Token, TTokens extends Token[]> = {
  [TokenType.LET]: TTokens extends [infer TNextToken extends Token, ...infer TRest extends Token[]] ? ParseLetStatement<TNextToken, TRest> : never
  [TokenType.RETURN]: ParseReturnStatement<TTokens>
  [TokenType.EOF]: never
} extends { [T in TToken['type']]: [infer TStatement, infer TRest] }
  ? [TStatement, TRest]
  : ParseExpressionStatement<TToken, TTokens>

type ParseLetStatement<TToken extends Token, TTokens extends Token[]> = {
  [TokenType.IDENT]: TTokens extends [Token<TokenType.ASSIGN>, ...infer TRest extends Token[]]
    ? ParseExpression2<Precedence.LOWEST, TRest> extends [infer TExpression extends Expression, infer TRest extends Token[]]
      ? [LetStatement<Identifier<TToken['literal']>, TExpression>, TRest]
      : never
    : never
} extends { [T in TToken['type']]: [infer TStatement, infer TRest] } ? [TStatement, TRest] : []

type ParseReturnStatement<TTokens extends Token[]> =
ParseExpression2<Precedence.LOWEST, TTokens> extends [infer TExpression extends Expression, infer TRest extends Token[]]
  ? [ReturnStatement<TExpression>, TRest]
  : [ReturnStatement<Expression>, TTokens]

type ParseBlockStatement<TToken extends Token, TTokens extends Token[], TStatements extends Statement[]> = {
  [TokenType.RBRACE]: true
  [TokenType.EOF]: true
} extends { [T in TToken['type']]: true }
  ? [BlockStatement<TToken['type'], TStatements>, TTokens ]
  : ParseStatement<TToken, TTokens> extends [ infer TStatement extends Statement, infer TRest extends Token[] ]
    ? ParseBlockStatement2<TRest, [...TStatements, TStatement]>
    : [BlockStatement<TToken['type'], TStatements>, TTokens ]

type ParseBlockStatement2<TTokens extends Token[], TStatements extends Statement[] = []> = TTokens extends
[infer TToken extends Token, ...infer TRest extends Token[]]
  ? ParseBlockStatement<TToken, TRest, TStatements>
  : never

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_precedence
declare enum Precedence {
  LOWEST = 1,
  OR = 3,
  AND = 4,
  EQUALS = 8, // ==
  LESSGREATER = 9, // > or <
  SUM = 11, // +
  PRODUCT = 12, // *
  PREFIX = 14, // -X or !X
  ACCESS_AND_CALL = 17, // myFunction(X)
}

interface PrecedenceMap {
  [TokenType.EQ]: Precedence.EQUALS
  [TokenType.NEQ]: Precedence.EQUALS
  [TokenType.LT]: Precedence.LESSGREATER
  [TokenType.GT]: Precedence.LESSGREATER
  [TokenType.LE]: Precedence.LESSGREATER
  [TokenType.GE]: Precedence.LESSGREATER
  [TokenType.PLUS]: Precedence.SUM
  [TokenType.MINUS]: Precedence.SUM
  [TokenType.SLASH]: Precedence.PRODUCT
  [TokenType.ASTERISK]: Precedence.PRODUCT
  [TokenType.LPAREN]: Precedence.ACCESS_AND_CALL
  [TokenType.AND]: Precedence.AND
  [TokenType.OR]: Precedence.OR
}

type GetPrecedence<TToken extends TokenType> = PrecedenceMap extends { [P in TToken]: infer TPrecedence extends number } ? TPrecedence : Precedence.LOWEST

type ParseExpressionStatement<TToken extends Token, TTokens extends Token[]> =
ParseExpression<Precedence.LOWEST, TToken, TTokens> extends [infer TExpression extends Expression, infer TRest extends Token[]]
  ? [ExpressionStatement<TToken['type'], TExpression>, TRest]
  : []

type ParseExpression<TPrecedence extends Precedence, TToken extends Token, TTokens extends Token[]> =
ParsePrefixParseFn<TToken, TTokens> extends [infer TLeft extends Expression, [infer TNextToken extends Token, ...infer TRest extends Token[]]]
  ? ParseInfixParseLoop<TPrecedence, TLeft, TNextToken, TRest>
  : never

type ParseInfixParseLoop<TPrecedence extends Precedence, TLeft extends Expression, TToken extends Token, TTokens extends Token[]> =
LT<TPrecedence, GetPrecedence<TToken['type']>> extends true
  ? ParseInfixParseFn< TLeft, TToken, TTokens> extends [infer TExpression extends Expression, [infer TNextToken extends Token, ...infer TRest extends Token[]]]
    ? ParseInfixParseLoop<TPrecedence, TExpression, TNextToken, TRest>
    : [TLeft, [TToken, ...TTokens]]
  : [TLeft, [TToken, ...TTokens]]

type ParseExpression2<TPrecedence extends Precedence, TTokens extends Token[]> = TTokens extends
[infer TToken extends Token, ...infer TRest extends Token[]]
  ? ParseExpression<TPrecedence, TToken, TRest>
  : never

type ParseIfExpression<TTokens extends Token[]> = TTokens extends [
  Token<TokenType.LPAREN>,
  ...infer TRest extends Token[],
]
  ? ParseExpression2< Precedence.LOWEST, TRest> extends
  [infer TCondition extends Expression, [Token<TokenType.RPAREN>, Token<TokenType.LBRACE>, infer TNextToken extends Token, ...infer TRest extends Token[] ] ]
    ? ParseBlockStatement<TNextToken, TRest, []> extends
    [infer TConsequence extends BlockStatement<any>, infer TRest extends Token[] ]
    // 有 else 分支
      ? TRest extends [Token<TokenType.ELSE>, ...infer TRest extends Token[] ]
        ? TRest extends [Token<TokenType.LBRACE>, infer TNextToken2 extends Token, ...infer TRest extends Token[] ]
          ? ParseBlockStatement<TNextToken2, TRest, []> extends
          [infer TAlternative extends BlockStatement<any>, infer TRest extends Token[] ]
            ?
              [IfExpression<TCondition, TConsequence, TAlternative>, TRest ]
            : never
          : never
        : [IfExpression<TCondition, TConsequence, undefined>, TRest ]
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
  [infer TParameters extends Identifier<any>[], [ Token<TokenType.LBRACE>, infer TNextToken2 extends Token, ...infer TRest extends Token[] ] ]
    ? ParseBlockStatement<TNextToken2, TRest, []> extends [infer TBody extends BlockStatement<any>, infer TRest extends Token[] ]
      ? [FunctionLiteral<Identifier<TName>, TParameters, TBody>, TRest ]
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
  [TokenType.STRING]: [StringLiteral<TToken['literal']>, TTokens]
  [TokenType.TRUE]: [BooleanLiteral<true>, TTokens]
  [TokenType.FALSE]: [BooleanLiteral<false>, TTokens]
  [TokenType.BAND]: ParseExpression2<Precedence.PREFIX, TTokens> extends [infer TExpression extends Expression, infer TRest] ? [PrefixExpression<TokenType.BAND, TExpression>, TRest] : never
  [TokenType.MINUS]: ParseExpression2<Precedence.PREFIX, TTokens> extends [infer TExpression extends Expression, infer TRest] ? [PrefixExpression<TokenType.MINUS, TExpression>, TRest] : never
  [TokenType.LPAREN]: ParseExpression2<Precedence.LOWEST, TTokens> extends [infer TExpression extends Expression, [Token<TokenType.RPAREN>, ...infer TRest]] ? [TExpression, TRest] : never
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
  : ParseExpression<Precedence.LOWEST, TToken, TTokens> extends [infer TArgument extends Expression, [infer TNextToken extends Token, ...infer TRest extends Token[]] ]
    ? ParseCallArguments<TNextToken, TRest, [...TArguments, TArgument]>
    : []

type DefaultInfixExpression<TToken extends keyof PrecedenceMap, TLeft extends Expression, TTokens extends Token[]> = ParseExpression2<PrecedenceMap[TToken], TTokens> extends [infer TRight extends Expression, infer TRest extends Token[]]
  ? [InfixExpression<TToken, TLeft, TRight>, TRest]
  : never

type ParseInfixParseFn<TLeft extends Expression, TToken extends Token, TTokens extends Token[]> = {
  [TokenType.PLUS]: DefaultInfixExpression<TokenType.PLUS, TLeft, TTokens>
  [TokenType.MINUS]: DefaultInfixExpression<TokenType.MINUS, TLeft, TTokens>
  [TokenType.SLASH]: DefaultInfixExpression<TokenType.SLASH, TLeft, TTokens>
  [TokenType.ASTERISK]: DefaultInfixExpression<TokenType.ASTERISK, TLeft, TTokens>
  [TokenType.EQ]: DefaultInfixExpression<TokenType.EQ, TLeft, TTokens>
  [TokenType.NEQ]: DefaultInfixExpression<TokenType.NEQ, TLeft, TTokens>
  [TokenType.LT]: DefaultInfixExpression<TokenType.LT, TLeft, TTokens>
  [TokenType.GT]: DefaultInfixExpression<TokenType.GT, TLeft, TTokens>
  [TokenType.LE]: DefaultInfixExpression<TokenType.LE, TLeft, TTokens>
  [TokenType.GE]: DefaultInfixExpression<TokenType.GE, TLeft, TTokens>
  [TokenType.AND]: DefaultInfixExpression<TokenType.AND, TLeft, TTokens>
  [TokenType.OR]: DefaultInfixExpression<TokenType.OR, TLeft, TTokens>
  [TokenType.LPAREN]: TTokens extends [infer TNextToken extends Token, ...infer TRest extends Token[]] ? ParseCallExpression<TLeft, TNextToken, TRest> : never
} extends { [T in TToken['type']]: [infer TExpression extends Expression, infer TRest] } ? [TExpression, TRest] : []

export type Parser<TTokens extends Token[]> = Program<_Parser<TTokens>>
