declare enum TokenType {
  ILLEGAL = 'ILLEGAL',
  EOF = 'EOF',

  // 标识符 + 字面量
  IDENT = 'IDENT',
  INT = 'INT',

  // 运算符
  ASSIGN = '=',
  PLUS = '+',

  // 分隔符
  COMMA = ',',
  SEMICOLON = ';',

  LPAREN = '(',
  RPAREN = ')',
  LBRACE = '{',
  RBRACE = '}',

  // 关键字
  FUNCTION = 'FUNCTION',
  LET = 'LET',
}

interface Token<TType extends TokenType, TLiteral> {
  type: TType
  literal: TLiteral
}

type Lexer<TCode extends string> = TCode extends `${infer TCh}${infer TRest}`
  ? [
      // 空白字符跳过
      ...(TCh extends ' '
        ? []
        : Extract<TokenType, TCh> extends never
          ? []
          // 能直接匹配上的 token
          : [Token<Extract<TokenType, TCh>, TCh>]),
      ... TRest extends ''
        // 结束标记
        ? [Token<TokenType.EOF, ''>]
        // 递归解析
        : Lexer<TRest>,
    ]
  : []

type _L1 = Lexer<'=  1 3 )'>
