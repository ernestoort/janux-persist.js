/**
 * Project janux-persistence
 * Created by ernesto on 6/21/17.
 */
var chai = require('chai');
var expect = chai.expect;
var PersonEntity = require("../../../../dist/index").PersonEntity;
var OrganizationEntity = require("../../../../dist/index").OrganizationEntity;
var PhoneNumber = require("../../../../dist/index").PhoneNumber;
var PartyValidator = require("../../../../dist/index").PartyValidator;
var EmailAddress = require("../../../../dist/index").EmailAddress;
var PostalAddress = require("../../../../dist/index").PostalAddress;

const idAccount = "313030303030303030303037";
const name = "John";
const displayName = "John display";
const middleName = "Doe";
const email = "glarus@mail.com";
const email2 = "glarus_sales@mail.com";
const work = "work";
const home = "home";
const phone = "55-55-55-55";
const phone2 = "55-55-55-56";
const cityText = "Mexico city";
const stateText = "CDMX";
const countryIsoCode = "MX";
const address = "An address";
const postalCode = "05000";


describe("Party validator", function () {

    describe("When validating a person with correct values", function () {
        it("The method should not return an error", function () {
            var person = new PersonEntity();
            person.idAccount = idAccount;
            person.displayName = displayName;
            person.name.first = name;
            person.name.middle = middleName;
            person.type = PartyValidator.PERSON;
            person.emails.push(new EmailAddress(work, true, email));
            var errors = PartyValidator.validateParty(person);
            expect(errors.length).eq(0);
        })
    });

    describe("When validating a organization with correct values", function () {
        it("The method should not return an error", function () {
            var organization = new OrganizationEntity();
            organization.type = PartyValidator.ORGANIZATION;
            organization.displayName = displayName;
            organization.idAccount = undefined;
            organization.name = name;
            organization.emails.push(new EmailAddress(work, true, email));
            var errors = PartyValidator.validateParty(organization);
            expect(errors.length).eq(0);
        })
    });

    describe("When validating a person with empty accountId", function () {
        it("The method should not return an error", function () {
            var person = new PersonEntity();
            person.displayName = displayName;
            person.idAccount = "   ";
            person.name.first = name;
            person.name.middle = middleName;
            person.type = PartyValidator.PERSON;
            person.emails.push(new EmailAddress(work, true, email));
            var errors = PartyValidator.validateParty(person);
            expect(errors.length).eq(1);
            expect(errors[0].attribute).eq(PartyValidator.ID_ACCOUNT);
            expect(errors[0].message).eq(PartyValidator.ID_ACCOUNT_NOT_UNDEFINED);
        })
    });

    describe("When validating a person with null accountId", function () {
        it("The method should not return an error", function () {
            var person = new PersonEntity();
            person.displayName = displayName;
            person.idAccount = null;
            person.name.first = name;
            person.name.middle = middleName;
            person.type = PartyValidator.PERSON;
            person.emails.push(new EmailAddress(work, true, email));
            var errors = PartyValidator.validateParty(person);
            expect(errors.length).eq(1);
            expect(errors[0].attribute).eq(PartyValidator.ID_ACCOUNT);
            expect(errors[0].message).eq(PartyValidator.ID_ACCOUNT_NOT_UNDEFINED);
        })
    });

    describe("When validating a party with no emails", function () {
        it("The method should return an error", function () {
            var person = new PersonEntity();
            person.idAccount = idAccount;
            person.displayName = displayName;
            person.name.first = name;
            person.name.middle = middleName;
            person.type = PartyValidator.PERSON;
            var errors = PartyValidator.validateParty(person);
            expect(errors.length).eq(1);
            expect(errors[0].attribute).eq(PartyValidator.CONTACTS_EMAILS);
            expect(errors[0].message).eq(PartyValidator.AT_LEAST_ONE_EMAIL);
        });
    });

    describe("When validating a party with duplicated email addresses", function () {
        it("The method should return an error", function () {
            var person = new PersonEntity();
            person.idAccount = idAccount;
            person.displayName = displayName;
            person.name.first = name;
            person.name.middle = middleName;
            person.type = PartyValidator.PERSON;
            person.emails.push(new EmailAddress(work, true, email));
            person.emails.push(new EmailAddress(home, false, email));
            var errors = PartyValidator.validateParty(person);
            expect(errors.length).eq(1);
            expect(errors[0].attribute).eq(PartyValidator.CONTACTS_EMAILS);
            expect(errors[0].message).eq(PartyValidator.DUPLICATED_EMAILS);
        });
    });

    describe("When validating a party with no valid type", function () {
        it("The method should return an error", function () {
            var person = new PersonEntity();
            person.idAccount = idAccount;
            person.displayName = displayName;
            person.name.first = name;
            person.name.middle = middleName;
            person.type = "  ";
            var errors = PartyValidator.validateParty(person);
            expect(errors.length).eq(1);
            expect(errors[0].attribute).eq(PartyValidator.TYPE);
            expect(errors[0].message).eq(PartyValidator.TYPE_EMPTY);

            person = new PersonEntity();
            person.idAccount = idAccount;
            person.displayName = displayName;
            person.name.first = name;
            person.name.middle = middleName;
            person.type = "invalid";
            errors = PartyValidator.validateParty(person);
            expect(errors.length).eq(1);
            expect(errors[0].attribute).eq(PartyValidator.TYPE);
            expect(errors[0].message).eq("Type is not " + PartyValidator.PERSON + " or " + PartyValidator.ORGANIZATION);
        });
    });

    describe("When validating emails with no primary email", function () {
        it("The method should return an error", function () {
            var person = new PersonEntity();
            person.idAccount = idAccount;
            person.displayName = displayName;
            person.name.first = name;
            person.name.middle = middleName;
            person.type = PartyValidator.PERSON;
            person.emails.push(new EmailAddress(work, false, email));
            person.emails.push(new EmailAddress(home, false, email2));
            var errors = PartyValidator.validateParty(person);
            expect(errors.length).eq(1);
            expect(errors[0].attribute).eq(PartyValidator.CONTACTS_EMAILS);
            expect(errors[0].message).eq(PartyValidator.NO_PRIMARY_CONTACT);
        })
    });

    describe("When validating emails with more than one email marked as primary", function () {
        it("The method should return an error", function () {
            var person = new PersonEntity();
            person.idAccount = idAccount;
            person.displayName = displayName;
            person.name.first = name;
            person.name.middle = middleName;
            person.type = PartyValidator.PERSON;
            person.emails.push(new EmailAddress(work, true, email));
            person.emails.push(new EmailAddress(home, true, email2));
            var errors = PartyValidator.validateParty(person);
            expect(errors.length).eq(1);
            expect(errors[0].attribute).eq(PartyValidator.CONTACTS_EMAILS);
            expect(errors[0].message).eq(PartyValidator.MORE_THAN_ONE_PRIMARY_CONTACT);
        })
    });


    describe("When validating phones with no primary phone", function () {
        it("The method should return an error", function () {
            var person = new PersonEntity();
            person.idAccount = idAccount;
            person.displayName = displayName;
            person.name.first = name;
            person.name.middle = middleName;
            person.type = PartyValidator.PERSON;
            person.emails.push(new EmailAddress(work, true, email));
            person.phones.push(new PhoneNumber(home, false, phone, "", "", ""));
            person.phones.push(new PhoneNumber(work, false, phone2, "", "", ""));
            var errors = PartyValidator.validateParty(person);
            expect(errors.length).eq(1);
            expect(errors[0].attribute).eq(PartyValidator.CONTACT_PHONE_NUMBER);
            expect(errors[0].message).eq(PartyValidator.NO_PRIMARY_CONTACT);
        })
    });

    describe("When validating phones with more than one phone marked as primary", function () {
        it("The method should return an error", function () {
            var person = new PersonEntity();
            person.idAccount = idAccount;
            person.displayName = displayName;
            person.name.first = name;
            person.name.middle = middleName;
            person.type = PartyValidator.PERSON;
            person.emails.push(new EmailAddress(work, true, email));
            person.phones.push(new PhoneNumber(home, true, phone, "", "", ""));
            person.phones.push(new PhoneNumber(work, true, phone2, "", "", ""));
            var errors = PartyValidator.validateParty(person);
            expect(errors.length).eq(1);
            expect(errors[0].attribute).eq(PartyValidator.CONTACT_PHONE_NUMBER);
            expect(errors[0].message).eq(PartyValidator.MORE_THAN_ONE_PRIMARY_CONTACT);
        })
    });


    describe("When validating phones with no primary postal address", function () {
        it("The method should return an error", function () {
            var person = new PersonEntity();
            person.idAccount = idAccount;
            person.displayName = displayName;
            person.name.first = name;
            person.name.middle = middleName;
            person.type = PartyValidator.PERSON;
            person.emails.push(new EmailAddress(work, true, email));
            person.addresses.push(new PostalAddress(
                home,
                false,
                address,
                "",
                "",
                cityText,
                null,
                postalCode,
                stateText,
                null,
                countryIsoCode));
            person.addresses.push(new PostalAddress(
                work,
                false,
                address,
                "",
                "",
                cityText,
                null,
                postalCode,
                stateText,
                null,
                countryIsoCode));
            var errors = PartyValidator.validateParty(person);
            expect(errors.length).eq(1);
            expect(errors[0].attribute).eq(PartyValidator.CONTACT_ADDRESSES);
            expect(errors[0].message).eq(PartyValidator.NO_PRIMARY_CONTACT);
        })
    });

    describe("When validating phones with more than one postal address marked as primary", function () {
        it("The method should return an error", function () {
            var person = new PersonEntity();
            person.idAccount = idAccount;
            person.displayName = displayName;
            person.name.first = name;
            person.name.middle = middleName;
            person.type = PartyValidator.PERSON;
            person.emails.push(new EmailAddress(work, true, email));
            person.addresses.push(new PostalAddress(
                home,
                true,
                address,
                "",
                "",
                cityText,
                null,
                postalCode,
                stateText,
                null,
                countryIsoCode));
            person.addresses.push(new PostalAddress(
                work,
                true,
                address,
                "",
                "",
                cityText,
                null,
                postalCode,
                stateText,
                null,
                countryIsoCode));
            var errors = PartyValidator.validateParty(person);
            expect(errors.length).eq(1);
            expect(errors[0].attribute).eq(PartyValidator.CONTACT_ADDRESSES);
            expect(errors[0].message).eq(PartyValidator.MORE_THAN_ONE_PRIMARY_CONTACT);
        })
    });
});
