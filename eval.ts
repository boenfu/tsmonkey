type _Array<TSize extends number, TR extends number[] = []> = TR['length'] extends TSize ? TR : _Array<TSize, [...TR, 1]>
type Plus<TA extends number, TB extends number> = [..._Array<TA>, ..._Array<TB>]['length']
type Minus<TA extends number, TB extends number> = TB extends 0 ? TA : _Array<TA> extends [..._Array<TB>, ...infer TR] ? TR['length'] : never

type Eval<TObj extends Record<string, number>, TExp extends { op: 'plus' | 'minus', l: Token<TokenType.IDENT, string>, r: Token<TokenType.IDENT, string> }> =
TExp extends { op: infer TOP, l: infer TL extends Token<any, any>, r: infer TR extends Token<any, any> } ?
    ({
      plus: Plus<TObj[TL['literal']], TObj[TR['literal']]>
      minus: Minus<TObj[TL['literal']], TObj[TR['literal']]>
    })[Extract<TOP, 'plus' | 'minus'>] : never

type _E1 = Eval<{ a: 3, b: 5 }, { op: 'minus', l: Token<TokenType.IDENT, 'b'>, r: Token<TokenType.IDENT, 'a'> }>
