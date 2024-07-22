import type { Lexer, Token, TokenType } from './lexer'

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

interface Identifier<TValue> extends Expression {
  token: TokenType.IDENT
  value: TValue
}

type _Parser<TTokens extends Token<TokenType, any>[], TStatements extends Statement[] = []> = TTokens extends [infer TCur extends Token<any, any>, ...infer TRest extends Token<TokenType, any>[]]
  ? ParseStatement<TCur, TRest> extends [infer TStatement extends Statement, infer TRestTokens extends Token<any, any>[]] ? _Parser<TRestTokens, [...TStatements, TStatement]> : _Parser<TRest, TStatements>
  : TStatements

type ParseStatement<TToken extends Token<TokenType, any>, TTokens extends Token<TokenType, any>[]> = {
  [TokenType.LET]: TTokens extends [infer TNextToken extends Token<TokenType, any>, ... infer TRest extends Token<TokenType, any>[]]
    ? ParseLetStatement<TNextToken, TRest> : never
  [TokenType.RETURN]: TTokens extends [infer TNextToken extends Token<TokenType, any>, ... infer TRest extends Token<TokenType, any>[]]
    ? ParseReturnStatement<TNextToken, TRest> : never
} extends { [T in TToken['type']]: [infer TStatement, infer TRest] }
  ? [TStatement, TRest]
  : ParseExpressionStatement<TToken, TTokens>

type ParseLetStatement<TToken extends Token<TokenType, any>, TTokens extends Token<TokenType, any>[]> = {
  [TokenType.IDENT]: TTokens extends [infer _TNextToken extends Token<TokenType.ASSIGN, any>, ...infer TRest extends Token<TokenType, any>[]]
    ? [LetStatement<Identifier<TToken['literal']>, Expression>, TRest] : never
} extends { [T in TToken['type']]: [infer TStatement, infer TRest] } ? [TStatement, TRest] : []

type ParseReturnStatement<TToken extends Token<TokenType, any>, TTokens extends Token<TokenType, any>[]> = {
  [TokenType.IDENT]: []
} extends { [T in TToken['type']]: [infer TStatement, infer TRest] } ? [TStatement, TRest] : [ReturnStatement<Expression>, TTokens]

declare enum Priority {
  LOWEST = 1,
  EQUALS, // ==
  LESSGREATER, // > or <
  SUM, // +
  PRODUCT, // *
  PREFIX, // -X or !X
  CALL, // myFunction(X)
  INDEX, // array[index], map[key]
}

type ParseExpressionStatement<TToken extends Token<TokenType, any>, TTokens extends Token<TokenType, any>[]> =
ParseExpression<Priority.LOWEST, TToken, TTokens> extends [infer TExpression extends Expression, infer TRest extends Token<any, any>[]]
  ? [ExpressionStatement<TToken['type'], TExpression>, TRest]
  : []

type ParseExpression<_TPriority extends Priority, TToken extends Token<TokenType, any>, TTokens extends Token<TokenType, any>[]> =
ParsePrefixParseFn<TToken, TTokens>

type ParsePrefixParseFn<TToken extends Token<TokenType, any>, TTokens extends Token<TokenType, any>[]> = {
  [TokenType.IDENT]: Identifier<TToken['literal']>
} extends { [T in TToken['type']]: infer TExpression extends Expression } ? [TExpression, TTokens] : []

type Parser<TTokens extends Token<TokenType, any>[]> = Program<_Parser<TTokens>>

type _L1 = Lexer<'1;'>
type _P1 = Parser<Lexer<'let a = 1; return a;a'>>
