/**
 * Project janux-persistence
 * Created by ernesto on 6/19/17.
 */
var chai = require('chai');
var expect = chai.expect;
var config = require('config');
//Config files
var serverAppContext = config.get("serverAppContext");
var PermissionBitEntity = require("../../../dist/index").PermissionBitEntity;
var PermissionBitValidator = require("../../../dist/index").PermissionBitValidator;

const name = "A name";
const description = "A description";
const position = 0;
const idAuthContext = "1000000";

describe("Testing permission bit validator validation", function () {
    describe("When validating with correct values", function () {
        it("The method should not return an error", function () {
            var permissionBit = new PermissionBitEntity(name, description, position, idAuthContext);
            var errors = PermissionBitValidator.validatePermissionBit(permissionBit);
            expect(errors.length).eq(0);
        });
    });

    describe("When validating with incorrect values", function () {
        it("The method should not return an error", function () {
            var permissionBit = new PermissionBitEntity("   ", "   ", "2", "   ");
            var errors = PermissionBitValidator.validatePermissionBit(permissionBit);
            expect(errors.length).eq(4);
        });
    });
});