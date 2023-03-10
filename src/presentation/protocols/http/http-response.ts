export enum HttpStatusCode {
	ok = 200,
	noContent = 204,
	badRequest = 400,
	unauthorized = 401,
	notFound = 404,
	serverError = 500,
}

export interface HttpResponse<T = unknown> {
	statusCode: HttpStatusCode;
	body: T;
}
