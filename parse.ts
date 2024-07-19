type SplitString<TString extends string> = TString extends `${infer TPrefix}${infer TRest}` ? [TPrefix, ...SplitString<TRest>] : []

type CharacterSet = SplitString<'var a = 1;'>

// declare enum TokenType {
//     ILLEGAL = 'ILLEGAL',
//     EOF = 'EOF',

//     IDENT = 'IDENT',
//     INT = 'INT',

//     ASSIGN = '=',
//     PLUS = '+',
//     COMMA = ',',
//     SEMICOLON = ';',

//     LPAREN = '(',
//     RPAREN = ')',
//     LBRACE = '{',
//     RBRACE = '}',

//     FUNCTION = 'FUNCTION',
//     LET = 'LET',
// }

// interface Token<TType extends TokenType> {
//     type: TType
// }

// type A = Token<TokenType.ILLEGAL>

type SplitString2<TString extends string> = TString extends `${infer TPrefix}${infer TRest}` ? [Extract<'TokenType', TPrefix>, ...SplitString2<TRest>] : []

type CharacterSet2 = SplitString2<'var a = 1;'>

// type Tokenizer =

type _Array<TSize extends number, TR extends number[] = []> = TR['length'] extends TSize ? TR : _Array<TSize, [...TR, 1]>

type Plus<TA extends number, TB extends number> = [..._Array<TA>, ..._Array<TB>]['length']
type Minus<TA extends number, TB extends number> = TB extends 0 ? TA : _Array<TA> extends [..._Array<TB>, ...infer TR] ? TR['length'] : never

type _M = Minus<8, 3>

// @ts-expect-error
type Multiply<TA extends number, TB extends number> = TB extends 0 ? 0 : _Array<TA> extends infer TR ? Plus<TR['length'], Multiply<TA, Minus<TB, 1>>> : never
type Divide<TA extends number, TB extends number> = TB extends 0 ? never : _Array<TA> extends [..._Array<TB>, ...infer TR] ? [...TR, 1]['length'] : never

// type _MM = Multiply<8, 40>
type _Divide = Divide<9, 3>

// @ts-expect-error
type Pow<TA extends number, TB extends number> = TB extends 0 ? 1 : _Array<TA> extends infer TR ? Multiply<TR['length'], Pow<TA, Minus<TB, 1>>> : never

// type _P = Pow<20, 2>;

type BuildPlus<TP extends string, TC extends string, TR> = TC extends '+' ? { left: TP, right: TR, type: 'PLUS' } : TR extends [infer TPrefix, infer TRest] ? BuildPlus<TC, TPrefix & string, TRest > : never

type P<TString extends string> = SplitString<TString> extends [infer TPrefix, ...infer TRest] ? BuildPlus<'', TPrefix & string, TRest & string[]> : never

type E<T> = T extends { left: infer L, type: infer TType, right: infer R } ? TType extends 'PLUS' ? Plus<StringToNumber<L & string>, StringToNumber<R & string>> : never : never

type Z = E<P<'1+2'>>

// 难点，字母转数字？

interface S2N {
  0: 0
  1: 1
  2: 2
  3: 3
  4: 4
  5: 5
  6: 6
  7: 7
  8: 8
  9: 9
}

type StringLength<TString extends string, TR extends string[] = []> = TString extends `${infer TPrefix}${infer TRest}` ? StringLength<TRest, [...TR, TPrefix]> : TR['length']

export type StringToNumber<TString extends string> = TString extends `${infer TPrefix}${infer TRest}` ? Plus<Multiply<S2N[TPrefix & keyof S2N], Pow<10, StringLength<TRest>>> & number, StringToNumber<TRest>> : 0

type Zzzz = StringToNumber<'12'>

// 一次减一半
// return (n % 2) ? myPow(x * x, Math.floor(n / 2)) * x : myPow(x * x, n / 2);

type Exp2<TString extends string, TVars extends Record<string, any>> = TString extends `${infer _}${infer TB}${infer TC}${infer TD}`
  ? TC extends '+' ? Plus<StringToNumber<TVars[TB]>, StringToNumber<TVars[TD]>> : never : never

type Exp<TString> = TString extends `${infer TA}${infer TB}${infer TC}${infer TD}` ? TB extends '=' ? Exp2<TD, { [TKey in TA]: TC }> : never : never

type E1 = Exp<'a=2;a+a'>

type Digit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
