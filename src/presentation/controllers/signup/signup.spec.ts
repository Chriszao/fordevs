import { faker } from '@faker-js/faker';
import {
	InvalidParamError,
	MissingParamError,
	ServerError,
} from '@presentation/errors';
import { AddAccountStub } from '@presentation/test';
import { EmailValidatorStub } from '@presentation/test/mock-email-validator';

import { SignupController } from './signup';
import type {
	AddAccount,
	EmailValidator,
	HttpRequest,
	SignUpParams,
} from './signup-protocols';
import { HttpStatusCode } from './signup-protocols';

type SutTypes = {
	sut: SignupController;
	emailValidatorStub: EmailValidator;
	addAccountStub: AddAccount;
};

function makeSut(): SutTypes {
	const emailValidatorStub = new EmailValidatorStub();
	const addAccountStub = new AddAccountStub();
	const sut = new SignupController(emailValidatorStub, addAccountStub);

	return {
		sut,
		emailValidatorStub,
		addAccountStub,
	};
}

describe('SignUpController', () => {
	it('should return 400 if no name is provided', async () => {
		const { sut } = makeSut();
		const password = faker.internet.password();

		const httpRequest = {
			body: {
				email: faker.internet.email(),
				password,
				passwordConfirmation: password,
			},
		} as HttpRequest<SignUpParams>;

		const httpResponse = await sut.handle(httpRequest);

		expect(httpResponse.statusCode).toBe(HttpStatusCode.badRequest);
		expect(httpResponse.body).toEqual(new MissingParamError('name'));
	});

	it('should return 400 if no email is provided', async () => {
		const { sut } = makeSut();
		const password = faker.internet.password();

		const httpRequest = {
			body: {
				name: faker.name.fullName(),
				password,
				passwordConfirmation: password,
			},
		} as HttpRequest<SignUpParams>;

		const httpResponse = await sut.handle(httpRequest);

		expect(httpResponse.statusCode).toBe(HttpStatusCode.badRequest);
		expect(httpResponse.body).toEqual(new MissingParamError('email'));
	});

	it('should return 400 if no password is provided', async () => {
		const { sut } = makeSut();

		const httpRequest = {
			body: {
				name: faker.name.fullName(),
				email: faker.internet.email(),
				passwordConfirmation: faker.internet.password(),
			},
		} as HttpRequest<SignUpParams>;

		const httpResponse = await sut.handle(httpRequest);

		expect(httpResponse.statusCode).toBe(HttpStatusCode.badRequest);
		expect(httpResponse.body).toEqual(new MissingParamError('password'));
	});

	it('should return 400 if no passwordConfirmation is provided', async () => {
		const { sut } = makeSut();

		const httpRequest = {
			body: {
				name: faker.name.fullName(),
				email: faker.internet.email(),
				password: faker.internet.password(),
			},
		} as HttpRequest<SignUpParams>;

		const httpResponse = await sut.handle(httpRequest);

		expect(httpResponse.statusCode).toBe(HttpStatusCode.badRequest);
		expect(httpResponse.body).toEqual(
			new MissingParamError('passwordConfirmation'),
		);
	});

	it('should return 400 if email is invalid', async () => {
		const { sut, emailValidatorStub } = makeSut();
		const password = faker.internet.password();

		jest.spyOn(emailValidatorStub, 'isValid').mockReturnValueOnce(false);

		const httpRequest = {
			body: {
				name: faker.name.fullName(),
				email: faker.random.word(),
				password,
				passwordConfirmation: password,
			},
		};

		const httpResponse = await sut.handle(httpRequest);

		expect(httpResponse.statusCode).toBe(HttpStatusCode.badRequest);
		expect(httpResponse.body).toEqual(new InvalidParamError('email'));
	});

	it('should return 400 if passwordConfirmation fails', async () => {
		const { sut } = makeSut();

		const httpRequest = {
			body: {
				name: faker.name.fullName(),
				email: faker.internet.email(),
				password: faker.internet.password(),
				passwordConfirmation: faker.random.word(),
			},
		};

		const httpResponse = await sut.handle(httpRequest);

		expect(httpResponse.statusCode).toBe(HttpStatusCode.badRequest);
		expect(httpResponse.body).toEqual(
			new InvalidParamError('passwordConfirmation'),
		);
	});

	it('should call EmailValidator with correct email', async () => {
		const { sut, emailValidatorStub } = makeSut();
		const password = faker.internet.password();

		const isValidSpy = jest.spyOn(emailValidatorStub, 'isValid');

		const email = faker.internet.email();

		const httpRequest = {
			body: {
				name: faker.name.fullName(),
				email,
				password,
				passwordConfirmation: password,
			},
		};

		await sut.handle(httpRequest);

		expect(isValidSpy).toHaveBeenCalledWith(email);
	});

	it('should return 500 if EmailValidator throws an exception', async () => {
		const { sut, emailValidatorStub } = makeSut();
		const password = faker.internet.password();

		jest.spyOn(emailValidatorStub, 'isValid').mockImplementationOnce(() => {
			throw new Error('');
		});

		const httpRequest = {
			body: {
				name: faker.name.fullName(),
				email: faker.internet.email(),
				password,
				passwordConfirmation: password,
			},
		};

		const httpResponse = await sut.handle(httpRequest);

		expect(httpResponse.statusCode).toBe(HttpStatusCode.serverError);
		expect(httpResponse.body).toEqual(new ServerError());
	});

	it('should return 500 if AddAccount throws an exception', async () => {
		const { sut, addAccountStub } = makeSut();
		const password = faker.internet.password();

		jest
			.spyOn(addAccountStub, 'add')
			.mockImplementationOnce(() => Promise.reject(new Error('')));

		const httpRequest = {
			body: {
				name: faker.name.fullName(),
				email: faker.internet.email(),
				password,
				passwordConfirmation: password,
			},
		};

		const httpResponse = await sut.handle(httpRequest);

		expect(httpResponse.statusCode).toBe(HttpStatusCode.serverError);
		expect(httpResponse.body).toEqual(new ServerError());
	});

	it('should call AddAccount with correct values', async () => {
		const { sut, addAccountStub } = makeSut();
		const addSpy = jest.spyOn(addAccountStub, 'add');
		const password = faker.internet.password();

		const httpRequest = {
			body: {
				name: faker.name.fullName(),
				email: faker.internet.email(),
				password,
				passwordConfirmation: password,
			},
		};

		await sut.handle(httpRequest);

		expect(addSpy).toHaveBeenCalledWith({
			name: httpRequest.body.name,
			email: httpRequest.body.email,
			password: httpRequest.body.password,
		});
	});

	it('should return 200 if valid data is provided', async () => {
		const { sut } = makeSut();
		const password = faker.internet.password();

		const httpRequest = {
			body: {
				name: faker.name.fullName(),
				email: faker.internet.email(),
				password,
				passwordConfirmation: password,
			},
		};

		const httpResponse = await sut.handle(httpRequest);

		expect(httpResponse.statusCode).toBe(HttpStatusCode.ok);
		expect(httpResponse.body).toEqual({
			id: httpResponse.body.id,
			name: httpRequest.body.name,
			email: httpRequest.body.email,
			password: httpRequest.body.password,
		});
	});
});
