import Koa from 'koa'
import 'koa-body' // pull typings
import clean, { Cleaner } from 'data-cleaner'
import createError from 'http-errors'
import formidable from 'formidable'

export interface KoaSchema<B, T> {
	body?: Cleaner<B, any> // TODO: any -> type of ctx.request.body
	files?: Cleaner
	clean?: Cleaner<T, Koa.Context>
	errorCode?: number
}

export interface CleanKoaRequest<B> {
	body: B
	files: formidable.Files // TODO: allow this to be optional
}

export default function clean_koa<B = any, T = CleanKoaRequest<B>> (schema: KoaSchema<B, T>): Cleaner<T, Koa.Context> {
	return clean.any<T, Koa.Context>({
		async clean (ctx, opts) {
			try {
				let res: any = {}
				if (schema.body) {
					res.body = await schema.body(ctx.request.body, opts)
				}
				if (schema.files) {
					res.files = await schema.files(ctx.request.files, opts)
				}
				if (schema.clean) {
					res = await schema.clean(res, opts)
				}
				return res
			} catch (err) {
				if (err instanceof clean.ValidationError) {
					const http_error = createError(
						400,
						JSON.stringify({ errors: err.errors }),
						{
							headers: { 'Content-Type': 'application/json' }
						}
					)
					// avoid createError deprecation warning for status < 400
					http_error.status = schema.errorCode || 200
					// prevent Koa from resetting content-type, see https://github.com/koajs/koa/issues/787
					Object.defineProperty(ctx.response, 'type', { set () {} })
					throw http_error
				}
				throw err
			}
		},
	})
}
