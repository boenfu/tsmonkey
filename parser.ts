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

interface Identifier<TValue> extends Expression {
  token: TokenType.IDENT
  value: TValue
}

type Parser<TTokens extends Token<TokenType, any>[]> = Program<TTokens extends [infer TCur extends Token<any, any>, ...infer TRest extends Token<TokenType, any>[]]
  ? ParseStatement<TCur, TRest>
  : []>

type ParseStatement<TToken extends Token<TokenType, any>, TTokens extends Token<TokenType, any>[]> = {
  [TokenType.LET]: TTokens extends [infer TNextToken extends Token<TokenType, any>, ... infer TRest extends Token<TokenType, any>[]]
    ? ParseLetStatement<TNextToken, TRest> : never
  [TokenType.RETURN]: never
} extends { [T in TToken['type']]: [infer TStatement] } ? [TStatement] : []

type ParseLetStatement<TToken extends Token<TokenType, any>, TTokens extends Token<TokenType, any>[]> = {
  [TokenType.IDENT]: TTokens extends [infer _TNextToken extends Token<TokenType.ASSIGN, any>, ...infer _TRest extends Token<TokenType, any>[]]
    ? [LetStatement<Identifier<TToken['literal']>, Expression>] : never
} extends { [T in TToken['type']]: [infer TStatement] } ? [TStatement] : []

type _L1 = Lexer<'let a = 1;'>
type _P1 = Parser<Lexer<'let a = 1;'>>
