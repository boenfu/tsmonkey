

type SplitString<TString extends string> = TString extends `${infer TPrefix}${infer TRest}` ? [TPrefix, ...SplitString<TRest>] : []


type CharacterSet =  SplitString<'var a = 1;'>