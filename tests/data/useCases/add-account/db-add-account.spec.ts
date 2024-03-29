import type {
	AddAccountModel,
	AddAccountRepository,
} from '@data/useCases/add-account';
import { DbAddAccount } from '@data/useCases/add-account';
import { faker } from '@faker-js/faker';

import { EncrypterStub, AddAccountRepositoryStub } from '../../test';

type SutTypes = {
	sut: DbAddAccount;
	encrypterStub: EncrypterStub;
	addAccountRepositoryStub: AddAccountRepository;
};

function makeSut(): SutTypes {
	const encrypterStub = new EncrypterStub();
	const addAccountRepositoryStub = new AddAccountRepositoryStub();
	const sut = new DbAddAccount(encrypterStub, addAccountRepositoryStub);

	return {
		sut,
		encrypterStub,
		addAccountRepositoryStub,
	};
}

function makeAccountData(): AddAccountModel {
	return {
		name: faker.name.fullName(),
		email: faker.internet.email(),
		password: faker.internet.password(),
	};
}

describe('DbAddAccount UseCase', () => {
	it('should call Encrypter with correct password', async () => {
		const { encrypterStub, sut } = makeSut();
		const encryptSpy = jest.spyOn(encrypterStub, 'encrypt');

		const accountData = makeAccountData();

		await sut.add(accountData);

		expect(encryptSpy).toHaveBeenCalledWith(accountData.password);
	});

	it('should throw an Exception if Encrypter throws an Exception', async () => {
		const { encrypterStub, sut } = makeSut();

		jest
			.spyOn(encrypterStub, 'encrypt')
			.mockReturnValueOnce(Promise.reject(new Error()));

		const accountData = makeAccountData();

		const promise = sut.add(accountData);

		await expect(promise).rejects.toThrow();
	});

	it('should call AddAccountRepository with correct values', async () => {
		const { addAccountRepositoryStub, encrypterStub, sut } = makeSut();

		const addSpy = jest.spyOn(addAccountRepositoryStub, 'add');

		const accountData = makeAccountData();

		await sut.add(accountData);

		expect(addSpy).toHaveBeenCalledWith({
			...accountData,
			password: encrypterStub.hashedPassword,
		});
	});

	it('should throw an Exception if AddAccountRepository throws an Exception', async () => {
		const { addAccountRepositoryStub, sut } = makeSut();

		jest
			.spyOn(addAccountRepositoryStub, 'add')
			.mockReturnValueOnce(Promise.reject(new Error()));

		const accountData = makeAccountData();

		const promise = sut.add(accountData);

		await expect(promise).rejects.toThrow();
	});

	it('should return an account on success', async () => {
		const { sut, encrypterStub } = makeSut();

		const accountData = makeAccountData();

		const account = await sut.add(accountData);

		expect(account).toEqual({
			...accountData,
			id: account.id,
			password: encrypterStub.hashedPassword,
		});
	});
});
