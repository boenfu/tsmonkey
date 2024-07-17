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

type Letter = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' | 'k' | 'l' | 'm' | 'n' | 'o' | 'p' | 'q' | 'r' | 's' | 't' | 'u' | 'v' | 'w' | 'x' | 'y' | 'z' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L' | 'M' | 'N' | 'O' | 'P' | 'Q' | 'R' | 'S' | 'T' | 'U' | 'V' | 'W' | 'X' | 'Y' | 'Z' | '_'

interface Token<TType extends TokenType, TLiteral> {
  type: TType
  literal: TLiteral
}

type Lexer<TCode extends string> = TCode extends `${infer TCh}${infer TRest}`
  // 是字母/下划线
  ? TCh extends Letter
    ? ReadIdentifier<TCode> extends [infer TIdentity, infer TRest extends string]
      // 遍历读取标识符，剩余的继续递归
      ? [Token<TokenType.IDENT, TIdentity>, ...Lexer<TRest>]
      : never
    : [
        ...(TCh extends ' '
          // 空白字符跳过
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

type ReadIdentifier<TCode extends string, TOutput extends string = ''> = TCode extends `${infer TCh extends Letter}${infer TRest}`
  ? ReadIdentifier<TRest, `${TOutput}${TCh}`>
  : [TOutput, TCode]

type _L1 = Lexer<'= abc _oo CC (); '>
