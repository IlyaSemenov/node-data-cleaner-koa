import Koa from 'koa'
import 'koa-body' // pull typings
import clean from 'data-cleaner'
import { Cleaner } from 'data-cleaner/src/types'
import createError from 'http-errors'
import formidable from 'formidable'

export interface KoaSchema<T> {
	body?: Cleaner<T>
	files?: Cleaner
	clean?: Cleaner<CleanedKoaRequest<T>>
	errorCode?: number
}

export interface CleanedKoaRequest<T> {
	body: T
	files: formidable.Files
}

export default function clean_koa<T = any> (schema: KoaSchema<T>): Cleaner<CleanedKoaRequest<T>> {
	return clean.any<CleanedKoaRequest<T>>({
		async clean (ctx: Koa.Context, opts) {
			try {
				let res = {} as CleanedKoaRequest<T>
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
					const http_error = createError(400, JSON.stringify({ errors: err.errors }))
					// avoid createError deprecation warning for status < 400
					http_error.status = schema.errorCode || 200
					throw http_error
				}
				throw err
			}
		},
	})
}
