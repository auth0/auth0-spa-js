export const encode: (obj: object, prefix?: string) => string

export const decode: <MaybeObject extends object = {}>(str: string) => Partial<MaybeObject>
