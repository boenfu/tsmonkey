/* eslint-disable ts/ban-ts-comment */
type _Array<TSize extends number, TR extends number[] = []> = TR['length'] extends TSize ? TR : _Array<TSize, [...TR, 1]>

export type Plus<TA extends number, TB extends number> = [..._Array<TA>, ..._Array<TB>]['length']
export type Minus<TA extends number, TB extends number> = TB extends 0 ? TA : _Array<TA> extends [..._Array<TB>, ...infer TR] ? TR['length'] : never

// @ts-expect-error
export type Multiply<TA extends number, TB extends number> = TB extends 0 ? 0 : _Array<TA> extends infer TR ? Plus<TR['length'], Multiply<TA, Minus<TB, 1>>> : never
export type Divide<TA extends number, TB extends number> = TB extends 0 ? never : _Array<TA> extends [..._Array<TB>, ...infer TR] ? [...TR, 1]['length'] : never

// @ts-expect-error
export type Pow<TA extends number, TB extends number> = TB extends 0 ? 1 : _Array<TA> extends infer TR ? Multiply<TR['length'], Pow<TA, Minus<TB, 1>>> : never

interface StringNumberMapping {
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

export type StringLength<TString extends string, TR extends string[] = []> = TString extends `${infer TPrefix}${infer TRest}` ? StringLength<TRest, [...TR, TPrefix]> : TR['length']

export type StringToNumber<TString extends string> = TString extends `${infer TPrefix}${infer TRest}`
// @ts-expect-error
  ? Plus<Multiply<StringNumberMapping[TPrefix], Pow<10, StringLength<TRest>>>, StringToNumber<TRest>>
  : 0

type Falsy = false | '' | 0 | null | undefined

export type IsFalsy<T> = T extends Falsy ? true : false

export type IsTruthy<T> = T extends Falsy ? false : true

type Compare<TA extends number, TB extends number> = _Array<TA> extends [..._Array<TB>, ...infer TRest]
  ? TRest['length'] extends 0
    ? '='
    : '>'
  : '<'

export type AND<TA, TB> = TA extends true ? TB extends true ? true : false : false

export type OR<TA, TB> = TA extends true ? true : TB extends true ? true : false

export type EQ<TA, TB> = TA extends TB ? (TB extends TA ? true : false) : false

export type NEQ<TA, TB> = EQ<EQ<TA, TB>, false>

export type GT<TA extends number, TB extends number> = EQ<Compare<TA, TB>, '>'>

export type LT<TA extends number, TB extends number> = EQ<Compare<TA, TB>, '<'>

export type GTE<TA extends number, TB extends number> = OR<GT<TA, TB>, EQ<TA, TB>>

export type LTE<TA extends number, TB extends number> = OR<LT<TA, TB>, EQ<TA, TB>>
