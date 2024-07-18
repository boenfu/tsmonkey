declare enum TokenType {
  ILLEGAL = 'ILLEGAL',
  EOF = 'EOF',

  // 标识符 + 字面量
  IDENT = 'IDENT',
  INT = 'INT',

  // 运算符
  ASSIGN = '=',
  PLUS = '+',
  MINUS = '-',
  BAND = '!',
  ASTERISK = '*',
  SLASH = '/',

  //   EQ = '==',
  //   NEQ = '!=',

  LT = '<',
  GT = '>',
  //   LE = '<=',
  //   GE = '>=',
  //   AND = '&&',
  //   OR = '||',

  // 分隔符
  COMMA = ',',
  SEMICOLON = ';',

  LPAREN = '(',
  RPAREN = ')',
  LBRACE = '{',
  RBRACE = '}',

  // 关键字
  FUNCTION = 'function',
  LET = 'let',
  VAR = 'var',
  TRUE = 'true',
  FALSE = 'false',
  IF = 'if',
  ELSE = 'else',
  RETURN = 'return',
  //   WHILE = 'while',
  //   FOR = 'for',
  //   CONTINUE = 'continue',
  //   BREAK = 'break',
  //   NEW = 'new',
  //   THIS = 'this',
  //   NULL = 'null',
}

type Letter = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' | 'k' | 'l' | 'm' | 'n' | 'o' | 'p' | 'q' | 'r' | 's' | 't' | 'u' | 'v' | 'w' | 'x' | 'y' | 'z' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L' | 'M' | 'N' | 'O' | 'P' | 'Q' | 'R' | 'S' | 'T' | 'U' | 'V' | 'W' | 'X' | 'Y' | 'Z' | '_' | '$'
type Digit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'

interface Token<TType extends TokenType, TLiteral> {
  type: TType
  literal: TLiteral
}

type WhiteSpace = ' ' | '\n' | '\t' | '\r'

type Lexer<TCode extends string> = TCode extends `${infer TCh}${infer TRest}`
  // 是字母/下划线/美元符
  ? TCh extends Letter
    ? ReadIdentifier<TCode> extends [infer TIdentity, infer TRest extends string]
      // 遍历读取标识符，剩余的继续递归
      ? [Token<Extract<TokenType, TIdentity> extends never ? TokenType.IDENT : Extract<TokenType, TIdentity>, TIdentity>, ...Lexer<TRest>]
      : never

    : TCh extends Digit
      ? ReadDigit<TCode> extends [infer TIdentity, infer TRest extends string]
        // 遍历读取标识符，剩余的继续递归
        ? [Token<TokenType.INT, TIdentity>, ...Lexer<TRest>]
        : never
      : [
          ...(TCh extends WhiteSpace
          // 空白/换行字符跳过
            ? []
            : Extract<TokenType, TCh> extends never
              ? [TCh]
            // 能直接匹配上的 token
              : [Token<Extract<TokenType, TCh>, TCh>]),
          ... TRest extends ''
          // 结束标记
            ? [Token<TokenType.EOF, ''>]
          // 递归解析
            : Lexer<TRest>,
        ]
  : []

type ReadIdentifier<TCode extends string, TOutput extends string = ''> = TCode extends
// 允许标识符中非开头出现数字
`${infer TCh extends (TOutput extends '' ? Letter : Letter | Digit)}${infer TRest}`
  ? ReadIdentifier<TRest, `${TOutput}${TCh}`>
  : [TOutput, TCode]

type ReadDigit<TCode extends string, TOutput extends string = ''> = TCode extends
  `${infer TCh extends Digit}${infer TRest}`
  ? ReadDigit<TRest, `${TOutput}${TCh}`>
  : [TOutput, TCode]

type _L1 = Lexer<`
let 5g = g5(); 
`>